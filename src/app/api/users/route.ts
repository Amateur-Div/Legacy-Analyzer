import { connectToDatabase } from "../../../lib/mongodb";
import User from "../../../models/User";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  const body = await req.json();

  const { uid, email, name, photoURL } = body;

  try {
    const existingUser = await User.findOne({ uid });

    if (!existingUser) {
      await User.create({ uid, email, name, photoURL });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving user : ", error);
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}
