import { PrismaClient, RoleName, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load dotenv from root
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = [
    { name: RoleName.PLAYER, description: 'Pemain Math Battle Arena' },
    { name: RoleName.ADMIN, description: 'Pengelola sistem' },
    { name: RoleName.MODERATOR, description: 'Pengawas room dan laporan' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });

  // 2. Default Admin
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      email: 'admin@mathbattle.com',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Default Stats and Rankings for Admin
  await prisma.ranking.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      ratingPoint: 1000,
      tier: 'Bronze',
    },
  });

  await prisma.userStats.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      totalDraws: 0,
      totalQuestionsAnswered: 0,
      totalCorrectAnswers: 0,
      accuracy: 0.0,
      winRate: 0.0,
    },
  });

  // 3. Question Categories
  const categories = [
    { name: 'Aritmetika', description: 'Operasi dasar matematika seperti penjumlahan, pengurangan, perkalian, dan pembagian.' },
    { name: 'Aljabar', description: 'Persamaan linear, faktorisasi kuadrat, dan penyederhanaan variabel.' },
    { name: 'Geometri', description: 'Perhitungan luas, keliling, volume, dan geometri sudut.' },
    { name: 'Pecahan', description: 'Operasi pertambahan, pengurangan, perkalian, dan pembagian pecahan.' },
    { name: 'Persamaan Linear', description: 'Sistem persamaan linear satu dan dua variabel.' },
  ];

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const dbCategory = await prisma.questionCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    categoryMap.set(category.name, dbCategory.id);
  }

  // 4. Achievements
  const achievements = [
    { name: 'First Win', description: 'Menang pertama kali dalam mode duel 1v1.', conditionType: 'win_count', conditionValue: 1, rewardPoint: 50 },
    { name: 'Sharp Shooter', description: 'Menyelesaikan duel dengan akurasi 100%.', conditionType: 'accuracy', conditionValue: 100, rewardPoint: 100 },
    { name: 'Battle Master', description: 'Menang 10 kali dalam mode duel.', conditionType: 'win_count', conditionValue: 10, rewardPoint: 200 },
    { name: 'Streak Master', description: 'Capai kemenangan beruntun (streak) sebanyak 5 kali.', conditionType: 'win_streak', conditionValue: 5, rewardPoint: 150 },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }

  // 5. Bank Soal (30 Soal Real)
  const questions = [
    // --- ARITMETIKA ---
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 12 x 8 + 4?',
      options: { A: '96', B: '100', C: '104', D: '108' },
      correctAnswer: 'B',
      explanation: 'Perkalian dilakukan terlebih dahulu: 12 x 8 = 96. Kemudian ditambah 4: 96 + 4 = 100.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 120 - 45 + 15?',
      options: { A: '90', B: '60', C: '75', D: '80' },
      correctAnswer: 'A',
      explanation: 'Pengurangan terlebih dahulu: 120 - 45 = 75. Kemudian ditambah 15: 75 + 15 = 90.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 72 / 9 x 4?',
      options: { A: '32', B: '8', C: '16', D: '24' },
      correctAnswer: 'A',
      explanation: 'Operasi pembagian dan perkalian setara, lakukan dari kiri: 72 / 9 = 8. Kemudian 8 x 4 = 32.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 3 x 4 + 5 x 6?',
      options: { A: '42', B: '36', C: '48', D: '38' },
      correctAnswer: 'A',
      explanation: 'Perkalian dilakukan terlebih dahulu: (3 x 4) = 12 dan (5 x 6) = 30. Kemudian dijumlahkan: 12 + 30 = 42.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 15 + 24 / 3?',
      options: { A: '13', B: '23', C: '17', D: '21' },
      correctAnswer: 'B',
      explanation: 'Pembagian dilakukan terlebih dahulu: 24 / 3 = 8. Kemudian dijumlahkan: 15 + 8 = 23.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari (14 x 5) - (48 / 6)?',
      options: { A: '62', B: '70', C: '58', D: '64' },
      correctAnswer: 'A',
      explanation: 'Hitung masing-masing kurung: 14 x 5 = 70 dan 48 / 6 = 8. Pengurangan: 70 - 8 = 62.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 25 x 4 + 75 / 5?',
      options: { A: '115', B: '120', C: '105', D: '110' },
      correctAnswer: 'A',
      explanation: 'Hitung perkalian dan pembagian: 25 x 4 = 100 dan 75 / 5 = 15. Jumlahkan: 100 + 15 = 115.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari (15 x 6) - (120 / 8) + 13?',
      options: { A: '88', B: '92', C: '85', D: '98' },
      correctAnswer: 'A',
      explanation: 'Hitung perkalian: 15 x 6 = 90. Hitung pembagian: 120 / 8 = 15. Kurangi dan jumlahkan: 90 - 15 + 13 = 88.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },

    // --- ALJABAR ---
    {
      categoryName: 'Aljabar',
      questionText: 'Jika 2x + 5 = 15, berapakah nilai x?',
      options: { A: '5', B: '10', C: '15', D: '7' },
      correctAnswer: 'A',
      explanation: 'Pindahkan konstanta: 2x = 15 - 5 => 2x = 10. Bagi kedua sisi: x = 5.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika x - 7 = 12, berapakah nilai x?',
      options: { A: '19', B: '5', C: '12', D: '15' },
      correctAnswer: 'A',
      explanation: 'Pindahkan konstanta ke kanan: x = 12 + 7 => x = 19.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika 3x = 27, berapakah nilai x?',
      options: { A: '9', B: '6', C: '7', D: '8' },
      correctAnswer: 'A',
      explanation: 'Bagi kedua sisi dengan 3: x = 27 / 3 => x = 9.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika 3x - 4 = 2x + 6, berapakah nilai x?',
      options: { A: '10', B: '2', C: '8', D: '6' },
      correctAnswer: 'A',
      explanation: 'Kelompokkan variabel di kiri dan konstanta di kanan: 3x - 2x = 6 + 4 => x = 10.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika 4x + 7 = 23, berapakah nilai 2x?',
      options: { A: '8', B: '4', C: '16', D: '12' },
      correctAnswer: 'A',
      explanation: 'Selesaikan x terlebih dahulu: 4x = 23 - 7 => 4x = 16 => x = 4. Maka nilai 2x = 2(4) = 8.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Faktorkan persamaan x^2 - 9 = 0. Manakah nilai x yang memenuhi?',
      options: { A: '3 dan -3', B: '3 dan 0', C: '9 dan -9', D: '1 dan -9' },
      correctAnswer: 'A',
      explanation: 'x^2 - 9 = (x - 3)(x + 3) = 0. Sehingga x = 3 atau x = -3.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika x + y = 10 dan 2x - y = 8, berapakah nilai x dan y?',
      options: { A: 'x = 6, y = 4', B: 'x = 5, y = 5', C: 'x = 7, y = 3', D: 'x = 4, y = 6' },
      correctAnswer: 'A',
      explanation: 'Jumlahkan kedua persamaan: (x + y) + (2x - y) = 10 + 8 => 3x = 18 => x = 6. Substitusikan: 6 + y = 10 => y = 4.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },

    // --- GEOMETRI ---
    {
      categoryName: 'Geometri',
      questionText: 'Berapakah luas segitiga dengan alas 8 cm dan tinggi 5 cm?',
      options: { A: '20 cm²', B: '40 cm²', C: '15 cm²', D: '25 cm²' },
      correctAnswer: 'A',
      explanation: 'Rumus luas segitiga: L = (alas x tinggi) / 2 = (8 x 5) / 2 = 40 / 2 = 20 cm².',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Berapakah keliling persegi dengan panjang sisi 6 cm?',
      options: { A: '24 cm', B: '36 cm', C: '12 cm', D: '18 cm' },
      correctAnswer: 'A',
      explanation: 'Keliling persegi: K = 4 x sisi = 4 x 6 = 24 cm.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Sebuah lingkaran memiliki jari-jari 7 cm. Berapakah kelilingnya? (pi = 22/7)',
      options: { A: '44 cm', B: '154 cm', C: '22 cm', D: '88 cm' },
      correctAnswer: 'A',
      explanation: 'Keliling lingkaran: K = 2 x pi x r = 2 x 22/7 x 7 = 44 cm.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Berapakah volume balok dengan panjang 8 cm, lebar 5 cm, and tinggi 4 cm?',
      options: { A: '160 cm³', B: '80 cm³', C: '120 cm³', D: '200 cm³' },
      correctAnswer: 'A',
      explanation: 'Volume balok: V = p x l x t = 8 x 5 x 4 = 160 cm³.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Berapakah panjang sisi miring (hipotenusa) segitiga siku-siku dengan alas 6 cm and tinggi 8 cm?',
      options: { A: '10 cm', B: '14 cm', C: '12 cm', D: '9 cm' },
      correctAnswer: 'A',
      explanation: 'Gunakan teorema Pythagoras: c^2 = a^2 + b^2 = 6^2 + 8^2 = 36 + 64 = 100. Sisi miring = akar(100) = 10 cm.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Sebuah tabung memiliki jari-jari alas 7 cm dan tinggi 10 cm. Berapakah volume tabung tersebut? (pi = 22/7)',
      options: { A: '1540 cm³', B: '770 cm³', C: '3080 cm³', D: '15400 cm³' },
      correctAnswer: 'A',
      explanation: 'Volume tabung: V = pi x r^2 x t = 22/7 x 7 x 7 x 10 = 154 x 10 = 1540 cm³.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },

    // --- PECAHAN ---
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari 1/2 + 1/4?',
      options: { A: '3/4', B: '2/6', C: '1/2', D: '3/8' },
      correctAnswer: 'A',
      explanation: 'Samakan penyebut: 1/2 + 1/4 = 2/4 + 1/4 = 3/4.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari 2/3 - 1/3?',
      options: { A: '1/3', B: '1/6', C: '1/9', D: '2/9' },
      correctAnswer: 'A',
      explanation: 'Karena penyebut sudah sama, kurangkan pembilangnya: 2/3 - 1/3 = 1/3.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari 3/5 x 2/3?',
      options: { A: '2/5', B: '5/8', C: '6/8', D: '9/10' },
      correctAnswer: 'A',
      explanation: 'Kalikan pembilang dengan pembilang, penyebut dengan penyebut: (3 x 2) / (5 x 3) = 6/15 = 2/5.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari 3/4 + 5/6?',
      options: { A: '1 7/12', B: '1 1/2', C: '1 5/12', D: '1 3/4' },
      correctAnswer: 'A',
      explanation: 'Samakan penyebut ke 12: 3/4 + 5/6 = 9/12 + 10/12 = 19/12 = 1 7/12.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari (2/3 + 1/6) / (1/2)?',
      options: { A: '1 2/3', B: '1 1/2', C: '1 1/3', D: '2' },
      correctAnswer: 'A',
      explanation: 'Jumlahkan di dalam kurung: 2/3 + 1/6 = 4/6 + 1/6 = 5/6. Bagi dengan 1/2: 5/6 x 2/1 = 10/6 = 1 2/3.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari 5/8 x 4/5 - 1/10?',
      options: { A: '2/5', B: '3/10', C: '1/2', D: '9/20' },
      correctAnswer: 'A',
      explanation: 'Lakukan perkalian dulu: 5/8 x 4/5 = 1/2. Kemudian kurangi: 1/2 - 1/10 = 5/10 - 1/10 = 4/10 = 2/5.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },

    // --- PERSAMAAN LINEAR ---
    {
      categoryName: 'Persamaan Linear',
      questionText: 'Tentukan nilai y dari persamaan 3y - 6 = 12.',
      options: { A: '6', B: '3', C: '4', D: '5' },
      correctAnswer: 'A',
      explanation: 'Pindahkan konstanta: 3y = 12 + 6 => 3y = 18. Bagi kedua sisi: y = 6.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Persamaan Linear',
      questionText: 'Tentukan nilai x dari persamaan 5x - 3 = 2x + 9.',
      options: { A: '4', B: '3', C: '2', D: '5' },
      correctAnswer: 'A',
      explanation: 'Kumpulkan variabel dan konstanta: 5x - 2x = 9 + 3 => 3x = 12 => x = 4.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Persamaan Linear',
      questionText: 'Sistem persamaan linear dua variabel: 3x + 2y = 12 dan x - y = 4. Berapakah nilai x dan y?',
      options: { A: 'x = 4, y = 0', B: 'x = 3, y = 1', C: 'x = 5, y = -1', D: 'x = 2, y = 3' },
      correctAnswer: 'A',
      explanation: 'Dari persamaan kedua: x = y + 4. Substitusikan ke persamaan pertama: 3(y + 4) + 2y = 12 => 3y + 12 + 2y = 12 => 5y = 0 => y = 0. Maka x = 0 + 4 = 4.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
  ];

  for (const q of questions) {
    const categoryId = categoryMap.get(q.categoryName);
    if (!categoryId) {
      console.warn(`Category not found: ${q.categoryName}`);
      continue;
    }

    await prisma.question.create({
      data: {
        categoryId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        baseScore: q.baseScore,
        createdById: adminUser.id,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
