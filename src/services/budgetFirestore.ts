import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, BudgetConfig } from '../types';
import { User } from 'firebase/auth';

/**
 * Saves or updates user profile in /users/{userId}
 */
export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Budget User',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to user transactions in real-time
 */
export function subscribeToTransactions(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/transactions`;
  const q = query(collection(db, 'users', userId, 'transactions'), orderBy('sno', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: data.id || docSnap.id,
          sno: Number(data.sno) || 1,
          date: data.date,
          time: data.time || '',
          title: data.title || '',
          category: data.category || 'General',
          type: data.type === 'add' ? 'add' : 'minus',
          amount: Number(data.amount) || 0,
          notes: data.notes || '',
          createdAt: Number(data.createdAt) || Date.now(),
        });
      });
      onUpdate(list);
    },
    (error) => {
      console.error('Transactions snapshot error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Saves a single transaction to Firestore
 */
export async function saveTransactionToCloud(
  userId: string,
  tx: Transaction
): Promise<void> {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', tx.id);
    const payload = {
      id: tx.id,
      sno: tx.sno,
      date: tx.date,
      time: tx.time || '',
      title: tx.title.substring(0, 200),
      category: tx.category.substring(0, 60),
      type: tx.type,
      amount: tx.amount,
      notes: tx.notes ? tx.notes.substring(0, 500) : '',
      userId,
      createdAt: tx.createdAt || Date.now(),
    };
    await setDoc(txRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a transaction from Firestore
 */
export async function deleteTransactionFromCloud(
  userId: string,
  transactionId: string
): Promise<void> {
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to user budget configuration in real-time
 */
export function subscribeToBudgetConfig(
  userId: string,
  onUpdate: (config: BudgetConfig) => void
): Unsubscribe {
  const path = `users/${userId}/settings/budgetConfig`;
  const configRef = doc(db, 'users', userId, 'settings', 'budgetConfig');

  return onSnapshot(
    configRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          startingBalance: Number(data.startingBalance) ?? 1200,
          currencySymbol: data.currencySymbol || '$',
          currencyCode: data.currencyCode || 'USD',
          dailyBudgetLimit: Number(data.dailyBudgetLimit) ?? 150,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Saves budget configuration to Firestore
 */
export async function saveBudgetConfigToCloud(
  userId: string,
  config: BudgetConfig
): Promise<void> {
  const path = `users/${userId}/settings/budgetConfig`;
  try {
    const configRef = doc(db, 'users', userId, 'settings', 'budgetConfig');
    await setDoc(configRef, {
      userId,
      startingBalance: config.startingBalance,
      currencySymbol: config.currencySymbol,
      currencyCode: config.currencyCode,
      dailyBudgetLimit: config.dailyBudgetLimit,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Batch upload / migrate local transactions to Firestore
 */
export async function uploadLocalTransactionsToCloud(
  userId: string,
  transactions: Transaction[]
): Promise<void> {
  const path = `users/${userId}/transactions`;
  try {
    const batch = writeBatch(db);
    transactions.forEach((tx) => {
      const txRef = doc(db, 'users', userId, 'transactions', tx.id);
      batch.set(txRef, {
        id: tx.id,
        sno: tx.sno,
        date: tx.date,
        time: tx.time || '',
        title: tx.title.substring(0, 200),
        category: tx.category.substring(0, 60),
        type: tx.type,
        amount: tx.amount,
        notes: tx.notes ? tx.notes.substring(0, 500) : '',
        userId,
        createdAt: tx.createdAt || Date.now(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
