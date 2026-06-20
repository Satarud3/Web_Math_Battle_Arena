import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { GetQuestionsDto } from './dto/get-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetQuestionsDto) {
    const where: any = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    }

    if (query.search) {
      where.questionText = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    return this.prisma.question.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(dto: CreateQuestionDto, creatorId: string) {
    // Check if category exists
    const category = await this.prisma.questionCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    const options = {
      A: dto.optionA,
      B: dto.optionB,
      C: dto.optionC,
      D: dto.optionD,
    };

    // Execute atomically inside transaction
    return this.prisma.$transaction(async (tx) => {
      return tx.question.create({
        data: {
          categoryId: dto.categoryId,
          questionText: dto.questionText,
          options,
          correctAnswer: dto.correctAnswer,
          explanation: dto.explanation || null,
          difficulty: dto.difficulty,
          baseScore: dto.baseScore,
          isActive: true,
          createdById: creatorId,
        },
        include: {
          category: true,
        },
      });
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Soal tidak ditemukan');
    }

    return question;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const question = await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.questionCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
    }

    const existingOptions = question.options as any;
    const options = {
      A: dto.optionA !== undefined ? dto.optionA : existingOptions.A,
      B: dto.optionB !== undefined ? dto.optionB : existingOptions.B,
      C: dto.optionC !== undefined ? dto.optionC : existingOptions.C,
      D: dto.optionD !== undefined ? dto.optionD : existingOptions.D,
    };

    // Map DTO flat properties to database JSON column properties
    const updateData: any = { ...dto };
    delete updateData.optionA;
    delete updateData.optionB;
    delete updateData.optionC;
    delete updateData.optionD;
    updateData.options = options;

    return this.prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Soal tidak ditemukan');
    }

    // Check if the question has ever been answered during a match
    const answerCount = await this.prisma.answer.count({
      where: { questionId: id },
    });

    if (answerCount > 0) {
      // Soft Delete: update isActive status to false
      return this.prisma.question.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard Delete: remove permanently from database
      return this.prisma.question.delete({
        where: { id },
      });
    }
  }
}
