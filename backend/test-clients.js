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

async function testClients() {
  try {
    console.log('Checking clients in database...');
    
    // Get all clients and their associated users
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        phone,
        bio,
        created_at,
        users (
          id,
          email,
          role
        )
      `)
      .limit(10);
    
    if (error) {
      console.log('Error fetching clients:', error);
      return;
    }
    
    console.log('Clients found:', clients.length);
    clients.forEach(client => {
      console.log(`- Client ID: ${client.id}, User ID: ${client.user_id}, Name: ${client.first_name} ${client.last_name}, Email: ${client.users?.email}`);
    });
    
    // Check specific client users
    const { data: clientUsers, error: clientUsersError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'client');
    
    if (clientUsersError) {
      console.log('Error fetching client users:', clientUsersError);
      return;
    }
    
    console.log('\nClient users found:');
    for (const user of clientUsers) {
      console.log(`- ${user.email} (ID: ${user.id})`);
      
      // Check if this user has a client profile
      const { data: clientProfile, error: profileError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.log(`  ❌ No client profile found for ${user.email} - Error: ${profileError.message}`);
      } else {
        console.log(`  ✅ Client profile exists for ${user.email}`);
      }
    }
    
  } catch (err) {
    console.log('Test failed:', err.message);
  }
}

testClients();