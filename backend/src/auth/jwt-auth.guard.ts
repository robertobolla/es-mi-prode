import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
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

    // Attach user payload to request
    request.user = {
      userId: data.user.id,
      email: data.user.email,
    };

    return true;
  }
}
