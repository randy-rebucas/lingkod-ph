
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from 'firebase/firestore';
import { AuditLogger } from '@/lib/audit-logger';

type Actor = {
  id: string;
  name: string | null;
}

export async function handleUpdateCategory(
  categoryId: string,
  name: string,
  actor: Actor,
) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, { name });

    await AuditLogger.getInstance().logAction(
      actor.id,
      'categories',
      'CATEGORY_UPDATED',
      { categoryId, newName: name, actorRole: 'admin' }
    );

    return {
      error: null,
      message: `Category updated to "${name}".`,
    };
  } catch (e: any) {
    console.error('Error updating category: ', e);
    return { error: e.message, message: 'Failed to update category.' };
  }
}

export async function handleAddCategory(name: string, actor: Actor) {
  if (!name) return { error: 'Category name is required.', message: 'Validation failed.' };
  try {
    const newDoc = await addDoc(collection(db, 'categories'), { name });

    await AuditLogger.getInstance().logAction(
      actor.id,
      'categories',
      'CATEGORY_CREATED',
      { categoryId: newDoc.id, name, actorRole: 'admin' }
    );

    return {
      error: null,
      message: `Category "${name}" added successfully.`,
    };
  } catch (e: any) {
    console.error('Error adding category: ', e);
    return { error: e.message, message: 'Failed to add category.' };
  }
}

export async function handleDeleteCategory(categoryId: string, actor: Actor) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);

    await AuditLogger.getInstance().logAction(
      actor.id,
      'categories',
      'CATEGORY_DELETED',
      { categoryId, actorRole: 'admin' }
    );

    return {
      error: null,
      message: 'Category has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting category: ', e);
    return { error: e.message, message: 'Failed to delete category.' };
  }
}
