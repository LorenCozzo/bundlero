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
        widgetTitle:        bundle.widgetTitle,
        cornerRadius:       bundle.cornerRadius,
        spacing:            bundle.spacing,
        cardBg:             bundle.cardBg,
        selectedBg:         bundle.selectedBg,
        borderColor:        bundle.borderColor,
        titleColor:         bundle.titleColor,
        subtitleColor:      bundle.subtitleColor,
        priceColor:         bundle.priceColor,
        originalPriceColor: bundle.originalPriceColor,
        labelBg:            bundle.labelBg,
        labelTextColor:     bundle.labelTextColor,
        badgeBg:            bundle.badgeBg,
        badgeTextColor:     bundle.badgeTextColor,
        fontFamily:         bundle.fontFamily,
        timerEnabled:       bundle.timerEnabled,
        timerHours:         bundle.timerHours,
        timerText:          bundle.timerText,
        tiers: bundle.tiers.map((t) => ({
          quantity:     t.quantity,
          label:        t.label,
          subtitle:     t.subtitle,
          badge:        t.badge,
          etiqueta:     t.etiqueta,
          discountType: t.discountType,
          discountValue: t.discountValue,
          isDefault:    t.isDefault,
        })),
      },
    },
    { status: 200, headers: corsHeaders },
  );
};

export const action = async () => {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
};
