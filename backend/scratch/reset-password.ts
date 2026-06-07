import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  const email = 'robertobolla9@gmail.com';
  const newPassword = 'Admin123!';

  console.log(`Resetting password for ${email}...`);

  // We need to find the user's ID first in auth.users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('User not found in Supabase Auth');
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword
  });

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log(`✅ Password reset successfully to: ${newPassword}`);
    console.log('You can now log in using Email and this password in the app.');
  }
}

resetAdminPassword();
