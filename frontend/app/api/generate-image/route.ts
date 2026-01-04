import { NextRequest, NextResponse } from "next/server";
import { paymentEngine } from "@/backend/x402-engine";
import type { ChainKey } from "@/shared/payment-config";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chain = (searchParams.get('chain') || 'base-sepolia') as ChainKey;
  const paymentHeader = request.headers.get('X-Payment');
  const body = await request.json();

  const prices: Record<string, string> = {
    '1K': '$0.05',
    '2K': '$0.10',
    '4K': '$0.25',
  };
  const price = prices[body.resolution] || '$0.10';

  try {
    const result = await paymentEngine.settle({
      resourceUrl: '/api/generate-image',
      method: 'POST',
      paymentHeader: paymentHeader || undefined,
      chainKey: chain,
      price,
      description: `Generate ${body.resolution} image`,
      payToAddress: process.env.SERVER_WALLET_ADDRESS!,
      category: 'image-generation',
    });

    if (result.success) {
      return NextResponse.json(
        { imageUrl: 'generated-image.png', metadata: result.metadata },
        { status: 200, headers: result.headers }
      );
    } else {
      return NextResponse.json(
        result.body || { error: 'Payment required' },
        { status: result.status, headers: result.headers }
      );
    }
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Payment failed' },
      { status: 500 }
    );
  }
}
