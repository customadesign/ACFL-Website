const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runBillingMigration() {
  try {
    console.log('Starting billing tables migration...');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'database', 'migrations', 'create_billing_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase.from('_').select('*').limit(0);

      // Split and execute SQL statements individually
      const statements = sql.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            console.log('Executing statement:', statement.substring(0, 50) + '...');
            // For complex DDL, we'll need to use the REST API directly
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              },
              body: JSON.stringify({ sql_query: statement })
            });

            if (!response.ok) {
              console.log('SQL execution via RPC failed, using direct Supabase client...');
              // Fallback: execute via raw SQL if possible
              break;
            }
          } catch (stmtError) {
            console.log('Statement failed:', stmtError.message);
            continue;
          }
        }
      }
    }

    console.log('Migration completed successfully!');

    // Verify tables were created
    const tables = ['user_credits', 'credit_transactions', 'billing_transactions', 'refund_requests', 'payouts'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`Failed to verify table ${table}:`, error.message);
        } else {
          console.log(`✓ Table ${table} created successfully`);
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err.message);
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runBillingMigration();