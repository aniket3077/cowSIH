import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseApp: admin.app.App;
let firestore: FirebaseFirestore.Firestore;

export const initializeFirebase = () => {
  try {
    // Check if we have the required Firebase credentials
    const hasValidPrivateKey = process.env.FIREBASE_PRIVATE_KEY && 
                               !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY_HERE') &&
                               process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');
    
    if (!hasValidPrivateKey || !process.env.FIREBASE_CLIENT_EMAIL || 
        process.env.FIREBASE_CLIENT_EMAIL.includes('xxxxx')) {
      console.warn('⚠️  Firebase Admin SDK credentials not configured. Authentication will be disabled.');
      console.warn('   To enable Firebase Auth:');
      console.warn('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.warn('   2. Generate a new private key');
      console.warn('   3. Update the Firebase credentials in .env file');
      return;
    }

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    firestore = getFirestore(firebaseApp);

    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    console.warn('⚠️  Continuing without Firebase authentication...');
    // Don't throw error in development - just warn
  }
};

export const getFirebaseApp = (): admin.app.App | null => {
  if (!firebaseApp) {
    console.warn('Firebase app not initialized. Authentication features will be disabled.');
    return null;
  }
  return firebaseApp;
};

export const getFirestoreDb = (): FirebaseFirestore.Firestore | null => {
  if (!firestore) {
    console.warn('Firestore not initialized. Database sync features will be disabled.');
    return null;
  }
  return firestore;
};

export { admin };