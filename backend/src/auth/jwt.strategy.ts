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
    console.log('🔑 [JwtStrategy] Validando payload:', { sub: payload.sub, email: payload.email });
    // 1. Intentar buscar por Supabase ID (lo normal)
    let user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });
    
    // 2. Si no existe por ID, intentar buscar por EMAIL (para recuperar cuentas desincronizadas)
    if (!user && payload.email) {
      user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });
      
      if (user) {
        // Si lo encontramos por email, actualizamos su supabaseId para sincronizarlo
        console.log(`[JwtStrategy] Sincronizando usuario ${user.email} con nuevo Supabase ID`);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { supabaseId: payload.sub },
        });
      }
    }
    
    // 3. Si aún no existe, el usuario fue eliminado o nunca completó el registro
    if (!user) {
      console.warn(`[JwtStrategy] Usuario con sub=${payload.sub} (${payload.email}) no encontrado en DB. Rechazando.`);
      throw new UnauthorizedException('User not registered');
    }
    
    return { ...user, userId: payload.sub };
  }
}
