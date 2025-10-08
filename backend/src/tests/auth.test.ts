import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { login, registerClient, registerCoach } from '../controllers/authController';
import { supabase } from '../lib/supabase';
import emailService from '../services/emailService';
import { validationResult } from 'express-validator';

// Mock dependencies
jest.mock('../lib/supabase');
jest.mock('../services/emailService');
jest.mock('express-validator');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Authentication Controller - Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    req = {
      body: {},
      app: {
        get: jest.fn()
      } as any
    };

    res = {
      json: mockJson,
      status: mockStatus
    };

    // Setup default mocks
    (validationResult as any).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };
    });

    test('should successfully login a client with valid credentials', async () => {
      // Arrange
      const mockProfile = {
        id: 'client-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        status: 'active'
      };

      const supabaseMock = supabase as any;
      supabaseMock.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      // Setup client query to return mockProfile
      const clientQueryMock = {
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      };

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'clients') return clientQueryMock;
        return {
          select: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        };
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        token: 'mock-jwt-token',
        user: expect.objectContaining({
          id: 'client-123',
          email: 'test@example.com',
          role: 'client',
          first_name: 'John',
          last_name: 'Doe'
        })
      });
      expect(mockStatus).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid email', async () => {
      // Arrange
      const supabaseMock = supabase as any;
      supabaseMock.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    test('should return 401 for invalid password', async () => {
      // Arrange
      const mockProfile = {
        id: 'client-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        status: 'active'
      };

      const supabaseMock = supabase as any;
      const clientQueryMock = {
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      };

      supabaseMock.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'clients') return clientQueryMock;
        return {
          select: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    test('should return 403 for suspended account', async () => {
      // Arrange
      const mockProfile = {
        id: 'client-123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        status: 'suspended'
      };

      const supabaseMock = supabase as any;
      const clientQueryMock = {
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      };

      supabaseMock.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'clients') return clientQueryMock;
        return {
          select: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      });

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('suspended'),
        statusCode: 'ACCOUNT_SUSPENDED'
      });
    });

    test('should handle admin login correctly', async () => {
      // Arrange
      const mockAdminProfile = {
        id: 'admin-123',
        email: 'admin@example.com',
        password_hash: 'hashed_password',
        first_name: 'Admin',
        last_name: 'User'
      };

      const supabaseMock = supabase as any;
      const adminQueryMock = {
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockAdminProfile, error: null })
          })
        })
      };

      supabaseMock.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'admins') return adminQueryMock;
        return {
          select: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        };
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-admin-token');

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        token: 'mock-admin-token',
        user: expect.objectContaining({
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        })
      });
    });
  });

  describe('registerClient', () => {
    beforeEach(() => {
      req.body = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'SecurePass123!',
        phone: '+1234567890'
      };
    });

    test('should successfully register a new client', async () => {
      // Arrange
      const mockNewClient = {
        id: 'new-client-123',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '+1234567890'
      };

      const supabaseMock = supabase as any;

      // Mock email check - no existing user
      const emailCheckMock = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };

      // Mock client insert
      const clientInsertMock = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewClient, error: null })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      };

      supabaseMock.from = jest.fn().mockImplementation((table: string) => {
        if (table === 'clients') return { ...emailCheckMock, ...clientInsertMock };
        return emailCheckMock;
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      (jwt.sign as jest.Mock).mockReturnValue('mock-new-token');
      (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue({ success: true });

      // Act
      await registerClient(req as Request, res as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Registration successful',
        token: 'mock-new-token',
        user: expect.objectContaining({
          id: 'new-client-123',
          email: 'jane@example.com',
          role: 'client'
        })
      });
    });

    test('should return 400 for duplicate email', async () => {
      // Arrange
      const existingUser = {
        id: 'existing-123',
        email: 'jane@example.com'
      };

      const supabaseMock = supabase as any;
      const emailCheckMock = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: existingUser, error: null })
          })
        })
      };

      supabaseMock.from = jest.fn().mockReturnValue(emailCheckMock);

      // Act
      await registerClient(req as Request, res as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Email already registered'
      });
    });

    test('should handle validation errors', async () => {
      // Arrange
      const validationErrors = [
        { msg: 'Invalid email', path: 'email' },
        { msg: 'Password too weak', path: 'password' }
      ];

      (validationResult as any).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      });

      // Act
      await registerClient(req as Request, res as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ errors: validationErrors });
    });
  });
});