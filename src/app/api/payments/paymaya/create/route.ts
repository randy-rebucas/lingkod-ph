import { NextRequest, NextResponse } from 'next/server';
import { paymayaPaymentService } from '@/lib/paymaya-payment-service';
import { z } from 'zod';

const CreatePaymentSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1, 'Plan name is required'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('PHP'),
  userId: z.string().min(1, 'User ID is required'),
  userEmail: z.string().email('Valid email is required'),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if PayMaya is configured
    if (!process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY || !process.env.PAYMAYA_SECRET_KEY) {
      console.error('PayMaya not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const body = await request.json();
    const validatedData = CreatePaymentSchema.parse(body);

    // Create PayMaya payment
    const returnUrl = `${request.nextUrl.origin}/subscription/success?plan=${validatedData.planId}&payment=paymaya`;
    const cancelUrl = `${request.nextUrl.origin}/subscription?cancelled=true`;

    const paymentResult = await paymayaPaymentService.createPayment({
      amount: validatedData.price,
      currency: validatedData.currency,
      userId: validatedData.userId,
      userEmail: validatedData.userEmail,
      planId: validatedData.planId,
      planName: validatedData.planName,
      returnUrl,
      cancelUrl,
      description: validatedData.description,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Failed to create payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentResult.paymentId,
      checkoutUrl: paymentResult.checkoutUrl,
      qrCode: paymentResult.qrCode,
    });
  } catch (error) {
    console.error('Error creating PayMaya payment:', error);
    
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
