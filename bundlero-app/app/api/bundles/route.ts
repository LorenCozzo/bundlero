import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const TierSchema = z.object({
  quantity: z.number().int().positive(),
  label: z.string().min(1),
  badge: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const BundleSchema = z.object({
  productId: z.string().optional(),
  isGlobal: z.boolean().default(false),
  title: z.string().min(1),
  isActive: z.boolean().default(true),
  tiers: z.array(TierSchema).min(1),
});

function getShopFromRequest(req: NextRequest): string {
  return req.headers.get("x-shop") || req.nextUrl.searchParams.get("shop") || "";
}

// GET /api/bundles?shop=xxx
export async function GET(req: NextRequest) {
  const shop = getShopFromRequest(req);
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const bundles = await prisma.quantityBundle.findMany({
    where: { shop },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bundles);
}

// POST /api/bundles
export async function POST(req: NextRequest) {
  const shop = getShopFromRequest(req);
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const body = await req.json();
  const parsed = BundleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tiers, ...bundleData } = parsed.data;

  const bundle = await prisma.quantityBundle.create({
    data: {
      ...bundleData,
      shop,
      tiers: {
        create: tiers,
      },
    },
    include: { tiers: true },
  });

  return NextResponse.json(bundle, { status: 201 });
}
