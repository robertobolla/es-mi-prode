import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET || 'super-secret', // Should be in env
    });
  }

  async validate(payload: any) {
    // payload.sub is the Supabase User ID
    const user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });
    
    // If not found, they might be authenticated in Supabase but not fully registered in our DB
    // Or we can auto-create them. For now, we just return the payload.
    return { userId: payload.sub, email: payload.email, ...user };
  }
}
