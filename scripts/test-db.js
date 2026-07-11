const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env')) {
  const env = fs.readFileSync('.env', 'utf8');
  env.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  // Try inserting a record with anon_uuid in notifications to see if it exists
  const { data: nData, error: nError } = await supabase.from('notifications').select('id, anon_uuid').limit(1);
  console.log('notifications columns check:', nError ? `❌ Error: ${nError.message}` : '✅ anon_uuid exists!');

  const { data: rData, error: rError } = await supabase.from('reminders').select('id, anon_uuid').limit(1);
  console.log('reminders columns check:', rError ? `❌ Error: ${rError.message}` : '✅ anon_uuid exists!');
}

checkColumns();
