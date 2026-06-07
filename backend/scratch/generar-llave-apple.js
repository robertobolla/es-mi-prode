const jwt = require('jsonwebtoken');

// 1. REEMPLAZA ESTO con el Service ID que creaste en Apple
const CLIENT_ID = 'com.esmi.prode.signin'; // Ejemplo: com.esmi.prode.signin

// 2. REEMPLAZA ESTO con tu Team ID (el código alfanumérico arriba a la derecha en Apple)
const TEAM_ID = '2Z6844D4F3';

// 3. REEMPLAZA ESTO con tu Key ID
const KEY_ID = '427M9MZV9K';

// 4. REEMPLAZA ESTO con TODO el contenido de tu archivo .p8
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgqlxdgadUzh1YWEmV
QixRmdLYAlHReMnmIhep9DKtYNWgCgYIKoZIzj0DAQehRANCAAQnHeKbKztuSt8T
v4v9rLJoznNpPuB6DHdxF2gVfRPG/jCG0mLI0HBtpehVqnrn4WkfvSv0UNXhZ8vn
dxAr8MCl
-----END PRIVATE KEY-----`;

try {
  const token = jwt.sign({}, PRIVATE_KEY, {
    algorithm: 'ES256',
    expiresIn: '180d', // Expira en 6 meses (máximo permitido por Apple)
    issuer: TEAM_ID,
    audience: 'https://appleid.apple.com',
    subject: CLIENT_ID,
    keyid: KEY_ID,
  });

  console.log("\n========================================================");
  console.log("✅ ÉXITO: COPIA ESTE TEXTO Y PÉGALO EN SUPABASE:");
  console.log("========================================================\n");
  console.log(token);
  console.log("\n========================================================\n");
} catch (error) {
  console.error("Error al generar el token. Revisa que el archivo .p8 esté pegado correctamente:", error.message);
}
