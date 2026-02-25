import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ GET addresses
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to fetch addresses" },
        { status: 400 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
    });

    if (!addresses || addresses.length === 0) {
      return NextResponse.json(
        {
          message: "No addresses found",
          addresses: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Addresses fetched successfully",
        addresses,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET address error:", error);

    return NextResponse.json(
      { error: "Failed to fetch addresses. Please try again later." },
      { status: 500 }
    );
  }
}



export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      line1,
      line2,
      city,
      state,
      pincode,
      country,
    } = body;

    // ✅ Validation
    if (
      !userId ||
      !line1 ||
      !city ||
      !state ||
      !pincode ||
      !country
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // 🔍 Check if address already exists for this user
    const existingAddress = await prisma.address.findFirst({
      where: { userId },
    });

    let address;

    if (existingAddress) {
      // ✅ UPDATE
      address = await prisma.address.update({
        where: { id: existingAddress.id },
        data: {
          line1,
          line2,
          city,
          state,
          pincode,
          country,
        },
      });

      return NextResponse.json(
        { message: "Address updated successfully", address },
        { status: 200 }
      );
    } else {
      // ✅ CREATE
      address = await prisma.address.create({
        data: {
          userId,
          line1,
          line2,
          city,
          state,
          pincode,
          country,
        },
      });

      return NextResponse.json(
        { message: "Address created successfully", address },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("PATCH address error:", error);

    return NextResponse.json(
      { error: "Failed to process address" },
      { status: 500 }
    );
  }
}