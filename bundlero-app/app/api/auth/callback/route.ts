import { NextRequest, NextResponse } from "next/server";
import { shopify } from "@/lib/shopify";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    const { session } = callbackResponse;

    // Save session to DB
    await prisma.session.upsert({
      where: { id: session.id },
      update: {
        accessToken: session.accessToken,
        scope: session.scope,
        expires: session.expires,
      },
      create: {
        id: session.id,
        shop: session.shop,
        state: session.state || "",
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken,
        userId: session.onlineAccessInfo?.associated_user?.id
          ? BigInt(session.onlineAccessInfo.associated_user.id)
          : null,
      },
    });

    // Register webhook: app/uninstalled
    await shopify.webhooks.register({ session });

    const shop = session.shop;
    const host = req.nextUrl.searchParams.get("host");
    return NextResponse.redirect(
      `${process.env.APP_URL}/?shop=${shop}&host=${host}`
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
