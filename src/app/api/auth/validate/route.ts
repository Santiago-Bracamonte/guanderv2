import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    // Validate JWT
    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: string;
      iat: number;
      exp: number;
    };

    return NextResponse.json({ valid: true, decoded });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token", valid: false },
      { status: 401 },
    );
  }
}
