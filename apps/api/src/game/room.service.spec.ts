import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';
import { RedisService } from '../redis/redis.service';

describe('RoomService - Multi-Node Distributed Timer & Recovery Test', () => {
  let nodeA: RoomService;
  let nodeB: RoomService;
  let redisService: RedisService;
  let mockPrisma: any;
  let mockAchievements: any;

  beforeEach(async () => {
    mockPrisma = {
      question: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'q1', questionText: '1+1', type: 'MULTIPLE_CHOICE', baseScore: 100, options: ['2', '3'] },
          { id: 'q2', questionText: '2+2', type: 'MULTIPLE_CHOICE', baseScore: 100, options: ['4', '5'] },
        ]),
      },
      answer: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    mockAchievements = {
      evaluateMatchAchievements: jest.fn().mockResolvedValue([]),
    };

    redisService = new RedisService();
    await redisService.onModuleInit();

    const moduleA: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: RedisService, useValue: redisService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AchievementsService, useValue: mockAchievements },
      ],
    }).compile();

    const moduleB: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: RedisService, useValue: redisService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AchievementsService, useValue: mockAchievements },
      ],
    }).compile();

    nodeA = moduleA.get<RoomService>(RoomService);
    nodeB = moduleB.get<RoomService>(RoomService);

    const mockServer = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;

    nodeA.setServer(mockServer);
    nodeB.setServer(mockServer);

    await redisService.onModuleInit();
  });

  afterEach(async () => {
    await redisService.onModuleDestroy();
  });

  it('should allow Node B to recover and advance an orphaned match when Node A crashes in the middle of a question', async () => {
    const matchId = 'match-crash-test-123';
    const player1 = { userId: 'u1', socketId: 's1', username: 'P1' };
    const player2 = { userId: 'u2', socketId: 's2', username: 'P2' };

    // 1. Node A creates room
    await nodeA.createRoom(matchId, player1, player2, ['q1', 'q2'], 'ARENA');

    // 2. Simulate question expired 5 seconds ago in Redis
    const roomState = await redisService.get<any>(`mba:game_room:${matchId}`);
    expect(roomState).toBeDefined();

    roomState.endTime = Date.now() - 5000; // Expired 5 seconds ago
    await redisService.set(`mba:game_room:${matchId}`, roomState);

    // 3. Simulate Node A CRASH: clear Node A's local in-memory room map
    (nodeA as any).rooms.clear();
    if ((nodeA as any).scanInterval) clearInterval((nodeA as any).scanInterval);

    // 4. Node B runs health scanner checkOrphanedMatchTimers()
    await nodeB.checkOrphanedMatchTimers();

    // 5. Verify Node B took over, hydrated the room, and advanced the state
    const nodeBRoom = nodeB.getRoom(matchId);
    expect(nodeBRoom).toBeDefined();
    expect(nodeBRoom?.players['u1'].submittedAnswerThisQuestion).toBe(true);
    expect(nodeBRoom?.players['u1'].chosenOption).toBe('TIMEOUT');
  });
});
