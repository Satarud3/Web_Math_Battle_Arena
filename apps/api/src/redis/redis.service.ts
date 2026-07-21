import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  // In-memory fallback datastructures if Redis is not available
  private fallbackStore = new Map<string, any>();
  private fallbackHashes = new Map<string, Map<string, any>>();
  private fallbackLists = new Map<string, any[]>();

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.logger.log(`Attempting to connect to Redis at ${redisUrl}...`);
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            return null; // Stop retrying, switch to fallback
          }
          return Math.min(times * 200, 1000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis Server! State is now shared across instances.');
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          this.logger.warn(`Redis connection error: ${err.message}. Operating in fallback mode.`);
        }
        this.isConnected = false;
      });

      await this.client.connect().catch((err) => {
        this.logger.warn(`Could not connect to Redis (${err.message}). Activating In-Memory Fallback Mode.`);
        this.isConnected = false;
      });
    } catch (err: any) {
      this.logger.warn(`Redis initialization failed: ${err.message}. Using In-Memory Fallback.`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  getClient(): Redis | null {
    return this.client;
  }

  // --- Generic Value Get / Set / Del ---

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (e) {
        this.logger.warn(`Redis get error for ${key}, checking fallback`);
      }
    }
    const val = this.fallbackStore.get(key);
    return val !== undefined ? (val as T) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringified = JSON.stringify(value);
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, stringified, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, stringified);
        }
        return;
      } catch (e) {
        this.logger.warn(`Redis set error for ${key}`);
      }
    }
    this.fallbackStore.set(key, value);
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (e) {
        this.logger.warn(`Redis del error for ${key}`);
      }
    }
    this.fallbackStore.delete(key);
    this.fallbackHashes.delete(key);
    this.fallbackLists.delete(key);
  }

  // --- Distributed Lock & Set Operations ---

  async acquireLock(lockKey: string, ttlMs = 5000): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        const result = await this.client.set(lockKey, 'locked', 'PX', ttlMs, 'NX');
        return result === 'OK';
      } catch (e: any) {
        this.logger.warn(`Redis acquireLock error for ${lockKey}: ${e.message}`);
      }
    }

    const now = Date.now();
    const existing = this.fallbackStore.get(lockKey);
    if (existing && existing.expireAt > now) {
      return false; // Lock held
    }
    this.fallbackStore.set(lockKey, { locked: true, expireAt: now + ttlMs });
    return true;
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.del(lockKey);
  }

  async sadd(key: string, member: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.sadd(key, member);
        return;
      } catch (e) {
        this.logger.warn(`Redis sadd error for ${key}`);
      }
    }
    let set = this.fallbackStore.get(key) as Set<string>;
    if (!set || !(set instanceof Set)) {
      set = new Set<string>();
      this.fallbackStore.set(key, set);
    }
    set.add(member);
  }

  async srem(key: string, member: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.srem(key, member);
        return;
      } catch (e) {
        this.logger.warn(`Redis srem error for ${key}`);
      }
    }
    const set = this.fallbackStore.get(key) as Set<string>;
    if (set && set instanceof Set) {
      set.delete(member);
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.smembers(key);
      } catch (e) {
        this.logger.warn(`Redis smembers error for ${key}`);
      }
    }
    const set = this.fallbackStore.get(key) as Set<string>;
    if (set && set instanceof Set) {
      return Array.from(set);
    }
    return [];
  }

  // --- Hash Get / Set / Del / GetAll ---

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.hget(key, field);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch (e) {
        this.logger.warn(`Redis hget error for ${key}:${field}`);
      }
    }
    const map = this.fallbackHashes.get(key);
    if (!map) return null;
    const val = map.get(field);
    return val !== undefined ? (val as T) : null;
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    const stringified = JSON.stringify(value);
    if (this.isConnected && this.client) {
      try {
        await this.client.hset(key, field, stringified);
        return;
      } catch (e) {
        this.logger.warn(`Redis hset error for ${key}:${field}`);
      }
    }
    if (!this.fallbackHashes.has(key)) {
      this.fallbackHashes.set(key, new Map());
    }
    this.fallbackHashes.get(key)!.set(field, value);
  }

  async hdel(key: string, field: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.hdel(key, field);
        return;
      } catch (e) {
        this.logger.warn(`Redis hdel error for ${key}:${field}`);
      }
    }
    const map = this.fallbackHashes.get(key);
    if (map) {
      map.delete(field);
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    if (this.isConnected && this.client) {
      try {
        const rawObj = await this.client.hgetall(key);
        const result: Record<string, T> = {};
        for (const [field, raw] of Object.entries(rawObj)) {
          try {
            result[field] = JSON.parse(raw) as T;
          } catch (e) {
            result[field] = raw as any;
          }
        }
        return result;
      } catch (e) {
        this.logger.warn(`Redis hgetall error for ${key}`);
      }
    }
    const map = this.fallbackHashes.get(key);
    if (!map) return {};
    const result: Record<string, T> = {};
    for (const [field, val] of map.entries()) {
      result[field] = val as T;
    }
    return result;
  }

  // --- List Operations ---

  async lpush(key: string, value: any): Promise<void> {
    const stringified = JSON.stringify(value);
    if (this.isConnected && this.client) {
      try {
        await this.client.lpush(key, stringified);
        return;
      } catch (e) {
        this.logger.warn(`Redis lpush error for ${key}`);
      }
    }
    if (!this.fallbackLists.has(key)) {
      this.fallbackLists.set(key, []);
    }
    this.fallbackLists.get(key)!.unshift(value);
  }

  async lrange<T>(key: string, start = 0, stop = -1): Promise<T[]> {
    if (this.isConnected && this.client) {
      try {
        const rawItems = await this.client.lrange(key, start, stop);
        return rawItems.map((raw) => JSON.parse(raw) as T);
      } catch (e) {
        this.logger.warn(`Redis lrange error for ${key}`);
      }
    }
    const list = this.fallbackLists.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end) as T[];
  }

  async lrem(key: string, count: number, valueMatcher: (item: any) => boolean): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const items = await this.lrange<any>(key, 0, -1);
        for (const item of items) {
          if (valueMatcher(item)) {
            await this.client.lrem(key, count, JSON.stringify(item));
          }
        }
        return;
      } catch (e) {
        this.logger.warn(`Redis lrem error for ${key}`);
      }
    }
    const list = this.fallbackLists.get(key);
    if (list) {
      const filtered = list.filter((item) => !valueMatcher(item));
      this.fallbackLists.set(key, filtered);
    }
  }

  // --- Atomic Matchmaking Queue Lua Pop ---

  async popMatchPair<T>(queueKey: string, nowMs: number): Promise<[T, T] | null> {
    const luaScript = `
      local queueKey = KEYS[1]
      local nowMs = tonumber(ARGV[1])

      local rawItems = redis.call('LRANGE', queueKey, 0, -1)
      if #rawItems < 2 then
        return nil
      end

      local entries = {}
      for i, raw in ipairs(rawItems) do
        local status, decoded = pcall(cjson.decode, raw)
        if status and decoded then
          decoded._raw = raw
          table.insert(entries, decoded)
        end
      end

      table.sort(entries, function(a, b)
        local tA = a.joinedAtMs or 0
        local tB = b.joinedAtMs or 0
        return tA < tB
      end)

      for i = 1, #entries do
        local playerA = entries[i]
        local joinedAtA = playerA.joinedAtMs or nowMs
        local elapsedSecsA = (nowMs - joinedAtA) / 1000
        if elapsedSecsA < 0 then elapsedSecsA = 0 end
        local toleranceA = 300 + math.floor(elapsedSecsA * 15)

        for j = i + 1, #entries do
          local playerB = entries[j]
          if playerA.chosenMode == playerB.chosenMode then
            local joinedAtB = playerB.joinedAtMs or nowMs
            local elapsedSecsB = (nowMs - joinedAtB) / 1000
            if elapsedSecsB < 0 then elapsedSecsB = 0 end
            local toleranceB = 300 + math.floor(elapsedSecsB * 15)

            local ratingDiff = math.abs(playerA.ratingPoint - playerB.ratingPoint)
            local maxAllowedTolerance = math.max(toleranceA, toleranceB)

            if ratingDiff <= maxAllowedTolerance then
              redis.call('LREM', queueKey, 0, playerA._raw)
              redis.call('LREM', queueKey, 0, playerB._raw)
              return { playerA._raw, playerB._raw }
            end
          end
        end
      end

      return nil
    `;

    if (this.isConnected && this.client) {
      try {
        const result = (await this.client.eval(luaScript, 1, queueKey, nowMs.toString())) as string[] | null;
        if (result && result.length === 2) {
          return [JSON.parse(result[0]) as T, JSON.parse(result[1]) as T];
        }
        return null;
      } catch (e: any) {
        this.logger.warn(`Redis Lua popMatchPair error: ${e.message}`);
      }
    }

    // Synchronous In-Memory Fallback Atomic Scan & Remove
    const list = this.fallbackLists.get(queueKey) || [];
    if (list.length < 2) return null;

    list.sort((a, b) => (a.joinedAtMs || 0) - (b.joinedAtMs || 0));

    for (let i = 0; i < list.length; i++) {
      const playerA = list[i];
      const elapsedSecsA = (nowMs - (playerA.joinedAtMs || nowMs)) / 1000;
      const toleranceA = 300 + Math.floor(Math.max(0, elapsedSecsA) * 15);

      for (let j = i + 1; j < list.length; j++) {
        const playerB = list[j];
        if (playerA.chosenMode === playerB.chosenMode) {
          const elapsedSecsB = (nowMs - (playerB.joinedAtMs || nowMs)) / 1000;
          const toleranceB = 300 + Math.floor(Math.max(0, elapsedSecsB) * 15);

          const ratingDiff = Math.abs(playerA.ratingPoint - playerB.ratingPoint);
          const maxAllowedTolerance = Math.max(toleranceA, toleranceB);

          if (ratingDiff <= maxAllowedTolerance) {
            const remaining = list.filter((item) => item.userId !== playerA.userId && item.userId !== playerB.userId);
            this.fallbackLists.set(queueKey, remaining);
            return [playerA as T, playerB as T];
          }
        }
      }
    }

    return null;
  }
}
