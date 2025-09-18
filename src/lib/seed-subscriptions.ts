
import { collection, addDoc, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";

const providerTiers = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        idealFor: 'New providers starting out',
        features: [
            'Basic Profile',
            'Accept Bookings',
            'Standard Commission Rate',
        ],
        badge: null,
        isFeatured: false,
        type: 'provider',
        sortOrder: 1,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 499,
        idealFor: 'Professionals ready to grow',
        features: [
            'Enhanced Profile Visibility',
            'Access to Quote Builder',
            'Access to Invoicing Tool',
            'Lower Commission Rate',
            'Basic Analytics',
        ],
        badge: 'Most Popular',
        isFeatured: true,
        type: 'provider',
        sortOrder: 2,
    },
    {
        id: 'elite',
        name: 'Elite',
        price: 999,
        idealFor: 'Top-tier providers and businesses',
        features: [
            'All Pro features',
            'Top placement in search results',
            'Advanced Analytics Suite',
            'Dedicated Support',
            'Lowest Commission Rate',
        ],
        badge: null,
        isFeatured: false,
        type: 'provider',
        sortOrder: 3,
    }
];

const agencyTiers = [
    {
        id: 'lite',
        name: 'Lite',
        price: 1999,
        idealFor: 'Small agencies starting out',
        features: [
            'Manage up to 3 Providers',
            'Agency Profile Page',
            'Centralized Booking Management',
            'Basic Performance Reports',
        ],
        badge: null,
        isFeatured: false,
        type: 'agency',
        sortOrder: 1,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 4999,
        idealFor: 'Growing agencies scaling their team',
        features: [
            'Manage up to 10 Providers',
            'All Lite features',
            'Enhanced Reporting & Analytics',
            'Branded Communications',
        ],
        badge: 'Most Popular',
        isFeatured: true,
        type: 'agency',
        sortOrder: 2,
    },
    {
        id: 'custom',
        name: 'Custom',
        price: 'Contact Us',
        idealFor: 'Large agencies with custom needs',
        features: [
            'Unlimited Providers',
            'All Pro features',
            'API Access (coming soon)',
            'Dedicated Account Manager',
            'Custom Onboarding & Training',
        ],
        badge: null,
        isFeatured: false,
        type: 'agency',
        sortOrder: 3,
    }
];

export async function seedSubscriptions() {
    const subscriptionsRef = collection(db, "subscriptions");
    let count = 0;

    const existingSubscriptionsSnapshot = await getDocs(subscriptionsRef);
    if (!existingSubscriptionsSnapshot.empty) {
        console.log("Subscriptions collection already exists. Skipping seed.");
        return 0;
    }

    const batch = writeBatch(db);
    
    providerTiers.forEach(tier => {
        const newSubRef = doc(subscriptionsRef, tier.id);
        batch.set(newSubRef, tier);
        count++;
    });

    agencyTiers.forEach(tier => {
        const newSubRef = doc(subscriptionsRef, tier.id);
        batch.set(newSubRef, tier);
        count++;
    });

    await batch.commit();
    console.log(`${count} new subscription plans added.`);
    return count;
}
