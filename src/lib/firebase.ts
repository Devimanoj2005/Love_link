import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration matching your project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAI1Juk4powuif8HYmua5PxPrTsLbMqrlk",
  authDomain: "luv---link.firebaseapp.com",
  projectId: "luv---link",
  storageBucket: "luv---link.firebasestorage.app",
  messagingSenderId: "900717913292",
  appId: "1:900717913292:web:2c139b09c092a5f32dce69",
  measurementId: "G-8QG2EDCK0J"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId and graceful fallback
let dbInstance: any;
try {
  dbInstance = initializeFirestore(app, {
    databaseId: "ai-studio-lovelink-c92df1e5-9dfb-4a27-96a7-b34096158c33"
  });
} catch (e) {
  console.warn("Failed to initialize with specific databaseId, falling back to default Firestore:", e);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// Initialize Storage and Auth
export const storage = getStorage(app);
export const auth = getAuth(app);

// ABAC Firestore Error Handling & JSON Diagnostic logger
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();
