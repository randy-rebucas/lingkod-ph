
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from 'firebase/firestore';
import { logAdminAction } from '@/lib/audit-logger';
import { auth } from '@/lib/firebase';

async function getActor() {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    return {
        id: currentUser.uid,
        name: currentUser.displayName,
        role: 'admin'
    };
}

export async function handleUpdateCategory(
  categoryId: string,
  name: string
) {
  try {
    const actor = await getActor();
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, { name });

    await logAdminAction({
        actor,
        action: 'CATEGORY_UPDATED',
        details: { categoryId, newName: name }
    });

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
        const actor = await getActor();
        const newDoc = await addDoc(collection(db, 'categories'), { name });
        
        await logAdminAction({
            actor,
            action: 'CATEGORY_CREATED',
            details: { categoryId: newDoc.id, name }
        });

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
    const actor = await getActor();
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);

     await logAdminAction({
        actor,
        action: 'CATEGORY_DELETED',
        details: { categoryId }
    });

    return {
      error: null,
      message: 'Category has been deleted successfully.',
    };
  } catch (e: any) {
    console.error('Error deleting category: ', e);
    return { error: e.message, message: 'Failed to delete category.' };
  }
}
