import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';

import { getTier } from '../common/utils/tier';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username sudah terdaftar');
    }

    // Get the PLAYER role
    const playerRole = await this.prisma.role.findUnique({
      where: { name: RoleName.PLAYER },
    });
    if (!playerRole) {
      throw new InternalServerErrorException('Default role PLAYER tidak ditemukan di database');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user and associated records in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          username: dto.username,
          email: dto.email,
          passwordHash,
          roleId: playerRole.id,
          isActive: true,
        },
      });

      // Create default ranking
      await tx.ranking.create({
        data: {
          userId: user.id,
          ratingPoint: 1000,
          tier: getTier(1000),
        },
      });

      // Create default user stats
      await tx.userStats.create({
        data: {
          userId: user.id,
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

      return {
        message: 'Registrasi berhasil',
        userId: user.id,
      };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isActive) {
      throw new BadRequestException('Akun Anda dinonaktifkan');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
    };
  }
}
