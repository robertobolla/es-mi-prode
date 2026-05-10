import { Injectable } from '@nestjs/common';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  create(createMatchDto: CreateMatchDto) {
    return this.prisma.match.create({ data: createMatchDto as any });
  }

  findAll() {
    return this.prisma.match.findMany();
  }

  findOne(id: string) {
    return this.prisma.match.findUnique({ where: { id } });
  }

  update(id: string, updateMatchDto: UpdateMatchDto) {
    return this.prisma.match.update({ where: { id }, data: updateMatchDto as any });
  }

  remove(id: string) {
    return this.prisma.match.delete({ where: { id } });
  }
}
