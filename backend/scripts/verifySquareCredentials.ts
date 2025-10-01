import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function verifySquareCredentials() {
  console.log('🔍 Verifying Square Credentials\n');

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT;

  console.log('📋 Current Configuration:');
  console.log(`  Application ID: ${applicationId}`);
  console.log(`  Access Token: ${accessToken ? `${accessToken.substring(0, 10)}...` : 'NOT SET'}`);
  console.log(`  Environment: ${environment}\n`);

  // Validation checks
  let hasErrors = false;

  console.log('✓ Validation Checks:\n');

  // Check 1: Application ID format
  if (!applicationId) {
    console.error('❌ SQUARE_APPLICATION_ID is not set');
    hasErrors = true;
  } else if (environment === 'sandbox' && !applicationId.startsWith('sandbox-')) {
    console.error('❌ Sandbox Application ID should start with "sandbox-"');
    console.error(`   Current: ${applicationId}`);
    console.error(`   Expected format: sandbox-sq0idb-XXXXXXXXXX`);
    hasErrors = true;
  } else if (environment === 'production' && applicationId.startsWith('sandbox-')) {
    console.error('❌ Production Application ID should NOT start with "sandbox-"');
    console.error(`   Current: ${applicationId}`);
    hasErrors = true;
  } else {
    console.log('✅ Application ID format is correct');
  }

  // Check 2: Access Token
  if (!accessToken) {
    console.error('❌ SQUARE_ACCESS_TOKEN is not set');
    hasErrors = true;
  } else if (accessToken.length < 20) {
    console.error('❌ Access Token appears to be invalid (too short)');
    hasErrors = true;
  } else {
    console.log('✅ Access Token is set');
  }

  // Check 3: Environment
  if (!environment) {
    console.error('❌ SQUARE_ENVIRONMENT is not set');
    hasErrors = true;
  } else if (environment !== 'sandbox' && environment !== 'production') {
    console.error(`❌ SQUARE_ENVIRONMENT must be 'sandbox' or 'production', got: ${environment}`);
    hasErrors = true;
  } else {
    console.log(`✅ Environment is set to: ${environment}`);
  }

  console.log('');

  if (hasErrors) {
    console.log('❌ Configuration has errors. Please fix the issues above.\n');
    console.log('📝 How to fix:');
    console.log('   1. Go to https://developer.squareup.com/apps');
    console.log('   2. Select your application');
    console.log('   3. Go to Credentials > Sandbox tab');
    console.log('   4. Copy the correct values to your .env file');
    return;
  }

  // Test API connection
  console.log('🌐 Testing Square API Connection...\n');

  try {
    const baseUrl = environment === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com';

    const response = await fetch(`${baseUrl}/v2/locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-10-17'
      }
    });

    if (response.ok) {
      const data = await response.json();

      console.log('✅ Successfully connected to Square API!\n');

      if (data.locations && data.locations.length > 0) {
        console.log(`📍 Found ${data.locations.length} location(s):\n`);
        data.locations.forEach((location: any, index: number) => {
          console.log(`   ${index + 1}. ${location.name}`);
          console.log(`      ID: ${location.id}`);
          console.log(`      Status: ${location.status}`);
          console.log(`      Country: ${location.country}`);
          if (location.address) {
            console.log(`      Address: ${location.address.address_line_1 || ''}, ${location.address.locality || ''}`);
          }
          console.log('');
        });

        console.log('💡 Use one of these Location IDs in your .env files');
        console.log(`   Backend: SQUARE_LOCATION_ID=${data.locations[0].id}`);
        console.log(`   Frontend: NEXT_PUBLIC_SQUARE_LOCATION_ID=${data.locations[0].id}`);
      } else {
        console.log('⚠️  No locations found. You need to create a location in Square dashboard.');
      }
    } else {
      const errorData = await response.json();
      console.error('❌ API request failed:', response.status);
      console.error('   Error:', JSON.stringify(errorData, null, 2));

      if (response.status === 401) {
        console.log('\n💡 Authentication failed. This usually means:');
        console.log('   - Access Token is invalid or expired');
        console.log('   - Access Token is from a different Square account');
        console.log('   - Access Token environment (sandbox/production) doesn\'t match');
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run verification
verifySquareCredentials().then(() => {
  console.log('\n🏁 Verification complete');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});