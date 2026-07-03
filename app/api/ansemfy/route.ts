import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "placeholder",
      message: "ANSEMFY image generation endpoint is ready for future AI integration.",
      output: null
    },
    { status: 202 }
  );
}
