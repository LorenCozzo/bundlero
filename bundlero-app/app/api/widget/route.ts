import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/widget?shop=xxx&productId=yyy
// This endpoint is called by the storefront widget (public, CORS enabled)
export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") || "";
  const productId = req.nextUrl.searchParams.get("productId") || "";

  if (!shop) {
    return corsResponse({ error: "Missing shop" }, 400);
  }

  // Try product-specific first, then global
  let bundle = null;

  if (productId) {
    bundle = await prisma.quantityBundle.findFirst({
      where: { shop, productId, isActive: true },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });
  }

  if (!bundle) {
    bundle = await prisma.quantityBundle.findFirst({
      where: { shop, isGlobal: true, isActive: true },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });
  }

  if (!bundle) {
    return corsResponse({ bundle: null }, 200);
  }

  return corsResponse({ bundle }, 200);
}

function corsResponse(data: unknown, status: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
