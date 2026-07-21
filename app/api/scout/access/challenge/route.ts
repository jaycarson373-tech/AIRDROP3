import { NextRequest, NextResponse } from "next/server";
import { createAccessChallenge } from "../../../../../lib/scout";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { wallet } = (await request.json()) as { wallet?: string };
    if (!wallet) return NextResponse.json({ error: "wallet is required" }, { status: 400 });
    return NextResponse.json(await createAccessChallenge(wallet));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Challenge failed" }, { status: 400 });
  }
}
