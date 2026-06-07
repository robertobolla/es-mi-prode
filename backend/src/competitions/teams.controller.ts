import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() body: { name: string; flagUrl?: string }) {
    return this.prisma.team.create({ data: body });
  }
}
