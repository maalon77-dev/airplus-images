import { NextRequest, NextResponse } from 'next/server';
import { stripe, handleStripeWebhook } from '@/lib/stripe';
import MySQLDatabase from '@/lib/mysql-db';

// POST /api/payments/webhook - Webhook do Stripe
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            console.error('Missing Stripe signature');
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('Missing Stripe webhook secret');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Processar evento do webhook
        await handleStripeWebhook(event);

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Erro no webhook do Stripe:', error);
        return NextResponse.json(
            { error: 'Webhook error' },
            { status: 500 }
        );
    }
}
