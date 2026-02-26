import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Get all items in a user's cart
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const cartItems = await prisma.cart.findMany({
            where: { user_id: userId },
            include: {
                variant: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    take: 1,
                                    orderBy: { sort_order: 'asc' }
                                }
                            }
                        },
                        images: {
                            take: 1,
                            orderBy: { sort_order: 'asc' }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(cartItems, { status: 200 });
    } catch (error: any) {
        console.error("GET_CART_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Add an item to the cart or update quantity if it already exists
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, variant_id, quantity } = body;

        if (!user_id || !variant_id || !quantity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get the variant to fetch current price
        const variant = await prisma.productVariant.findUnique({
            where: { id: variant_id }
        });

        if (!variant) {
            return NextResponse.json({ error: "Product variant not found" }, { status: 404 });
        }

        // Use upsert to either create a new cart item or increment quantity of existing one
        const cartItem = await prisma.cart.upsert({
            where: {
                user_id_variant_id: {
                    user_id,
                    variant_id
                }
            },
            update: {
                quantity: {
                    increment: quantity
                }
            },
            create: {
                user_id,
                variant_id,
                quantity,
                price: variant.price
            }
        });

        return NextResponse.json(cartItem, { status: 201 });
    } catch (error: any) {
        console.error("POST_CART_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Clear user's entire cart
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await prisma.cart.deleteMany({
            where: { user_id: userId }
        });

        return NextResponse.json({ message: "Cart cleared successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("DELETE_CART_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
