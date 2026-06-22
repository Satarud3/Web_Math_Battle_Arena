import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Check grandparent and great-grandparent directories for .env
const envPath = path.join(__dirname, '..', '..', '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error(`Could not find env file at: ${envPath}`);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const answers = await prisma.answer.findMany({
    take: 10,
    orderBy: {
      submittedAt: 'desc',
    },
    include: {
      question: true,
      user: true,
    }
  });

  console.log('--- LAST 10 ANSWERS ---');
  for (const a of answers) {
    console.log(`User: @${a.user.username}`);
    console.log(`Question text: "${a.question.questionText}"`);
    console.log(`Selected Answer (Client): "${a.selectedAnswer}"`);
    console.log(`Correct Answer (DB): "${a.question.correctAnswer}"`);
    console.log(`Is Correct (DB Evaluated): ${a.isCorrect}`);
    console.log(`Score Earned: ${a.scoreEarned}`);
    console.log('----------------------');
  }
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
