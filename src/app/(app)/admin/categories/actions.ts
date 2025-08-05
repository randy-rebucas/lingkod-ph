
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from 'firebase/firestore';

export async function handleUpdateCategory(
  categoryId: string,
  name: string
) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, { name });

    return {
      error: null,
      message: `Category updated to "${name}".`,
    };
  } catch (e: any) {
    console.error('Error updating category: ', e);
    return { error: e.message, message: 'Failed to update category.' };
  }
}

export async function handleAddCategory(name: string) {
    if (!name) return { error: 'Category name is required.', message: 'Validation failed.' };
    try {
        await addDoc(collection(db, 'categories'), { name });
        return {
            error: null,
            message: `Category "${name}" added successfully.`,
        };
    } catch (e: any) {
        console.error('Error adding category: ', e);
        return { error: e.message, message: 'Failed to add category.' };
    }
}

export async function handleDeleteCategory(categoryId: string) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
    return {
      error: null,
      message: 'Category has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting category: ', e);
    return { error: e.message, message: 'Failed to delete category.' };
  }
}
