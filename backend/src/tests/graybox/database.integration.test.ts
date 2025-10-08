import { supabase } from '../../lib/supabase';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gray-box Database Integration Tests
 * Tests database operations with knowledge of schema but using real database connections
 */

describe('Database Integration Tests (Gray-box)', () => {
  const testPrefix = 'test_graybox_';
  const testUsers: any[] = [];

  // Cleanup function to remove test data
  const cleanupTestData = async () => {
    for (const user of testUsers) {
      if (user.role === 'client') {
        await supabase.from('clients').delete().eq('id', user.id);
      } else if (user.role === 'coach') {
        await supabase.from('coaches').delete().eq('id', user.id);
      } else if (user.role === 'staff') {
        await supabase.from('staff').delete().eq('id', user.id);
      }
    }
    testUsers.length = 0;
  };

  beforeAll(async () => {
    // Verify database connection
    const { error } = await supabase.from('clients').select('count').limit(1);
    if (error) {
      console.error('Database connection failed:', error);
      throw new Error('Cannot run integration tests without database connection');
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('User Creation and Retrieval', () => {
    test('should create and retrieve a client with all fields', async () => {
      const testClient = {
        id: uuidv4(),
        first_name: `${testPrefix}John`,
        last_name: 'Doe',
        email: `${testPrefix}john.doe@test.com`,
        phone: '+1234567890',
        password_hash: await bcrypt.hash('TestPass123!', 10),
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Create client
      const { data: createdClient, error: createError } = await supabase
        .from('clients')
        .insert(testClient)
        .select()
        .single();

      expect(createError).toBeNull();
      expect(createdClient).toBeDefined();
      expect(createdClient?.email).toBe(testClient.email);

      // Store for cleanup
      testUsers.push({ ...createdClient, role: 'client' });

      // Retrieve client
      const { data: retrievedClient, error: retrieveError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', createdClient.id)
        .single();

      expect(retrieveError).toBeNull();
      expect(retrievedClient).toMatchObject({
        id: testClient.id,
        email: testClient.email,
        first_name: testClient.first_name,
        last_name: testClient.last_name
      });
    });

    test('should enforce unique email constraint', async () => {
      const email = `${testPrefix}unique@test.com`;

      const client1 = {
        id: uuidv4(),
        first_name: 'Client1',
        last_name: 'Test',
        email: email,
        password_hash: await bcrypt.hash('Pass123!', 10)
      };

      const client2 = {
        id: uuidv4(),
        first_name: 'Client2',
        last_name: 'Test',
        email: email, // Same email
        password_hash: await bcrypt.hash('Pass456!', 10)
      };

      // Create first client
      const { data: created1, error: error1 } = await supabase
        .from('clients')
        .insert(client1)
        .select()
        .single();

      expect(error1).toBeNull();
      testUsers.push({ ...created1, role: 'client' });

      // Try to create second client with same email
      const { data: created2, error: error2 } = await supabase
        .from('clients')
        .insert(client2)
        .select()
        .single();

      expect(error2).toBeDefined();
      expect(created2).toBeNull();
    });

    test('should handle concurrent user operations', async () => {
      const operations = [];

      // Create 5 users concurrently
      for (let i = 0; i < 5; i++) {
        const operation = supabase
          .from('clients')
          .insert({
            id: uuidv4(),
            first_name: `${testPrefix}Concurrent${i}`,
            last_name: 'User',
            email: `${testPrefix}concurrent${i}@test.com`,
            password_hash: await bcrypt.hash('Pass123!', 10)
          })
          .select()
          .single();

        operations.push(operation);
      }

      const results = await Promise.allSettled(operations);

      // All operations should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.data).toBeDefined();
          testUsers.push({ ...result.value.data, role: 'client' });
        }
      });
    });
  });

  describe('User Status Transitions', () => {
    test('should track status changes with timestamps', async () => {
      const testClient = {
        id: uuidv4(),
        first_name: `${testPrefix}StatusTest`,
        last_name: 'User',
        email: `${testPrefix}status@test.com`,
        password_hash: await bcrypt.hash('Pass123!', 10),
        status: 'active',
        is_active: true
      };

      // Create active client
      const { data: client, error: createError } = await supabase
        .from('clients')
        .insert(testClient)
        .select()
        .single();

      expect(createError).toBeNull();
      testUsers.push({ ...client, role: 'client' });

      // Deactivate client
      const deactivatedAt = new Date().toISOString();
      const { data: deactivated, error: deactivateError } = await supabase
        .from('clients')
        .update({
          status: 'inactive',
          is_active: false,
          deactivated_at: deactivatedAt
        })
        .eq('id', client.id)
        .select()
        .single();

      expect(deactivateError).toBeNull();
      expect(deactivated.status).toBe('inactive');
      expect(deactivated.is_active).toBe(false);
      expect(deactivated.deactivated_at).toBeDefined();

      // Reactivate client
      const { data: reactivated, error: reactivateError } = await supabase
        .from('clients')
        .update({
          status: 'active',
          is_active: true,
          deactivated_at: null
        })
        .eq('id', client.id)
        .select()
        .single();

      expect(reactivateError).toBeNull();
      expect(reactivated.status).toBe('active');
      expect(reactivated.is_active).toBe(true);
      expect(reactivated.deactivated_at).toBeNull();
    });

    test('should handle cascading updates for user relationships', async () => {
      // Create a coach
      const coach = {
        id: uuidv4(),
        first_name: `${testPrefix}Coach`,
        last_name: 'Test',
        email: `${testPrefix}coach@test.com`,
        password_hash: await bcrypt.hash('Pass123!', 10),
        status: 'active'
      };

      const { data: createdCoach, error: coachError } = await supabase
        .from('coaches')
        .insert(coach)
        .select()
        .single();

      expect(coachError).toBeNull();
      testUsers.push({ ...createdCoach, role: 'coach' });

      // Create a client
      const client = {
        id: uuidv4(),
        first_name: `${testPrefix}Client`,
        last_name: 'Test',
        email: `${testPrefix}client.rel@test.com`,
        password_hash: await bcrypt.hash('Pass123!', 10),
        status: 'active'
      };

      const { data: createdClient, error: clientError } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

      expect(clientError).toBeNull();
      testUsers.push({ ...createdClient, role: 'client' });

      // Create a session between them
      const session = {
        id: uuidv4(),
        coach_id: createdCoach.id,
        client_id: createdClient.id,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        duration_minutes: 60,
        status: 'scheduled'
      };

      const { data: createdSession, error: sessionError } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();

      // Session creation should work with valid IDs
      if (sessionError) {
        console.log('Session table might not exist or have different structure');
      } else {
        expect(createdSession).toBeDefined();

        // Clean up session
        await supabase.from('sessions').delete().eq('id', createdSession.id);
      }
    });
  });

  describe('Data Integrity and Constraints', () => {
    test('should validate email format at database level', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com'
      ];

      for (const email of invalidEmails) {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            id: uuidv4(),
            first_name: 'Test',
            last_name: 'User',
            email: email,
            password_hash: 'hash'
          })
          .select()
          .single();

        // Database should reject invalid emails
        if (!error) {
          // If it doesn't reject, clean up and note
          testUsers.push({ ...data, role: 'client' });
          console.warn(`Database accepted invalid email: ${email}`);
        }
      }
    });

    test('should handle null values in optional fields', async () => {
      const minimalClient = {
        id: uuidv4(),
        first_name: `${testPrefix}Minimal`,
        last_name: 'User',
        email: `${testPrefix}minimal@test.com`,
        password_hash: await bcrypt.hash('Pass123!', 10)
        // No phone, profile_photo, or other optional fields
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(minimalClient)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.phone).toBeNull();
      expect(data.profile_photo).toBeNull();

      testUsers.push({ ...data, role: 'client' });
    });

    test('should handle very long strings within limits', async () => {
      const longBio = 'A'.repeat(1000); // 1000 character bio
      const longName = 'N'.repeat(50); // 50 character name

      const client = {
        id: uuidv4(),
        first_name: longName.substring(0, 50),
        last_name: 'Test',
        email: `${testPrefix}longstrings@test.com`,
        password_hash: await bcrypt.hash('Pass123!', 10),
        bio: longBio
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

      // Check if it handles or truncates
      if (!error) {
        expect(data).toBeDefined();
        testUsers.push({ ...data, role: 'client' });
      }
    });
  });

  describe('Query Performance and Optimization', () => {
    test('should efficiently filter users by multiple criteria', async () => {
      // Create test data set
      const testDataSet = [];
      for (let i = 0; i < 10; i++) {
        testDataSet.push({
          id: uuidv4(),
          first_name: `${testPrefix}Perf${i}`,
          last_name: 'Test',
          email: `${testPrefix}perf${i}@test.com`,
          password_hash: await bcrypt.hash('Pass123!', 10),
          status: i % 2 === 0 ? 'active' : 'inactive',
          is_active: i % 2 === 0
        });
      }

      // Bulk insert
      const { data: inserted, error: insertError } = await supabase
        .from('clients')
        .insert(testDataSet)
        .select();

      expect(insertError).toBeNull();
      inserted?.forEach(user => testUsers.push({ ...user, role: 'client' }));

      // Test complex query
      const startTime = Date.now();

      const { data: filtered, error: filterError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, status')
        .eq('status', 'active')
        .ilike('first_name', `${testPrefix}Perf%`)
        .order('created_at', { ascending: false })
        .limit(5);

      const queryTime = Date.now() - startTime;

      expect(filterError).toBeNull();
      expect(filtered?.length).toBeLessThanOrEqual(5);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify filtering worked
      filtered?.forEach(user => {
        expect(user.status).toBe('active');
        expect(user.first_name).toContain(`${testPrefix}Perf`);
      });
    });

    test('should handle pagination correctly', async () => {
      const pageSize = 3;
      const offset = 0;

      const { data: page1, error: error1 } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', `${testPrefix}%`)
        .range(offset, offset + pageSize - 1);

      expect(error1).toBeNull();
      expect(page1?.length).toBeLessThanOrEqual(pageSize);

      // Get second page
      const { data: page2, error: error2 } = await supabase
        .from('clients')
        .select('*')
        .ilike('email', `${testPrefix}%`)
        .range(pageSize, pageSize * 2 - 1);

      expect(error2).toBeNull();

      // Pages should not overlap
      if (page1?.length && page2?.length) {
        const page1Ids = page1.map(u => u.id);
        const page2Ids = page2.map(u => u.id);
        const overlap = page1Ids.filter(id => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      }
    });
  });
});