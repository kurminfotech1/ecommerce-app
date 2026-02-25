import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
    
        if (!id) {
          return NextResponse.json(
            { error: "User id required" },
            { status: 400 }
          );
        }
    
        const user = await prisma.user.findUnique({
          where: { id },
        });
    
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
    
        return NextResponse.json(user, { status: 200 });
      } catch (error) {
        console.error("GET user error:", error);
    
        return NextResponse.json(
          { error: "Failed to fetch user. Please try again later." },
          { status: 500 }
        );
      }
}