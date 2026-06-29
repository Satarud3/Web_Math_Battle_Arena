import { PrismaClient, RoleName, Difficulty, QuestionType } from '@prisma/client';
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
      tier: 'Silver',
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
    {
      code: 'FIRST_BLOOD',
      name: 'First Blood',
      description: 'Memenangkan duel 1v1 pertamamu.',
      icon: 'Target',
      requirementType: 'win_count',
      requirementValue: 1,
      rewardPoint: 50,
    },
    {
      code: 'FLAWLESS_VICTORY',
      name: 'Flawless',
      description: 'Mencapai Akurasi 100% dalam satu sesi duel.',
      icon: 'ShieldCheck',
      requirementType: 'accuracy',
      requirementValue: 100,
      rewardPoint: 100,
    },
    {
      code: 'ASSASSIN_INSTINCT',
      name: "Assassin's Instinct",
      description: 'Menjawab soal dengan benar dalam waktu kurang dari 3 detik.',
      icon: 'Zap',
      requirementType: 'speed',
      requirementValue: 3,
      rewardPoint: 100,
    },
    {
      code: 'UNSTOPPABLE',
      name: 'Unstoppable',
      description: 'Mencapai Win Streak 5 kali berturut-turut.',
      icon: 'Flame',
      requirementType: 'win_streak',
      requirementValue: 5,
      rewardPoint: 150,
    },
    {
      code: 'SCHOLAR',
      name: 'Hardcore Scholar',
      description: 'Menyelesaikan total 50 pertandingan (Practice/Duel).',
      icon: 'BookOpen',
      requirementType: 'total_matches',
      requirementValue: 50,
      rewardPoint: 200,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        requirementType: achievement.requirementType,
        requirementValue: achievement.requirementValue,
        rewardPoint: achievement.rewardPoint,
      },
      create: achievement,
    });
  }

  // 5. Clean up existing questions to prevent duplicates and seed new types
  await prisma.question.deleteMany({});

  // 32 Real Interactive Questions (8 types x 4 questions each)
  const questions = [
    // ─── 1. MULTIPLE_CHOICE (Pilihan Ganda Klasik) ───
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil dari 15 x 6 - 20?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: { A: '60', B: '70', C: '80', D: '90' },
      correctAnswer: 'B',
      questionData: { A: '60', B: '70', C: '80', D: '90' },
      answerData: 'B',
      explanation: 'Perkalian didahulukan: 15 x 6 = 90. Kemudian dikurangi 20: 90 - 20 = 70.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika 3x + 12 = 30, berapakah nilai x?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: { A: '4', B: '6', C: '8', D: '10' },
      correctAnswer: 'B',
      questionData: { A: '4', B: '6', C: '8', D: '10' },
      answerData: 'B',
      explanation: '3x = 30 - 12 => 3x = 18. Maka x = 18 / 3 = 6.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Berapakah luas selimut tabung dengan jari-jari 7 cm dan tinggi 10 cm? (pi = 22/7)',
      type: QuestionType.MULTIPLE_CHOICE,
      options: { A: '220 cm²', B: '440 cm²', C: '660 cm²', D: '880 cm²' },
      correctAnswer: 'B',
      questionData: { A: '220 cm²', B: '440 cm²', C: '660 cm²', D: '880 cm²' },
      answerData: 'B',
      explanation: 'Luas selimut tabung = 2 * pi * r * t = 2 * 22/7 * 7 * 10 = 440 cm².',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil dari 3/4 - 1/2?',
      type: QuestionType.MULTIPLE_CHOICE,
      options: { A: '1/4', B: '1/2', C: '1/8', D: '3/8' },
      correctAnswer: 'A',
      questionData: { A: '1/4', B: '1/2', C: '1/8', D: '3/8' },
      answerData: 'A',
      explanation: 'Samakan penyebutnya: 3/4 - 2/4 = 1/4.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 2. FILL_BLANK (Isian Angka Singkat) ───
    {
      categoryName: 'Aritmetika',
      questionText: 'Berapakah hasil desimal dari 2.5 x 3?',
      type: QuestionType.FILL_BLANK,
      correctAnswer: '7.5',
      questionData: null,
      answerData: '7.5',
      explanation: 'Perkalian langsung: 2.5 dikalikan 3 menghasilkan 7.5.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Jika x^2 - 16 = 9, dan x > 0, berapakah nilai x?',
      type: QuestionType.FILL_BLANK,
      correctAnswer: '5',
      questionData: null,
      answerData: '5',
      explanation: 'x^2 = 9 + 16 => x^2 = 25. Karena x > 0, maka x = 5.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Hitung tinggi segitiga (dalam cm) jika luasnya 35 cm² dan alasnya 10 cm.',
      type: QuestionType.FILL_BLANK,
      correctAnswer: '7',
      questionData: null,
      answerData: '7',
      explanation: 'Luas = 0.5 * alas * tinggi => 35 = 0.5 * 10 * tinggi => 35 = 5 * tinggi => tinggi = 7 cm.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Berapakah hasil desimal dari pecahan 3/5?',
      type: QuestionType.FILL_BLANK,
      correctAnswer: '0.6',
      questionData: null,
      answerData: '0.6',
      explanation: '3 dibagi 5 = 6 dibagi 10 = 0.6.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 3. TRUE_FALSE (Benar / Salah) ───
    {
      categoryName: 'Aritmetika',
      questionText: 'Apakah angka 17 merupakan bilangan prima?',
      type: QuestionType.TRUE_FALSE,
      correctAnswer: 'TRUE',
      questionData: { options: ['TRUE', 'FALSE'] },
      answerData: 'TRUE',
      explanation: 'Ya, 17 hanya memiliki dua faktor pembagi yaitu 1 dan dirinya sendiri.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Persamaan kuadrat x^2 + 4 = 0 memiliki dua akar real berbeda.',
      type: QuestionType.TRUE_FALSE,
      correctAnswer: 'FALSE',
      questionData: { options: ['TRUE', 'FALSE'] },
      answerData: 'FALSE',
      explanation: 'Salah, akar-akarnya adalah imajiner (x = ±2i) karena nilai diskriminannya D = -16 < 0.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Jumlah sudut dalam dari sebuah bangun segi lima beraturan adalah 540 derajat.',
      type: QuestionType.TRUE_FALSE,
      correctAnswer: 'TRUE',
      questionData: { options: ['TRUE', 'FALSE'] },
      answerData: 'TRUE',
      explanation: 'Benar, rumusnya adalah (n - 2) * 180 = (5 - 2) * 180 = 3 * 180 = 540 derajat.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Pecahan 4/10 nilainya lebih besar dari pecahan 1/2.',
      type: QuestionType.TRUE_FALSE,
      correctAnswer: 'FALSE',
      questionData: { options: ['TRUE', 'FALSE'] },
      answerData: 'FALSE',
      explanation: 'Salah, 4/10 = 0.4, sedangkan 1/2 = 0.5. Jadi 4/10 lebih kecil dari 1/2.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 4. SELECT_MULTIPLE (Pilihan Ganda Majemuk) ───
    {
      categoryName: 'Aritmetika',
      questionText: 'Pilihlah semua bilangan genap dari daftar di bawah ini.',
      type: QuestionType.SELECT_MULTIPLE,
      options: { A: '13', B: '24', C: '35', D: '48' },
      correctAnswer: 'B,D',
      questionData: { A: '13', B: '24', C: '35', D: '48' },
      answerData: 'B,D',
      explanation: '24 dan 48 habis dibagi 2, sehingga merupakan bilangan genap.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Manakah dari nilai berikut yang memenuhi persamaan x^2 - 5x + 6 = 0?',
      type: QuestionType.SELECT_MULTIPLE,
      options: { A: '1', B: '2', C: '3', D: '4' },
      correctAnswer: 'B,C',
      questionData: { A: '1', B: '2', C: '3', D: '4' },
      answerData: 'B,C',
      explanation: 'Persamaan tersebut dapat difaktorkan menjadi (x - 2)(x - 3) = 0. Maka x = 2 atau x = 3.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Pilihlah semua pernyataan yang benar mengenai bangun segitiga sama sisi.',
      type: QuestionType.SELECT_MULTIPLE,
      options: {
        A: 'Ketiga sisinya sama panjang',
        B: 'Salah satu sudutnya bernilai 90 derajat',
        C: 'Ketiga sudutnya masing-masing 60 derajat',
        D: 'Memiliki tepat 3 sumbu simetri',
      },
      correctAnswer: 'A,C,D',
      questionData: {
        A: 'Ketiga sisinya sama panjang',
        B: 'Salah satu sudutnya bernilai 90 derajat',
        C: 'Ketiga sudutnya masing-masing 60 derajat',
        D: 'Memiliki tepat 3 sumbu simetri',
      },
      answerData: 'A,C,D',
      explanation: 'Segitiga sama sisi memiliki 3 sisi sama panjang, sudut masing-masing 60 derajat, dan 3 sumbu simetri.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Manakah pecahan berikut yang senilai dengan setengah (1/2)?',
      type: QuestionType.SELECT_MULTIPLE,
      options: { A: '2/4', B: '3/6', C: '4/5', D: '5/10' },
      correctAnswer: 'A,B,D',
      questionData: { A: '2/4', B: '3/6', C: '4/5', D: '5/10' },
      answerData: 'A,B,D',
      explanation: '2/4, 3/6, dan 5/10 jika disederhanakan semuanya menghasilkan 1/2.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 5. DRAG_ORDER (Mengurutkan Deret/Langkah) ───
    {
      categoryName: 'Aritmetika',
      questionText: 'Urutkan bilangan berikut dari yang terkecil ke terbesar.',
      type: QuestionType.DRAG_ORDER,
      options: { A: '15', B: '5', C: '25', D: '10' },
      correctAnswer: 'B,D,A,C',
      questionData: { A: '15', B: '5', C: '25', D: '10' },
      answerData: 'B,D,A,C',
      explanation: 'Urutan terkecil ke terbesar adalah 5 (B), 10 (D), 15 (A), lalu 25 (C).',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Urutkan langkah-langkah penyelesaian persamaan 3x - 5 = 10 dari awal hingga akhir.',
      type: QuestionType.DRAG_ORDER,
      options: {
        A: 'x = 5',
        B: '3x - 5 = 10',
        C: '3x = 15',
        D: 'Bagi kedua sisi dengan 3',
      },
      correctAnswer: 'B,C,D,A',
      questionData: {
        A: 'x = 5',
        B: '3x - 5 = 10',
        C: '3x = 15',
        D: 'Bagi kedua sisi dengan 3',
      },
      answerData: 'B,C,D,A',
      explanation: 'Langkah penyelesaian: 3x - 5 = 10 (B) -> 3x = 15 (C) -> Bagi dengan 3 (D) -> x = 5 (A).',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Urutkan bangun datar berikut berdasarkan jumlah sisinya dari yang paling sedikit ke paling banyak.',
      type: QuestionType.DRAG_ORDER,
      options: { A: 'Segi lima', B: 'Segitiga', C: 'Segi enam', D: 'Trapesium' },
      correctAnswer: 'B,D,A,C',
      questionData: { A: 'Segi lima', B: 'Segitiga', C: 'Segi enam', D: 'Trapesium' },
      answerData: 'B,D,A,C',
      explanation: 'Segitiga (3 sisi), Trapesium (4 sisi), Segi lima (5 sisi), Segi enam (6 sisi).',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Urutkan pecahan berikut dari yang nilainya terbesar ke terkecil.',
      type: QuestionType.DRAG_ORDER,
      options: { A: '1/4', B: '3/4', C: '1/2', D: '1/8' },
      correctAnswer: 'B,C,A,D',
      questionData: { A: '1/4', B: '3/4', C: '1/2', D: '1/8' },
      answerData: 'B,C,A,D',
      explanation: '3/4 (0.75) > 1/2 (0.5) > 1/4 (0.25) > 1/8 (0.125).',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 6. MATCH_PAIR (Menjodohkan Pasangan) ───
    {
      categoryName: 'Aljabar',
      questionText: 'Jodohkan persamaan linear berikut dengan nilai x yang memenuhi.',
      type: QuestionType.MATCH_PAIR,
      correctAnswer: '2x=6:x=3,x+5=9:x=4,3x-2=10:x=4,x/2=5:x=10', // string format for fallback
      questionData: {
        pairs: [
          { left: '2x = 6', right: 'x = 3' },
          { left: 'x + 5 = 9', right: 'x = 4' },
          { left: '3x - 2 = 10', right: 'x = 4' },
          { left: 'x / 2 = 5', right: 'x = 10' },
        ],
      },
      answerData: {
        '2x = 6': 'x = 3',
        'x + 5 = 9': 'x = 4',
        '3x - 2 = 10': 'x = 4',
        'x / 2 = 5': 'x = 10',
      },
      explanation: '2x=6 -> x=3; x+5=9 -> x=4; 3x-2=10 -> 3x=12 -> x=4; x/2=5 -> x=10.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Cocokkan operasi perkalian berikut dengan hasil perhitungan yang tepat.',
      type: QuestionType.MATCH_PAIR,
      correctAnswer: '12x5:60,15x4:60,8x9:72,14x3:42',
      questionData: {
        pairs: [
          { left: '12 x 5', right: '60' },
          { left: '15 x 4', right: '60' },
          { left: '8 x 9', right: '72' },
          { left: '14 x 3', right: '42' },
        ],
      },
      answerData: {
        '12 x 5': '60',
        '15 x 4': '60',
        '8 x 9': '72',
        '14 x 3': '42',
      },
      explanation: 'Perkalian aritmetika dasar: 12x5=60, 15x4=60, 8x9=72, 14x3=42.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Cocokkan bangun ruang berikut dengan rumus volumenya masing-masing.',
      type: QuestionType.MATCH_PAIR,
      correctAnswer: 'Kubus:s^3,Tabung:pi*r^2*t,Bola:4/3*pi*r^3,Kerucut:1/3*pi*r^2*t',
      questionData: {
        pairs: [
          { left: 'Kubus', right: 's^3' },
          { left: 'Tabung', right: 'pi * r^2 * t' },
          { left: 'Bola', right: '4/3 * pi * r^3' },
          { left: 'Kerucut', right: '1/3 * pi * r^2 * t' },
        ],
      },
      answerData: {
        Kubus: 's^3',
        Tabung: 'pi * r^2 * t',
        Bola: '4/3 * pi * r^3',
        Kerucut: '1/3 * pi * r^2 * t',
      },
      explanation: 'Rumus volume standar dalam matematika geometri sekolah.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Cocokkan pecahan biasa berikut dengan nilai persentasenya.',
      type: QuestionType.MATCH_PAIR,
      correctAnswer: '1/2:50%,1/4:25%,3/4:75%,1/5:20%',
      questionData: {
        pairs: [
          { left: '1/2', right: '50%' },
          { left: '1/4', right: '25%' },
          { left: '3/4', right: '75%' },
          { left: '1/5', right: '20%' },
        ],
      },
      answerData: {
        '1/2': '50%',
        '1/4': '25%',
        '3/4': '75%',
        '1/5': '20%',
      },
      explanation: 'Konversi pecahan ke persen: 1/2 = 50%, 1/4 = 25%, 3/4 = 75%, 1/5 = 20%.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 7. ARRANGE_FORMULA (Menyusun Komponen Rumus) ───
    {
      categoryName: 'Geometri',
      questionText: 'Susunlah komponen rumus keliling lingkaran yang benar.',
      type: QuestionType.ARRANGE_FORMULA,
      correctAnswer: '2 * pi * r',
      questionData: ['2', 'pi', 'r', '*', '*'],
      answerData: '2 * pi * r',
      explanation: 'Rumus keliling lingkaran adalah 2 dikali pi dikali jari-jari (r).',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Susunlah rumus kuadrat ABC untuk mencari nilai akar-akar persamaan kuadrat.',
      type: QuestionType.ARRANGE_FORMULA,
      correctAnswer: '-b ± √D / 2a',
      questionData: ['-b', '±', '√D', '/', '2a'],
      answerData: '-b ± √D / 2a',
      explanation: 'Rumus ABC: x1,2 = (-b ± √D) / 2a.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Geometri',
      questionText: 'Susunlah rumus teorema Pythagoras untuk mencari hipotenusa (c).',
      type: QuestionType.ARRANGE_FORMULA,
      correctAnswer: 'c = √( a^2 + b^2 )',
      questionData: ['c', '=', '√(', 'a^2', '+', 'b^2', ')'],
      answerData: 'c = √( a^2 + b^2 )',
      explanation: 'Teorema Pythagoras menyatakan c adalah akar dari jumlah kuadrat sisi tegak lainnya.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Susunlah rumus hukum distributif perkalian terhadap penjumlahan.',
      type: QuestionType.ARRANGE_FORMULA,
      correctAnswer: 'a*(b+c) = a*b + a*c',
      questionData: ['a*(b+c)', '=', 'a*b', '+', 'a*c'],
      answerData: 'a*(b+c) = a*b + a*c',
      explanation: 'Hukum distributif: a * (b + c) = (a * b) + (a * c).',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },

    // ─── 8. PUZZLE (Teka-teki Logika Angka) ───
    {
      categoryName: 'Aritmetika',
      questionText: 'Temukan angka berikutnya dari pola deret berikut: 2, 4, 8, 16, [?]',
      type: QuestionType.PUZZLE,
      correctAnswer: '32',
      questionData: { sequence: '2, 4, 8, 16, [?]' },
      answerData: '32',
      explanation: 'Pola deret adalah perkalian 2 dari angka sebelumnya: 16 x 2 = 32.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
    },
    {
      categoryName: 'Aljabar',
      questionText: 'Temukan angka pengisi [?] pada pola hubungan berikut: 3 -> 9, 5 -> [?]',
      type: QuestionType.PUZZLE,
      correctAnswer: '25',
      questionData: { matrix: '3 -> 9, 5 -> [?]' },
      answerData: '25',
      explanation: 'Pola hubungan adalah pengkuadratan: 3^2 = 9. Maka 5^2 = 25.',
      difficulty: Difficulty.MEDIUM,
      baseScore: 150,
    },
    {
      categoryName: 'Aritmetika',
      questionText: 'Pecahkan teka-teki deret Fibonacci berikut: 1, 1, 2, 3, 5, 8, 13, [?]',
      type: QuestionType.PUZZLE,
      correctAnswer: '21',
      questionData: { sequence: '1, 1, 2, 3, 5, 8, 13, [?]' },
      answerData: '21',
      explanation: 'Fibonacci diperoleh dengan menjumlahkan dua angka sebelumnya: 8 + 13 = 21.',
      difficulty: Difficulty.HARD,
      baseScore: 200,
    },
    {
      categoryName: 'Pecahan',
      questionText: 'Tentukan pecahan pengisi pola berikut: 1/2, 1/4, 1/8, [?]',
      type: QuestionType.PUZZLE,
      correctAnswer: '1/16',
      questionData: { sequence: '1/2, 1/4, 1/8, [?]' },
      answerData: '1/16',
      explanation: 'Setiap suku dikalikan dengan 1/2. Maka 1/8 x 1/2 = 1/16.',
      difficulty: Difficulty.EASY,
      baseScore: 100,
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
        type: q.type,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || undefined,
        questionData: q.questionData || undefined,
        answerData: q.answerData || undefined,
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
