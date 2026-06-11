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

    const anonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscHZtamZkbG5sa2hzdm5ucW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTc3MzksImV4cCI6MjA4OTY5MzczOX0.wiOnoeBH2zwszLkvzr90tD8NaIRIS97FVK7976nfP4w';
    const supabaseUrl = process.env.SUPABASE_URL || 'https://ulpvmjfdlnlkhsvnnqoe.supabase.co';
    const supabase = createClient(supabaseUrl, anonKey);

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
