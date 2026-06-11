import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * Guard que valida el token de Supabase Auth pero NO requiere que el usuario
 * exista en nuestra base de datos. Usado para endpoints de onboarding donde
 * el usuario aún no tiene perfil en nuestra BD.
 */
@Injectable()
export class JwtSupabaseGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      anonKey,
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token: ' + (error?.message || 'Unknown error'));
    }

    // Solo adjuntamos los datos del token de Supabase, sin buscar en nuestra DB
    request.user = {
      userId: data.user.id,
      email: data.user.email || '',
    };

    return true;
  }
}
