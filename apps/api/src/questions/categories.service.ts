import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.questionCategory.findMany({
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.questionCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Nama kategori sudah terdaftar');
    }

    return this.prisma.questionCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.questionCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.questionCategory.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Nama kategori sudah terdaftar pada kategori lain');
      }
    }

    return this.prisma.questionCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const category = await this.prisma.questionCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    if (category._count.questions > 0) {
      throw new BadRequestException(
        'Kategori tidak dapat dihapus secara permanen karena masih dikaitkan dengan beberapa soal matematika.',
      );
    }

    return this.prisma.questionCategory.delete({
      where: { id },
    });
  }
}
