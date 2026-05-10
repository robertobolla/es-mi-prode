import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { 
    supabaseId: string; 
    username: string; 
    email: string;
    fullName?: string;
    gender?: string;
    country?: string;
    dob?: Date;
  }) {
    // Check if username taken
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    return this.prisma.user.create({
      data: {
        supabaseId: data.supabaseId,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        gender: data.gender,
        country: data.country,
        dob: data.dob,
      },
    });
  }

  findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseId },
      include: {
        badges: {
          include: {
            tournament: true,
          },
          orderBy: {
            earnedAt: 'desc',
          },
        },
        memberships: {
          include: {
            tournament: {
              include: {
                competition: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
          take: 10, // Fetch the last 10 tournaments
        },
      }
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
