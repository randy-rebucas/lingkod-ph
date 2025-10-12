import { NextRequest, NextResponse } from 'next/server';
import { updateUserSubscription } from '@/app/(app)/subscription/actions';
import { z } from 'zod';

const UpdateSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1, 'Plan name is required'),
  price: z.number().min(0, 'Price must be positive'),
  period: z.string().min(1, 'Period is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UpdateSubscriptionSchema.parse(body);

    // Update user subscription in database
    const result = await updateUserSubscription(validatedData.userId, {
      planId: validatedData.planId,
      planName: validatedData.planName,
      price: validatedData.price,
      period: validatedData.period,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update subscription' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
