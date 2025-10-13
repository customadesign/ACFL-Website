import fs from 'fs';
import path from 'path';

console.log('=== Database Migration Instructions ===\n');

const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log('Since Supabase requires manual SQL execution for DDL changes,');
console.log('please follow these steps:\n');

console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/');
console.log('2. Select your project');
console.log('3. Navigate to "SQL Editor" in the left sidebar');
console.log('4. Click "New Query"');
console.log('5. Copy and paste each migration below, one at a time');
console.log('6. Click "Run" after pasting each migration\n');

console.log('=' .repeat(80));
console.log('\n');

migrationFiles.forEach((file, index) => {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`\n${'='.repeat(80)}`);
  console.log(`MIGRATION ${index + 1}: ${file}`);
  console.log('='.repeat(80));
  console.log('\n');
  console.log(sql);
  console.log('\n');
});

console.log('='.repeat(80));
console.log('\nAfter running all migrations, you can verify with:');
console.log('  npx tsx check-db-constraints.ts\n');
console.log('To test the integrity check function, run in SQL Editor:');
console.log('  SELECT * FROM check_payment_refund_integrity(FALSE);\n');
