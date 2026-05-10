import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('teams')
export class TeamsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }

  @Post()
  create(@Body() body: { name: string; flagUrl?: string }) {
    return this.prisma.team.create({ data: body });
  }
}
