import { NextRequest, NextResponse } from "next/server";
import { processTelegramQueue, scoutAdminAuthorized } from "../../../../lib/scout";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const cronSecret = process.env.SCOUT_DELIVERY_CRON_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return scoutAdminAuthorized(request) || Boolean(cronSecret && bearer === cronSecret);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await processTelegramQueue(40));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delivery processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = POST;
