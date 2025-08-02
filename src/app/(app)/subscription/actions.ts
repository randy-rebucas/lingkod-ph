
'use server'

import { redirect } from 'next/navigation';
import { type SubscriptionTier, type AgencySubscriptionTier } from './page';

export async function createPaypalOrder(plan: SubscriptionTier | AgencySubscriptionTier) {
    const successUrl = new URL('/subscription/success', process.env.NEXT_PUBLIC_BASE_URL).toString();
    
    // In a real scenario, you would create an order with the PayPal API here.
    // For this simulation, we'll just redirect to a mock checkout page.
    const checkoutUrl = new URL('/paypal/checkout', process.env.NEXT_PUBLIC_BASE_URL);
    checkoutUrl.searchParams.set('planId', plan.id);
    checkoutUrl.searchParams.set('planName', plan.name);
    checkoutUrl.searchParams.set('price', String(plan.price));
    checkoutUrl.searchParams.set('success_url', successUrl);

    redirect(checkoutUrl.toString());
}
