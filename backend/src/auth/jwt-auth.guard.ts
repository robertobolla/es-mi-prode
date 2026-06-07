import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
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
      // Auto-register
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      user = await this.prisma.user.create({
        data: {
          supabaseId,
          email,
          username,
          fullName: 'Nueva Leyenda',
          isAdmin: email === 'bblasivan@gmail.com' || email === 'robertobolla9@gmail.com',
        },
      });
      console.log(`[JwtAuthGuard] Auto-created user ${email} with id ${user.id}`);
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
