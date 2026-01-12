import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

// Required environment variables for Firebase Admin
const REQUIRED_ENV_VARS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_DATABASE_URL'
] as const;

// Validate environment variables
function validateEnvVars(): Record<string, string> {
  const missing: string[] = [];
  const env: Record<string, string> = {};
  
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      env[varName] = value;
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required Firebase environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') + '\n\n' +
      'Please set these environment variables in your deployment environment.\n' +
      'For local development, create a .env file with these values.'
    );
  }
  
  return env;
}

// Initialize Firebase Admin SDK with error handling
let app: any;
let db: any;
let auth: any;

try {
  const env = validateEnvVars();
  
  // Parse private key (handle escaped newlines)
  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  // Initialize Firebase Admin
  app = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL: env.FIREBASE_DATABASE_URL,
  });
  
  // Initialize services
  db = getDatabase(app);
  auth = getAuth(app);
  
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log(`📊 Project: ${env.FIREBASE_PROJECT_ID}`);
  console.log(`🔗 Database: ${env.FIREBASE_DATABASE_URL}`);
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error instanceof Error ? error.message : 'Unknown error');
  
  // In production, we want to fail fast
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  
  // In development, provide mock services to prevent crashes
  console.warn('⚠️  Running with mock Firebase services (development mode)');
  
  app = null;
  db = {
    ref: () => ({
      once: () => Promise.resolve({ val: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      remove: () => Promise.resolve(),
      push: () => ({ key: 'mock-key' }),
      orderByChild: () => ({
        equalTo: () => ({
          once: () => Promise.resolve({ val: () => null })
        })
      })
    })
  };
  
  auth = {
    verifyIdToken: () => Promise.reject(new Error('Mock auth - not implemented'))
  };
}

export { db, auth };
