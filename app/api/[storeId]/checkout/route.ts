import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request, { params }: { params: { storeId: string } }) {
  const { productIds, deliveryCost } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  if (typeof deliveryCost !== 'number' || deliveryCost < 0) {
    return new NextResponse("Invalid delivery cost", { status: 400 });
  }

  // Aggregate product quantities
  const productQuantityMap = productIds.reduce((acc: Record<string, number>, productId: string) => {
    acc[productId] = (acc[productId] || 0) + 1;
    return acc;
  }, {});

  const productIdsUnique = Object.keys(productQuantityMap);
  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIdsUnique,
      },
    },
  });

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = products.map((product) => ({
    quantity: productQuantityMap[product.id],
    price_data: {
      currency: 'USD',
      product_data: {
        name: product.name,
      },
      unit_amount: Math.round(product.price.toNumber() * 100), // Ensure product.price is already in USD
    },
  }));

  // Adding delivery cost to line_items
  line_items.push({
    quantity: 1,
    price_data: {
      currency: 'USD',
      product_data: {
        name: "Delivery Fee",
      },
      unit_amount: deliveryCost * 100, // Convert delivery cost to cents
    },
  });

  // Creating an order with orderItems that include quantity
  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: products.map((product) => ({
          productId: product.id,
          quantity: productQuantityMap[product.id],
        })),
      },
    },
  });

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: 'payment',
    billing_address_collection: 'required',
    phone_number_collection: {
      enabled: true,
    },
    automatic_tax: {
      enabled: true,
    },
    success_url: `${process.env.FRONTEND_STORE_URL}/payment-completed`,
    cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
    metadata: {
      orderId: order.id,
    },
  });

  return NextResponse.json({ url: session.url }, {
    headers: corsHeaders,
  });
};
