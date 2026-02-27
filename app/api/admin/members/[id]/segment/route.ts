import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = params.id;
  const body = await request.json();
  const { segment } = body;

  if (!["BOULIACAIS", "EXTERNE", "REDUIT"].includes(segment)) {
    return NextResponse.json({ error: "Invalid segment" }, { status: 422 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { segment },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update segment" }, { status: 500 });
  }
}
