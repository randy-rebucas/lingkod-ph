#!/usr/bin/env tsx

/**
 * Fix Favorites Type Field Script
 * Updates existing favorites to include the type field for backward compatibility
 */

import { getDb } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

async function fixFavoritesTypeField() {
  console.log('🔧 Fixing favorites type field...\n');

  if (!getDb()) {
    console.warn('Firebase not initialized, skipping favorites fix');
    return;
  }

  try {
    const favoritesRef = collection(getDb(), 'favorites');
    const favoritesSnapshot = await getDocs(favoritesRef);
    
    const batch = writeBatch(getDb());
    let updatedCount = 0;

    favoritesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // If type field is missing, determine it based on the data
      if (!data.type) {
        if (data.providerId && !data.agencyId) {
          batch.update(doc.ref, { type: 'provider' });
          updatedCount++;
        } else if (data.agencyId && !data.providerId) {
          batch.update(doc.ref, { type: 'agency' });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updatedCount} favorites with type field`);
    } else {
      console.log('✅ All favorites already have the type field');
    }
    
    return updatedCount;
  } catch (error) {
    console.error('❌ Error fixing favorites type field:', error);
    throw error;
  }
}

// Run the fix
fixFavoritesTypeField()
  .then(count => {
    console.log(`\n🎉 Favorites fix completed! Updated ${count} records.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Favorites fix failed:', error);
    process.exit(1);
  });
