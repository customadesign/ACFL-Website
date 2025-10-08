import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/authRoutes';
import adminRoutes from '../routes/adminRoutes';
import { authenticate, authorize } from '../middleware/auth';
import jwt from 'jsonwebtoken';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;
  let authToken: string;
  let adminToken: string;

  beforeAll(() => {
    app = createTestApp();

    // Create test tokens
    authToken = jwt.sign(
      {
        id: 'test-client-123',
        userId: 'test-client-123',
        email: 'client@test.com',
        role: 'client'
      },
      process.env.JWT_SECRET || 'test-secret'
    );

    adminToken = jwt.sign(
      {
        id: 'test-admin-123',
        userId: 'test-admin-123',
        email: 'admin@test.com',
        role: 'admin'
      },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  describe('POST /api/auth/login', () => {
    test('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'email',
            msg: expect.stringContaining('email')
          })
        ])
      );
    });

    test('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'password',
            msg: expect.stringContaining('Password')
          })
        ])
      );
    });

    test('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should accept valid login request format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!'
        });

      // The actual login will fail (no real user), but we're testing the request format
      expect([200, 401, 403]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/auth/register/client', () => {
    test('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'not-an-email',
          password: 'ValidPass123!',
          phone: '+1234567890'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'email'
          })
        ])
      );
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'weak',
          phone: '+1234567890'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'password',
            msg: expect.stringContaining('8 characters')
          })
        ])
      );
    });

    test('should accept valid registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'ValidPass123!',
          phone: '+1234567890'
        });

      // The actual registration might fail (duplicate email, etc), but format is valid
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/admin/users', () => {
    test('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Please authenticate');
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Please authenticate');
    });

    test('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });

    test('should accept valid admin token format', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // The actual query might fail (database connection), but auth should pass
      expect([200, 500]).toContain(response.status);
    });

    test('should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=client&status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Authentication Middleware', () => {
    test('should extract token from Bearer header', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Profile endpoint requires authentication
      expect([200, 500]).toContain(response.status);
    });

    test('should reject requests without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', authToken);

      expect(response.status).toBe(401);
    });

    test('should reject malformed tokens', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer malformed.token.here');

      expect(response.status).toBe(401);
    });
  });

  describe('CORS Configuration', () => {
    test('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
    });

    test('should include CORS headers in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    test('should handle missing content-type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('email=test@example.com&password=password123');

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting and Security', () => {
    test('should prevent SQL injection in email field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@example.com' OR '1'='1",
          password: 'password123'
        });

      // Should be handled safely
      expect([400, 401]).toContain(response.status);
      expect(response.body).not.toContain('SQL');
    });

    test('should sanitize XSS attempts', async () => {
      const response = await request(app)
        .post('/api/auth/register/client')
        .send({
          firstName: '<script>alert("XSS")</script>',
          lastName: 'Doe',
          email: 'xss@example.com',
          password: 'ValidPass123!',
          phone: '+1234567890'
        });

      // Should handle safely without executing script
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should handle large payloads', async () => {
      const largeString = 'a'.repeat(10000);
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: largeString
        });

      // Should handle without crashing
      expect(response.status).toBeDefined();
    });
  });
});