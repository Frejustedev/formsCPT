'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  User,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { MedicalRecordFormValues, StoredMedicalRecord } from '@/lib/schemas';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const SUPER_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'agbotonfrejuste@gmail.com').toLowerCase();

type FirebaseContextType = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  signInWithGoogle: async () => {},
  logOut: async () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const email = (nextUser.email || '').trim();
        if (email) {
          await setDoc(
            doc(db, 'users', nextUser.uid),
            {
              email,
              displayName: nextUser.displayName || email.split('@')[0],
              createdAt: Date.now(),
            },
            { merge: true },
          );
        }
      } catch (e) {
        console.error('Could not register user', e);
      }

      try {
        const tokenResult = await nextUser.getIdTokenResult();
        const claimAdmin = tokenResult.claims.admin === true;
        const emailMatch = (nextUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL;
        if (emailMatch || claimAdmin) {
          setIsAdmin(true);
        } else {
          const adminDoc = await getDocFromServer(doc(db, 'admins', nextUser.uid));
          setIsAdmin(adminDoc.exists());
        }
      } catch (e) {
        console.error('Admin check failed', e);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<FirebaseContextType>(
    () => ({
      user,
      isAdmin,
      loading,
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
          await signInWithPopup(auth, provider);
        } catch (error) {
          const code = (error as { code?: string }).code;
          if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
            await signInWithRedirect(auth, provider);
            return;
          }
          console.error('Login failed', error);
          throw error;
        }
      },
      logOut: async () => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Logout failed', error);
        }
      },
    }),
    [user, isAdmin, loading],
  );

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export const useFirebase = () => useContext(FirebaseContext);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', errInfo);
  return errInfo;
}

export async function logAction(action: string, details: string) {
  if (!auth.currentUser) return;
  try {
    const logId = crypto.randomUUID();
    await setDoc(doc(db, 'logs', logId), {
      action,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email || '',
      details,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error('Could not write log', e);
  }
}

export async function isNumeroDossierTaken(numeroDossier: string, excludeId?: string): Promise<boolean> {
  if (!numeroDossier) return false;
  const q = query(collection(db, 'records'), where('numeroDossier', '==', numeroDossier));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  if (!excludeId) return true;
  return snapshot.docs.some((d) => d.id !== excludeId);
}

export async function createMedicalRecord(
  recordId: string,
  data: MedicalRecordFormValues,
  userId: string,
) {
  const now = Date.now();
  const payload = {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  delete (payload as Record<string, unknown>).id;
  await setDoc(doc(db, 'records', recordId), payload);
  return payload;
}

export async function updateMedicalRecord(
  recordId: string,
  data: MedicalRecordFormValues,
  editedBy: string,
  editedByEmail: string,
) {
  const now = Date.now();
  const previousSnap = await getDoc(doc(db, 'records', recordId));
  const payload = { ...data, updatedAt: now };
  delete (payload as Record<string, unknown>).id;
  delete (payload as Record<string, unknown>).userId;
  delete (payload as Record<string, unknown>).createdAt;
  await updateDoc(doc(db, 'records', recordId), payload);
  if (previousSnap.exists()) {
    try {
      const versionId = `${now}`;
      await setDoc(doc(db, 'records', recordId, 'versions', versionId), {
        recordId,
        snapshot: JSON.stringify(previousSnap.data()),
        editedBy,
        editedByEmail,
        createdAt: now,
        _serverTime: serverTimestamp(),
      });
    } catch (e) {
      console.error('Could not write version snapshot', e);
    }
  }
  return payload;
}

export type { StoredMedicalRecord };
