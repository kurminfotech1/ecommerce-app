import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ GET addresses
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId required" },
      { status: 400 }
    );
  }

  const addresses = await prisma.address.findMany({
    where: { userId },
  });

  return NextResponse.json(addresses);
}

// ✅ CREATE address
export async function POST(req: Request) {
  const body = await req.json();

  const address = await prisma.address.create({
    data: body,
  });

  return NextResponse.json(
    { message: "Address created successfully", address },
    { status: 201 }
  );
}

// ✅ UPDATE address
export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Address id required" },
      { status: 400 }
    );
  }

  const address = await prisma.address.update({
    where: { id: body.id },
    data: {
      full_name: body.full_name,
      phone: body.phone,
      line1: body.line1,
      line2: body.line2,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country,
    },
  });

  return NextResponse.json(
    { message: "Address updated successfully", address },
    { status: 200 }
  );
}
