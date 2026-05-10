import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) {
      throw new NotFoundException('Profile not found. Needs onboarding.');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboard')
  async onboard(
    @Request() req, 
    @Body('username') username: string,
    @Body('fullName') fullName?: string,
    @Body('country') country?: string,
    @Body('dob') dob?: string,
    @Body('gender') gender?: string,
  ) {
    if (!username || username.trim().length < 3) {
      throw new ConflictException('Username must be at least 3 characters long');
    }
    
    const existing = await this.usersService.findBySupabaseId(req.user.userId);
    if (existing) {
      throw new ConflictException('User already onboarded');
    }
    
    // Parse Date safely
    let parsedDob: Date | undefined = undefined;
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) parsedDob = d;
    }

    return this.usersService.create({
      supabaseId: req.user.userId,
      username: username.trim(),
      email: req.user.email,
      fullName: fullName?.trim(),
      country: country?.trim(),
      dob: parsedDob,
      gender: gender?.trim(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Request() req, @Body() body: any) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new NotFoundException('User not found');

    const allowedFields: any = {};
    if (body.fullName !== undefined) allowedFields.fullName = body.fullName?.trim() || null;
    if (body.country !== undefined) allowedFields.country = body.country?.trim() || null;
    if (body.bio !== undefined) allowedFields.bio = body.bio?.trim() || null;
    if (body.avatarUrl !== undefined) allowedFields.avatarUrl = body.avatarUrl?.trim() || null;
    if (body.gender !== undefined) allowedFields.gender = body.gender?.trim() || null;
    if (body.notifyMatches !== undefined) allowedFields.notifyMatches = !!body.notifyMatches;
    if (body.notifyRanking !== undefined) allowedFields.notifyRanking = !!body.notifyRanking;
    if (body.notifyTournaments !== undefined) allowedFields.notifyTournaments = !!body.notifyTournaments;
    if (body.pushToken !== undefined) allowedFields.pushToken = body.pushToken?.trim() || null;

    return this.usersService.update(user.id, allowedFields);
  }

  // Generic admin endpoints could be added here later
}
