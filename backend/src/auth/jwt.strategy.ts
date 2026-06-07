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
    
    // 3. Si aún no existe, intentamos el AUTO-REGISTRO DE EMERGENCIA
    if (!user) {
      const username = payload.email.split('@')[0] + Math.floor(Math.random() * 1000);
      try {
        console.log(`[JwtStrategy] Creando nuevo usuario para ${payload.email}`);
        user = await this.prisma.user.create({
          data: {
            supabaseId: payload.sub,
            email: payload.email,
            username: username,
            fullName: 'Nueva Leyenda',
            isAdmin: payload.email === 'bblasivan@gmail.com' || payload.email === 'robertobolla9@gmail.com',
          }
        });
      } catch (e: any) {
        console.error('❌ [JwtStrategy] ERROR CRÍTICO EN AUTO-REGISTRO:', {
          message: e.message,
          code: e.code,
          meta: e.meta,
          stack: e.stack,
          payloadSub: payload.sub,
          payloadEmail: payload.email
        });
        // Si falló la creación, devolvemos un objeto que indique el fallo pero no rompa el guard
        return { id: undefined, userId: payload.sub, email: payload.email, notRegistered: true };
      }
    }
    
    return { ...user, userId: payload.sub };
  }
}
