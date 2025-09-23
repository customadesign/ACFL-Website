import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        role: 'client' | 'coach' | 'admin' | 'staff';
        [key: string]: any;
      };
    }
  }
}