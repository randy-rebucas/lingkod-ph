
import { collection, addDoc, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";

const rewards = [
    { 
        title: "₱50 Discount",
        description: "Get a ₱50 discount on your next booking.",
        pointsRequired: 500,
        isActive: true,
        type: 'discount',
        value: 50
    },
    { 
        title: "₱100 Discount",
        description: "Get a ₱100 discount on your next booking.",
        pointsRequired: 950,
        isActive: true,
        type: 'discount',
        value: 100
    },
    { 
        title: "Free Basic Cleaning Service",
        description: "Redeem for a free basic cleaning service (up to ₱500 value).",
        pointsRequired: 4500,
        isActive: true,
        type: 'free_service',
        value: 500
    },
    { 
        title: "10% Off Any Service",
        description: "Get 10% off any single service booking.",
        pointsRequired: 1500,
        isActive: true,
        type: 'percentage_discount',
        value: 10
    },
];

export async function seedRewards() {
    const rewardsRef = collection(db, "loyaltyRewards");
    let count = 0;

    const existingRewardsSnapshot = await getDocs(rewardsRef);
    const existingRewardTitles = new Set(existingRewardsSnapshot.docs.map(doc => doc.data().title));

    const batch = writeBatch(db);

    rewards.forEach(reward => {
        if (!existingRewardTitles.has(reward.title)) {
            const newRewardRef = doc(rewardsRef);
            batch.set(newRewardRef, { ...reward, createdAt: new Date() });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`${count} new rewards added.`);
    } else {
        console.log("No new rewards to add.");
    }
    
    return count;
}
