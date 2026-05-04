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

const BundleUpdateSchema = z.object({
  productId: z.string().optional(),
  isGlobal: z.boolean().optional(),
  title: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  tiers: z.array(TierSchema).min(1).optional(),
});

// PUT /api/bundles/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = BundleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { tiers, ...bundleData } = parsed.data;

  const bundle = await prisma.quantityBundle.update({
    where: { id },
    data: {
      ...bundleData,
      ...(tiers && {
        tiers: {
          deleteMany: {},
          create: tiers,
        },
      }),
    },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(bundle);
}

// DELETE /api/bundles/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.quantityBundle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
