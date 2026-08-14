declare global {
  namespace Express {
    interface Request {
      user?: any;
      entityType?: 'user' | 'admin';
      role?: string;
      token?: any;
    }
  }
}

export {};
