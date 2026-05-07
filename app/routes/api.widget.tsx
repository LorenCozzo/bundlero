import type { LoaderFunctionArgs } from "react-router";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };

  if (!shop) {
    return Response.json({ bundle: null }, { status: 200, headers: corsHeaders });
  }

  // Buscar bundle: primero específico por producto, fallback a ALL
  let bundle = null;

  if (productId) {
    bundle = await db.quantityBundle.findFirst({
      where: { shop, applyTo: "PRODUCT", productId, isActive: true },
      include: { tiers: { orderBy: { position: "asc" } } },
    });
  }

  if (!bundle) {
    bundle = await db.quantityBundle.findFirst({
      where: { shop, applyTo: "ALL", isActive: true },
      include: { tiers: { orderBy: { position: "asc" } } },
    });
  }

  if (!bundle) {
    return Response.json({ bundle: null }, { status: 200, headers: corsHeaders });
  }

  return Response.json(
    {
      bundle: {
        id: bundle.id,
        widgetTitle: bundle.widgetTitle,
        primaryColor: bundle.primaryColor,
        tiers: bundle.tiers.map((t) => ({
          quantity: t.quantity,
          label: t.label,
          badge: t.badge,
          discountType: t.discountType,
          discountValue: t.discountValue,
          isPopular: t.isPopular,
        })),
      },
    },
    { status: 200, headers: corsHeaders },
  );
};

// Responder OPTIONS para CORS preflight
export const action = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
};
