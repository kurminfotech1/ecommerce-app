import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH: Update the quantity of a specific cart item
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { quantity } = body;

        if (!id) {
            return NextResponse.json({ error: "Cart item ID is required" }, { status: 400 });
        }

        if (quantity === undefined || quantity === null) {
            return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
        }

        if (quantity <= 0) {
            // If quantity is 0 or less, remove the item
            await prisma.cart.delete({
                where: { id }
            });
            return NextResponse.json({ message: "Cart item removed" }, { status: 200 });
        }

        const updatedCartItem = await prisma.cart.update({
            where: { id },
            data: { quantity }
        });

        return NextResponse.json(updatedCartItem, { status: 200 });
    } catch (error: any) {
        console.error("PATCH_CART_ITEM_ERROR", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove a specific item from the cart
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Cart item ID is required" }, { status: 400 });
        }

        await prisma.cart.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Item removed from cart" }, { status: 200 });
    } catch (error: any) {
        console.error("DELETE_CART_ITEM_ERROR", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
