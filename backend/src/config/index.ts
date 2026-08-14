import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  env: string;
  isProd: boolean;
  port: number;
  clientUrl: string;
  corsOrigins: string[];
  apiUrl: string;
  mongoUri: string;
  jwt: {
    secret: string;
    accessExpires: string;
    refreshExpires: string;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  adminEmail: string | undefined;
  adminPassword: string | undefined;
  legacy: {
    uri: string | undefined;
    dbName: string | undefined;
    usersCollection: string;
    matchField: string;
  };
  cashback: {
    minWithdrawal: number;
    maxWithdrawal: number;
    referralBonusRate: number;
    confirmDays: number;
  };
  postbackSecret: string | undefined;
}

const required = ['MONGODB_URI', 'JWT_SECRET', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  console.warn(`[env] Missing env vars (server will boot but Firebase auth is disabled): ${missing.join(', ')}`);
}

const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  corsOrigins: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean),
  apiUrl: process.env.API_URL || 'http://localhost:5000',

  mongoUri: process.env.MONGODB_URI as string,

  jwt: {
    secret: process.env.JWT_SECRET as string,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/\r/g, ''),
  },

  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,

  // YOlast.com legacy database — used to restrict login to existing registered users only.
  legacy: {
    uri: process.env.LEGACY_DB_URI,
    dbName: process.env.LEGACY_DB_NAME,
    usersCollection: process.env.LEGACY_USERS_COLLECTION || 'users',
    matchField: process.env.LEGACY_USER_MATCH_FIELD || 'phone',
  },

  cashback: {
    minWithdrawal: Number(process.env.MIN_WITHDRAWAL) || 10,
    maxWithdrawal: Number(process.env.MAX_WITHDRAWAL) || 0,
    referralBonusRate: Number(process.env.REFERRAL_BONUS_RATE) || 10,
    confirmDays: Number(process.env.CASHBACK_CONFIRM_DAYS) || 30,
  },

  postbackSecret: process.env.POSTBACK_SECRET,
};

export default config;
