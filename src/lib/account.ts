import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User,
} from 'firebase/auth';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

import { db } from './firebase';

/** Everything stored under users/{uid}/. Keep in sync when adding collections. */
const USER_COLLECTIONS = ['lists', 'items', 'completions', 'progress', 'meta'];
const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch

/** Firebase requires a recent sign-in for sensitive changes, so confirm the current password first. */
async function reauth(user: User, password: string) {
  if (!user.email) throw new Error('This account has no email address.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

export async function changePassword(user: User, current: string, next: string) {
  await reauth(user, current);
  await updatePassword(user, next);
}

/** Deletes all of the user's data, then the account itself. */
export async function deleteAccount(user: User, password: string) {
  await reauth(user, password);
  if (db) {
    for (const name of USER_COLLECTIONS) {
      const snap = await getDocs(collection(db, 'users', user.uid, name));
      for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  }
  await deleteUser(user);
}

/** Turns Firebase auth error codes into plain sentences. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'That password isn’t right.';
  if (code.includes('weak-password')) return 'The new password needs at least 6 characters.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute and try again.';
  if (code.includes('network')) return 'No connection. Check your internet and try again.';
  return e instanceof Error ? e.message.replace(/^Firebase: /, '') : 'Something went wrong.';
}
