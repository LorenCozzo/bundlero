import { redirect } from "next/navigation";

export default function Home({ searchParams }: { searchParams: { shop?: string; host?: string } }) {
  const shop = searchParams.shop;
  if (!shop) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Bundlero Quantity Breaks</h1>
          <p style={{ color: "#64748b" }}>Install this app from the Shopify App Store</p>
        </div>
      </div>
    );
  }
  redirect(`/dashboard?shop=${shop}&host=${searchParams.host || ""}`);
}
