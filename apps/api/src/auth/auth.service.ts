import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import * as crypto from 'crypto';

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

    if (!user.passwordHash) {
      throw new UnauthorizedException('Akun ini terdaftar melalui Google OAuth. Silakan login menggunakan tombol Google.');
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

  async validateGoogleUser(profile: { googleId: string; email: string; name: string; avatarUrl: string | null }) {
    // 1. Check if user with this googleId already exists
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
      include: { role: true },
    });

    if (!user) {
      // 2. Check if user with this email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
        include: { role: true },
      });

      if (existingUser) {
        // Associate Google ID with existing account
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            googleId: profile.googleId,
            // Only update avatar if not already set
            avatarUrl: existingUser.avatarUrl || profile.avatarUrl,
          },
          include: { role: true },
        });
      } else {
        // Generate unique random username with 6 alphanumeric characters (CyberGladiator_A89F2X)
        let username = `CyberGladiator_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        let exists = await this.prisma.user.findUnique({ where: { username } });
        while (exists) {
          username = `CyberGladiator_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          exists = await this.prisma.user.findUnique({ where: { username } });
        }

        const playerRole = await this.prisma.role.findUnique({
          where: { name: RoleName.PLAYER },
        });
        if (!playerRole) {
          throw new InternalServerErrorException('Default role PLAYER tidak ditemukan di database');
        }

        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: profile.name,
              username,
              email: profile.email,
              googleId: profile.googleId,
              avatarUrl: profile.avatarUrl,
              roleId: playerRole.id,
              isActive: true,
            },
            include: { role: true },
          });

          // Create default ranking
          await tx.ranking.create({
            data: {
              userId: newUser.id,
              ratingPoint: 1000,
              tier: getTier(1000),
            },
          });

          // Create default user stats
          await tx.userStats.create({
            data: {
              userId: newUser.id,
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

          return newUser;
        });
      }
    }

    if (!user.isActive) {
      throw new BadRequestException('Akun Anda dinonaktifkan');
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
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
