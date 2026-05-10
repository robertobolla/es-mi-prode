import { Controller, Get, Param, Header } from '@nestjs/common';

@Controller('invitations')
export class InvitationsController {
  @Get('join/:code')
  @Header('Content-Type', 'text/html')
  getJoinPage(@Param('code') code: string) {
    const deepLink = `es-mi-prode://join/${code}`;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unirse al Torneo - Es Mi Prode</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              background-color: #020617; 
              color: white; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              padding: 20px;
              text-align: center;
            }
            .card {
              background: #0F172A;
              padding: 40px;
              border-radius: 32px;
              border: 1px solid rgba(255,255,255,0.1);
              max-width: 400px;
              width: 100%;
              box-shadow: 0 10px 50px rgba(0,0,0,0.8);
            }
            .btn {
              display: inline-block;
              background: #EAB308;
              color: #422006;
              padding: 18px 36px;
              border-radius: 16px;
              text-decoration: none;
              font-weight: 900;
              margin-top: 24px;
              letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(234, 179, 8, 0.4);
            }
            h1 { font-weight: 900; margin-bottom: 8px; color: #F8FAFC; }
            p { color: #94A3B8; line-height: 1.5; font-size: 16px; }
            .logo { font-size: 48px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">🏆</div>
            <h1>Es Mi Prode</h1>
            <p>¡Te invitaron a un torneo!</p>
            <a href="${deepLink}" class="btn">UNIRME AL TORNEO</a>
            <p style="margin-top: 32px; font-size: 12px; opacity: 0.6;">
              Si el botón no abre la app, asegurate de tenerla instalada.<br>
              Tu código de invitación es: <strong>${code}</strong>
            </p>
          </div>
          <script>
            // Intentar abrir automáticamente solo si es móvil
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              setTimeout(() => {
                window.location.href = "${deepLink}";
              }, 800);
            }
          </script>
        </body>
      </html>
    `;
  }
}
