import { Test, TestingModule } from '@nestjs/testing';
import { MatchmakingService } from './matchmaking.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from './room.service';
import { RedisService } from '../redis/redis.service';

describe('MatchmakingService - Concurrent Race Condition Test', () => {
  let service: MatchmakingService;
  let redisService: RedisService;
  let mockPrisma: any;
  let mockRoomService: any;

  beforeEach(async () => {
    mockPrisma = {
      ranking: {
        findUnique: jest.fn().mockResolvedValue({ ratingPoint: 1000 }),
      },
      question: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'q1', isActive: true },
          { id: 'q2', isActive: true },
        ]),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb({
          match: { create: jest.fn().mockResolvedValue({ id: 'match-123' }) },
          matchPlayer: { create: jest.fn().mockResolvedValue({}) },
        });
      }),
    };

    mockRoomService = {
      createRoom: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchmakingService,
        RedisService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RoomService, useValue: mockRoomService },
      ],
    }).compile();

    service = module.get<MatchmakingService>(MatchmakingService);
    redisService = module.get<RedisService>(RedisService);

    // Provide mock server to service
    service.setServer({
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      sockets: {
        sockets: new Map(),
      },
    } as any);

    // Initialize RedisService module
    await redisService.onModuleInit();
  });

  afterEach(async () => {
    await redisService.onModuleDestroy();
  });

  it('should prevent race conditions when 2 backend instances trigger scanQueue concurrently for the same player pool', async () => {
    const now = Date.now();
    const player1 = {
      userId: 'user-1',
      socketId: 'sock-1',
      username: 'gladiator1',
      ratingPoint: 1000,
      joinedAt: new Date(now).toISOString(),
      joinedAtMs: now,
      chosenMode: 'ARENA',
    };
    const player2 = {
      userId: 'user-2',
      socketId: 'sock-2',
      username: 'gladiator2',
      ratingPoint: 1020,
      joinedAt: new Date(now).toISOString(),
      joinedAtMs: now,
      chosenMode: 'ARENA',
    };
    const player3 = {
      userId: 'user-3',
      socketId: 'sock-3',
      username: 'gladiator3',
      ratingPoint: 1010,
      joinedAt: new Date(now).toISOString(),
      joinedAtMs: now,
      chosenMode: 'ARENA',
    };

    // Push 3 players into the matchmaking queue
    await redisService.lpush('mba:matchmaking_queue', player3);
    await redisService.lpush('mba:matchmaking_queue', player2);
    await redisService.lpush('mba:matchmaking_queue', player1);

    // Simulate 2 backend nodes running scanQueue concurrently
    const nodeAScan = service.scanQueue();
    const nodeBScan = service.scanQueue();

    await Promise.all([nodeAScan, nodeBScan]);

    // Verify: Exactly 1 match should be created from 3 players
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    // Verify: The remaining queue must have exactly 1 player left (not 0, not duplicated)
    const remainingQueue = await redisService.lrange<any>('mba:matchmaking_queue', 0, -1);
    expect(remainingQueue.length).toBe(1);
  });
});
