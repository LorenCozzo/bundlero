import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { shopify } from "@/lib/shopify";
import { DataType } from "@shopify/shopify-api";

export async function POST(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") || "";
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const session = await prisma.session.findFirst({ where: { shop } });
  if (!session) return NextResponse.json({ error: "Shop not authenticated" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = new shopify.clients.Rest({ session: session as any });

  const existing = await client.get({ path: "script_tags" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = (existing.body as any).script_tags as Array<{ src: string; id: number }>;
  const widgetUrl = `${process.env.APP_URL}/widget.js`;

  if (tags.some((t) => t.src === widgetUrl)) {
    return NextResponse.json({ success: true, message: "Already installed" });
  }

  await client.post({
    path: "script_tags",
    data: { script_tag: { event: "onload", src: widgetUrl, display_scope: "online_store" } },
    type: DataType.JSON,
  });

  return NextResponse.json({ success: true, message: "Widget script tag registered" });
}
