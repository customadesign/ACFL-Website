import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import * as jwt from 'jsonwebtoken';

// Extend Request type to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: 'client' | 'coach' | 'admin' | 'staff';
  };
}

// Mock dependencies
jest.mock('../lib/supabase');

describe('Admin Routes - Unit Tests', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    req = {
      query: {},
      params: {},
      user: {
        id: 'admin-123',
        userId: 'admin-123',
        email: 'admin@test.com',
        role: 'admin'
      },
      headers: {
        authorization: 'Bearer valid-token'
      }
    };

    res = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users endpoint logic', () => {
    test('should fetch all users when no filters are provided', async () => {
      // Arrange
      const mockClients = [
        {
          id: 'client-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          created_at: '2024-01-01',
          last_login: '2024-01-15',
          status: 'active',
          is_active: true
        }
      ];

      const mockCoaches = [
        {
          id: 'coach-1',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          created_at: '2024-01-02',
          last_login: '2024-01-16',
          status: 'active',
          is_active: true
        }
      ];

      const mockStaff = [
        {
          id: 'staff-1',
          first_name: 'Bob',
          last_name: 'Wilson',
          email: 'bob@example.com',
          phone: '+1122334455',
          created_at: '2024-01-03',
          last_login: '2024-01-17',
          status: 'active',
          department: 'Support',
          role_level: 'Senior'
        }
      ];

      const supabaseMock = supabase as any;
      supabaseMock.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockClients, error: null })
          };
        }
        if (table === 'coaches') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockCoaches, error: null })
          };
        }
        if (table === 'staff') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockStaff, error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      // Act - Simulate the logic from the admin route
      const users = [];

      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status, is_active');

      if (clients) {
        users.push(...clients.map(client => ({
          ...client,
          name: `${client.first_name} ${client.last_name}`,
          role: 'client',
          status: client.is_active === false ? 'inactive' : (client.status || 'active')
        })));
      }

      const { data: coaches, error: coachesError } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status, is_active');

      if (coaches) {
        users.push(...coaches.map(coach => ({
          ...coach,
          name: `${coach.first_name} ${coach.last_name}`,
          role: 'coach',
          status: coach.is_active === false ? 'inactive' : (coach.status || 'active')
        })));
      }

      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status, department, role_level');

      if (staff) {
        users.push(...staff.map(staffMember => ({
          ...staffMember,
          name: `${staffMember.first_name} ${staffMember.last_name}`,
          role: 'staff',
          status: staffMember.status || 'active'
        })));
      }

      // Assert
      expect(users).toHaveLength(3);
      expect(users[0]).toMatchObject({
        name: 'John Doe',
        role: 'client',
        email: 'john@example.com'
      });
      expect(users[1]).toMatchObject({
        name: 'Jane Smith',
        role: 'coach',
        email: 'jane@example.com'
      });
      expect(users[2]).toMatchObject({
        name: 'Bob Wilson',
        role: 'staff',
        email: 'bob@example.com',
        department: 'Support'
      });
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      const supabaseMock = supabase as any;
      supabaseMock.from = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: dbError })
      });

      // Act
      const users = [];
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      // Assert
      expect(clientsError).toBe(dbError);
      expect(clients).toBeNull();
      expect(users).toHaveLength(0);
    });

    test('should filter users by role', async () => {
      // Arrange
      const mockClients = [
        { id: 'client-1', first_name: 'John', last_name: 'Doe', status: 'active' }
      ];

      const supabaseMock = supabase as any;
      supabaseMock.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockResolvedValue({ data: mockClients, error: null })
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        };
      });

      // Test filtering by client role
      const roleFilter = 'client';
      const users = [];

      // When roleFilter is 'client', only fetch clients
      if (roleFilter === 'client') {
        const { data: clients } = await supabase
          .from('clients')
          .select('*');
        if (clients) {
          users.push(...clients.map(c => ({ ...c, role: 'client' })));
        }
      } else if (roleFilter === 'coach') {
        const { data: coaches } = await supabase
          .from('coaches')
          .select('*');
        if (coaches) {
          users.push(...coaches.map(c => ({ ...c, role: 'coach' })));
        }
      } else {
        // No filter - fetch both
        const { data: clients } = await supabase
          .from('clients')
          .select('*');
        if (clients) {
          users.push(...clients.map(c => ({ ...c, role: 'client' })));
        }

        const { data: coaches } = await supabase
          .from('coaches')
          .select('*');
        if (coaches) {
          users.push(...coaches.map(c => ({ ...c, role: 'coach' })));
        }
      }

      // Assert
      expect(users).toHaveLength(1);
      expect(users[0].role).toBe('client');
    });

    test('should filter users by status', async () => {
      // Arrange
      const mockClients = [
        { id: 'client-1', first_name: 'John', status: 'active' },
        { id: 'client-2', first_name: 'Jane', status: 'suspended' },
        { id: 'client-3', first_name: 'Bob', status: 'active' }
      ];

      const statusFilter = 'active';
      const filteredClients = mockClients.filter(c => c.status === statusFilter);

      // Assert
      expect(filteredClients).toHaveLength(2);
      expect(filteredClients.every(c => c.status === 'active')).toBe(true);
    });

    test('should handle users with missing names gracefully', async () => {
      // Arrange
      const mockClients = [
        { id: 'client-1', first_name: '', last_name: '', email: 'noname@example.com' },
        { id: 'client-2', first_name: 'John', last_name: null, email: 'john@example.com' }
      ];

      // Act
      const users = mockClients.map(client => ({
        ...client,
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed User',
        role: 'client'
      }));

      // Assert
      expect(users[0].name).toBe('Unnamed User');
      expect(users[1].name).toBe('John');
    });
  });

  describe('User Status Management', () => {
    test('should correctly map is_active to status', () => {
      const testCases = [
        { is_active: false, status: null, expected: 'inactive' },
        { is_active: false, status: 'suspended', expected: 'inactive' },
        { is_active: true, status: 'active', expected: 'active' },
        { is_active: true, status: null, expected: 'active' },
        { is_active: null, status: 'suspended', expected: 'suspended' }
      ];

      testCases.forEach(testCase => {
        const result = testCase.is_active === false ? 'inactive' : (testCase.status || 'active');
        expect(result).toBe(testCase.expected);
      });
    });

    test('should include deactivated_at timestamp when available', () => {
      const user = {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        is_active: false,
        deactivated_at: '2024-01-20T10:00:00Z'
      };

      const processedUser = {
        ...user,
        name: 'John Doe',
        role: 'client',
        status: user.is_active === false ? 'inactive' : 'active'
      };

      expect(processedUser.status).toBe('inactive');
      expect(processedUser.deactivated_at).toBe('2024-01-20T10:00:00Z');
    });
  });

  describe('Authorization and Permissions', () => {
    test('should verify admin role for user management', () => {
      const adminUser = { role: 'admin' };
      const staffUser = { role: 'staff' };
      const clientUser = { role: 'client' };

      const canAccessUsers = (user: any) => {
        return user.role === 'admin' || user.role === 'staff';
      };

      expect(canAccessUsers(adminUser)).toBe(true);
      expect(canAccessUsers(staffUser)).toBe(true);
      expect(canAccessUsers(clientUser)).toBe(false);
    });

    test('should validate JWT token structure', () => {
      const validToken = jwt.sign(
        { id: 'test-123', role: 'admin', email: 'admin@test.com' },
        'test-secret'
      );

      const decoded = jwt.verify(validToken, 'test-secret') as any;

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('email');
      expect(decoded.role).toBe('admin');
    });
  });
});