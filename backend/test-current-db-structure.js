const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentDbStructure() {
  console.log('=== CHECKING CURRENT DATABASE STRUCTURE ===\n');
  
  try {
    // Check if clients table exists and its structure
    console.log('1. Checking clients table structure...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientsError) {
      console.log('❌ Clients table error:', clientsError.message);
      return;
    }
    
    if (clients && clients.length > 0) {
      console.log('✅ Clients table exists');
      console.log('Current columns:', Object.keys(clients[0]));
      console.log('Sample record:', clients[0]);
      
      // Check if it has the new expanded fields
      const hasExpandedFields = clients[0].hasOwnProperty('location_state') && 
                               clients[0].hasOwnProperty('areas_of_concern');
      console.log('Has expanded fields:', hasExpandedFields ? '✅ YES' : '❌ NO');
      
    } else {
      console.log('⚠️ Clients table exists but is empty');
      
      // Try to describe the table structure by attempting an insert (will show us the expected columns)
      const { error: insertError } = await supabase
        .from('clients')
        .insert({})
        .select();
      
      console.log('Insert error (shows expected structure):', insertError);
    }
    
    // Check if there are any auth.users
    console.log('\n2. Checking auth users...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Auth users error:', authError.message);
    } else {
      console.log('✅ Auth users found:', users.length);
      if (users.length > 0) {
        console.log('Sample user:', {
          id: users[0].id,
          email: users[0].email,
          created_at: users[0].created_at
        });
      }
    }
    
    // Test specific user ID from the token
    const testUserId = '8e34183a-1b30-4300-bdcc-68d1b89eb6bf';
    console.log(`\n3. Looking for client profile with ID: ${testUserId}...`);
    
    const { data: specificClient, error: specificError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (specificError) {
      console.log('❌ Specific client not found:', specificError.message);
    } else {
      console.log('✅ Found specific client:', specificClient);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkCurrentDbStructure();