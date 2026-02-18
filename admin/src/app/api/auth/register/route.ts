import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";
import { Role } from "@/generated/prisma";
import jwt from "jsonwebtoken";


export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 📧 Validation
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 🔍 Check if SUPERADMIN exists
    const superAdminExists = await prisma.admin.findFirst({
      where: { role: Role.SUPERADMIN },
    });

    let role: Role = Role.ADMIN;

    // 🚀 Bootstrap → only once
    if (!superAdminExists) {
      role = Role.SUPERADMIN;
    } else {
      //  If user tries to create SUPERADMIN again
      if (body.role === Role.SUPERADMIN) {
        return NextResponse.json(
          {
            error:
              "Superadmin already exists. Please login with the existing superadmin to create admins.",
          },
          { status: 409 }
        );
      }

      // 🔐 Validate token for further admin creation
      const user: any = verifyToken(req);

      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized. Please provide a valid token." },
          { status: 401 }
        );
      }

      // 🛡️ Only SUPERADMIN can create ADMIN
      if (user.role !== Role.SUPERADMIN) {
        return NextResponse.json(
          {
            error:
              "Forbidden. Only Superadmin has permission to create admin users.",
          },
          { status: 403 }
        );
      }

      role = Role.ADMIN;
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const admin = await prisma.admin.create({
      data: {
        email: body.email,
        password: hashedPassword,
        full_name: body.full_name ?? null,
        phone: body.phone ?? null,
        country: body.country ?? null,
        state: body.state ?? null,
        city: body.city ?? null,
        postal_code: body.postal_code ?? null,
        role,
      },
    });

    // 🔐 Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        message: `${role} created successfully`,
        token,
        admin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // 🛑 Prisma duplicate error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists." },
        { status: 409 }
      );
    }

    console.error("Admin creation error:", error);

    return NextResponse.json(
      {
        error:
          "Internal server error while creating admin. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = verifyToken(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const admins = await prisma.admin.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(admins, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

