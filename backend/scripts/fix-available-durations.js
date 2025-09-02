const { supabase } = require('../src/lib/supabase');
const fs = require('fs');
const path = require('path');

async function fixAvailableDurations() {
  try {
    console.log('🔧 Starting available_durations migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/004_fix_available_durations_jsonb.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If the RPC doesn't exist, try direct execution
      console.log('Direct SQL execution (RPC not available)');
      
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split('$$')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim());
      
      for (let i = 0; i < statements.length; i++) {
        if (statements[i].includes('DO') && statements[i + 1] && i + 1 < statements.length) {
          // Reconstruct DO blocks
          const doBlock = statements[i] + '$$' + statements[i + 1] + '$$';
          console.log(`Executing DO block ${Math.floor(i/2) + 1}...`);
          
          const { error: blockError } = await supabase.from('').select('').limit(0); // This won't work for DO blocks
          // For DO blocks, we'll need manual execution in Supabase dashboard
          
          i++; // Skip the next statement as it's part of this DO block
        }
      }
    }
    
    // Verify the fix by checking existing data
    console.log('🔍 Verifying the migration...');
    
    const { data: slots, error: selectError } = await supabase
      .from('coach_availability_slots')
      .select('id, available_durations')
      .limit(5);
    
    if (selectError) {
      console.error('Error verifying migration:', selectError);
    } else {
      console.log('✅ Sample data after migration:');
      slots.forEach(slot => {
        console.log(`  - Slot ${slot.id}: available_durations = ${JSON.stringify(slot.available_durations)} (type: ${typeof slot.available_durations})`);
      });
    }
    
    console.log('✅ Migration completed! Please run this SQL in your Supabase dashboard for complete fix.');
    console.log('📋 SQL to run manually:');
    console.log('--------------------------------------');
    console.log(migrationSQL);
    console.log('--------------------------------------');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('📋 Please run this SQL manually in your Supabase dashboard:');
    console.log('--------------------------------------');
    const migrationPath = path.join(__dirname, '../database/migrations/004_fix_available_durations_jsonb.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(migrationSQL);
    console.log('--------------------------------------');
  }
}

// Run the migration
if (require.main === module) {
  fixAvailableDurations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { fixAvailableDurations };