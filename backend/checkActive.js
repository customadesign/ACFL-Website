const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function analyzeActive() {
  const { data: clients } = await supabase.from('clients').select('first_name, last_name, status, is_active');
  const { data: coaches } = await supabase.from('coaches').select('first_name, last_name, status, is_active');
  const { data: staff } = await supabase.from('staff').select('first_name, last_name, status');

  console.log('=== CLIENTS (13 total) ===');
  let activeClients = 0;
  clients?.forEach(c => {
    const isActive = c.is_active === true && c.status !== 'inactive';
    if (isActive) activeClients++;
    console.log(`${c.first_name} ${c.last_name}: is_active=${c.is_active}, status=${c.status} -> ${isActive ? 'ACTIVE' : 'NOT ACTIVE'}`);
  });
  console.log(`Active clients: ${activeClients}\n`);

  console.log('=== COACHES (7 total) ===');
  let activeCoaches = 0;
  coaches?.forEach(c => {
    const isActive = c.is_active === true && c.status !== 'inactive';
    if (isActive) activeCoaches++;
    console.log(`${c.first_name} ${c.last_name}: is_active=${c.is_active}, status=${c.status} -> ${isActive ? 'ACTIVE' : 'NOT ACTIVE'}`);
  });
  console.log(`Active coaches: ${activeCoaches}\n`);

  console.log('=== STAFF (1 total) ===');
  let activeStaff = 0;
  staff?.forEach(s => {
    const isActive = s.status === 'active';
    if (isActive) activeStaff++;
    console.log(`${s.first_name} ${s.last_name}: status=${s.status} -> ${isActive ? 'ACTIVE' : 'NOT ACTIVE'}`);
  });
  console.log(`Active staff: ${activeStaff}\n`);

  console.log(`TOTAL ACTIVE: ${activeClients + activeCoaches + activeStaff} (${activeClients} clients + ${activeCoaches} coaches + ${activeStaff} staff)`);
}

analyzeActive().catch(console.error);
