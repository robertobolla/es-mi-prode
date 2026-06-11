import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtSupabaseGuard } from '../auth/jwt-supabase.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);

    if (!user) {
      // El usuario no existe en nuestra BD (fue borrado o nunca completó el onboarding).
      // NO auto-registramos: devolvemos 404 para que el cliente haga signOut.
      console.log('⚠️ [UsersController] Usuario de Supabase sin perfil en BD:', req.user.email);
      throw new NotFoundException('Profile not found.');
    }

    // Determine if the user completed onboarding (must have a valid username)
    const isOnboarded = !!(user.username && user.username.length >= 3);

    if (isOnboarded) {
      await this.usersService.ensureUserJoinedPublicTournament(user.id);
    }

    return {
      ...user,
      isOnboarded,
    };
  }

  @UseGuards(JwtSupabaseGuard)
  @Post('onboard')
  async onboard(
    @Request() req: AuthenticatedRequest, 
    @Body('username') username: string,
    @Body('fullName') fullName?: string,
    @Body('country') country?: string,
    @Body('city') city?: string,
    @Body('state') state?: string,
    @Body('dob') dob?: string,
    @Body('gender') gender?: string,
  ) {
    if (!username || username.trim().length < 3) {
      throw new ConflictException('Username must be at least 3 characters long');
    }

    let parsedDob: Date | undefined = undefined;
    if (dob) {
      parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime())) {
        throw new ConflictException('La fecha de nacimiento no es válida');
      }
    }
    
    const existing = await this.usersService.findBySupabaseId(req.user.userId);

    // Check if username is taken by another user
    const userWithUsername = await this.usersService.findByUsername(username.trim());
    if (userWithUsername && userWithUsername.supabaseId !== req.user.userId) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    let result;
    if (existing) {
      // Update the auto-registered user with onboarding details
      result = await this.usersService.update(existing.id, {
        username: username.trim(),
        fullName: fullName?.trim() || existing.fullName,
        country: country?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        dob: parsedDob || null,
        gender: gender?.trim() || null,
      });
    } else {
      result = await this.usersService.create({
        supabaseId: req.user.userId,
        username: username.trim(),
        email: req.user.email,
        fullName: fullName?.trim(),
        country: country?.trim() || undefined,
        city: city?.trim() || undefined,
        state: state?.trim() || undefined,
        dob: parsedDob,
        gender: gender?.trim() || undefined,
      });
    }

    // Auto-join user to public tournament
    await this.usersService.ensureUserJoinedPublicTournament(result.id);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.usersService.remove(user.id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Request() req, @Body() body: any) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new NotFoundException('User not found');

    const allowedFields: any = {};
    if (body.fullName !== undefined) allowedFields.fullName = body.fullName?.trim() || null;
    if (body.country !== undefined) allowedFields.country = body.country?.trim() || null;
    if (body.city !== undefined) allowedFields.city = body.city?.trim() || null;
    if (body.state !== undefined) allowedFields.state = body.state?.trim() || null;
    if (body.bio !== undefined) allowedFields.bio = body.bio?.trim() || null;
    if (body.avatarUrl !== undefined) allowedFields.avatarUrl = body.avatarUrl?.trim() || null;
    if (body.gender !== undefined) allowedFields.gender = body.gender?.trim() || null;
    if (body.dob !== undefined) {
      if (body.dob === null || body.dob === '') {
        allowedFields.dob = null;
      } else {
        const d = new Date(body.dob);
        if (!isNaN(d.getTime())) {
          allowedFields.dob = d;
        }
      }
    }
    if (body.notifyMatches !== undefined) allowedFields.notifyMatches = !!body.notifyMatches;
    if (body.notifyRanking !== undefined) allowedFields.notifyRanking = !!body.notifyRanking;
    if (body.notifyTournaments !== undefined) allowedFields.notifyTournaments = !!body.notifyTournaments;
    if (body.pushToken !== undefined) allowedFields.pushToken = body.pushToken?.trim() || null;

    return this.usersService.update(user.id, allowedFields);
  }

  @UseGuards(JwtAuthGuard)
  @Post('block')
  async blockUser(
    @Request() req: AuthenticatedRequest,
    @Body('blockedId') blockedId: string,
  ) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.blockUser(user.id, blockedId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('report')
  async reportUser(
    @Request() req: AuthenticatedRequest,
    @Body('reportedId') reportedId: string,
    @Body('reason') reason: string,
  ) {
    const user = await this.usersService.findBySupabaseId(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.reportUser(user.id, reportedId, reason);
  }
}
