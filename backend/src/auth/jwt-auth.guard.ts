import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  isAdmin: boolean;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    // Validate token against Supabase directly to support ES256 and JWKS automatically
    const anonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscHZtamZkbG5sa2hzdm5ucW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTc3MzksImV4cCI6MjA4OTY5MzczOX0.wiOnoeBH2zwszLkvzr90tD8NaIRIS97FVK7976nfP4w';
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://ulpvmjfdlnlkhsvnnqoe.supabase.co',
      anonKey,
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token: ' + (error?.message || 'Unknown error'));
    }

    const supabaseId = data.user.id;
    const email = data.user.email || '';

    // Resolve internal DB user by supabaseId, fallback to email, auto-create if needed
    let user = await this.prisma.user.findUnique({ where: { supabaseId } });

    if (!user && email) {
      user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        // Sync the supabaseId for future lookups
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { supabaseId },
        });
        console.log(`[JwtAuthGuard] Synced supabaseId for user ${email}`);
      }
    }

    if (!user) {
      // El usuario no existe en nuestra DB: puede ser un usuario nuevo (aún no completó el registro)
      // o uno que eliminó su cuenta pero sigue teniendo sesión activa en Supabase.
      // Devolvemos 404 para que el frontend lo envíe al onboarding si es nuevo,
      // o quede bloqueado si fue eliminado de Supabase Auth (en ese caso no puede renovar el token).
      console.warn(`[JwtAuthGuard] Usuario con supabaseId ${supabaseId} (${email}) no encontrado en DB. Devolviendo 404.`);
      throw new NotFoundException('User not found');
    }

    // Attach full user payload to request — id is the internal DB UUID
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      userId: supabaseId,
      email,
      isAdmin: user.isAdmin,
    };
    request.user = authenticatedUser;

    return true;
  }
}
