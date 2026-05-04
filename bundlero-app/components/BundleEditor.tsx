"use client";
import { useState } from "react";
import { Bundle, Tier } from "@/types";

interface Props {
  bundle?: Bundle | null;
  onSave: (data: Partial<Bundle>) => void;
  onCancel: () => void;
}

const DEFAULT_TIERS: Tier[] = [
  { quantity: 1, label: "1 item", badge: "", discountType: "percentage", discountValue: 0, isPopular: false, sortOrder: 0 },
  { quantity: 2, label: "2 items", badge: "Save 10%", discountType: "percentage", discountValue: 10, isPopular: false, sortOrder: 1 },
  { quantity: 3, label: "3 items", badge: "Best value", discountType: "percentage", discountValue: 20, isPopular: true, sortOrder: 2 },
];

export default function BundleEditor({ bundle, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(bundle?.title || "Choose your pack");
  const [isGlobal, setIsGlobal] = useState(bundle?.isGlobal ?? true);
  const [productId, setProductId] = useState(bundle?.productId || "");
  const [tiers, setTiers] = useState<Tier[]>(bundle?.tiers || DEFAULT_TIERS);
  const [previewPrice, setPreviewPrice] = useState(2999); // 29.99 in cents

  const updateTier = (i: number, field: keyof Tier, value: unknown) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const addTier = () => {
    const nextQty = Math.max(...tiers.map(t => t.quantity), 0) + 1;
    setTiers(prev => [...prev, {
      quantity: nextQty,
      label: `${nextQty} items`,
      badge: "",
      discountType: "percentage",
      discountValue: 0,
      isPopular: false,
      sortOrder: prev.length,
    }]);
  };

  const removeTier = (i: number) => {
    if (tiers.length <= 1) return;
    setTiers(prev => prev.filter((_, idx) => idx !== i));
  };

  const setPopular = (i: number) => {
    setTiers(prev => prev.map((t, idx) => ({ ...t, isPopular: idx === i })));
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const calcTierPrice = (tier: Tier) => {
    const base = previewPrice * tier.quantity;
    if (!tier.discountValue) return base;
    if (tier.discountType === "percentage") return base * (1 - tier.discountValue / 100);
    return Math.max(0, base - tier.discountValue * 100);
  };

  const handleSubmit = () => {
    onSave({
      title,
      isGlobal,
      productId: isGlobal ? undefined : productId,
      isActive: true,
      tiers: tiers.map((t, i) => ({ ...t, sortOrder: i })),
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 20, padding: 4 }}>←</button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            {bundle ? "Edit Bundle" : "Create Bundle"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Save Bundle
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, padding: 32, maxWidth: 1200, margin: "0 auto" }}>
        {/* Left: Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* General settings */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>General Settings</h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelStyle}>Widget Title</label>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Choose your pack" />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>Shown above the tier options in your store</p>
              </div>
              <div>
                <label style={labelStyle}>Apply to</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {[{ val: true, label: "All products (Global)" }, { val: false, label: "Specific product" }].map(opt => (
                    <div
                      key={String(opt.val)}
                      onClick={() => setIsGlobal(opt.val)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: `2px solid ${isGlobal === opt.val ? "#667eea" : "#e2e8f0"}`,
                        cursor: "pointer",
                        background: isGlobal === opt.val ? "#eff6ff" : "#fff",
                        fontSize: 14,
                        fontWeight: 500,
                        color: isGlobal === opt.val ? "#4338ca" : "#475569",
                        transition: "all 0.15s",
                      }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
              {!isGlobal && (
                <div>
                  <label style={labelStyle}>Product ID</label>
                  <input style={inputStyle} value={productId} onChange={e => setProductId(e.target.value)} placeholder="gid://shopify/Product/1234567890" />
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>Shopify Product GID or numeric ID</p>
                </div>
              )}
            </div>
          </div>

          {/* Tiers editor */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Offer Tiers</h2>
              <button
                onClick={addTier}
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                + Add Tier
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tiers.map((tier, i) => (
                <div key={i} style={{ border: `2px solid ${tier.isPopular ? "#fde68a" : "#e2e8f0"}`, borderRadius: 10, padding: 16, background: tier.isPopular ? "#fffbeb" : "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Tier {i + 1}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setPopular(i)}
                        title="Mark as popular"
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                          border: `1px solid ${tier.isPopular ? "#f59e0b" : "#e2e8f0"}`,
                          background: tier.isPopular ? "#fef3c7" : "#fff",
                          color: tier.isPopular ? "#d97706" : "#94a3b8",
                        }}
                      >
                        {tier.isPopular ? "⭐ Popular" : "Set as popular"}
                      </button>
                      {tiers.length > 1 && (
                        <button onClick={() => removeTier(i)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 12, cursor: "pointer" }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Quantity</label>
                      <input
                        style={inputStyle}
                        type="number"
                        min={1}
                        value={tier.quantity}
                        onChange={e => updateTier(i, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Label text</label>
                      <input
                        style={inputStyle}
                        value={tier.label}
                        onChange={e => updateTier(i, "label", e.target.value)}
                        placeholder="e.g. Buy 2 — Share one!"
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Badge (optional)</label>
                      <input
                        style={inputStyle}
                        value={tier.badge || ""}
                        onChange={e => updateTier(i, "badge", e.target.value)}
                        placeholder="e.g. Save 20%"
                      />
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Discount type</label>
                      <select
                        style={inputStyle}
                        value={tier.discountType}
                        onChange={e => updateTier(i, "discountType", e.target.value)}
                      >
                        <option value="percentage">Percentage %</option>
                        <option value="fixed">Fixed $ amount</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ ...labelStyle, fontSize: 12 }}>
                        Discount value {tier.discountType === "percentage" ? "(%)" : "($)"}
                      </label>
                      <input
                        style={inputStyle}
                        type="number"
                        min={0}
                        value={tier.discountValue}
                        onChange={e => updateTier(i, "discountValue", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ position: "sticky", top: 24, height: "fit-content" }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Live Preview</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Price: $</span>
                <input
                  type="number"
                  value={previewPrice / 100}
                  onChange={e => setPreviewPrice(Math.round(parseFloat(e.target.value || "0") * 100))}
                  style={{ width: 70, border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}
                />
              </div>
            </div>

            {/* Widget Preview */}
            <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 16px 10px", borderBottom: "1px solid #f3f4f6" }}>
                {title}
              </div>
              {tiers.map((tier, i) => {
                const totalPrice = calcTierPrice(tier);
                const fullPrice = previewPrice * tier.quantity;
                const hasDiscount = tier.discountValue > 0;
                const isFirst = i === 0;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: i < tiers.length - 1 ? "1px solid #f3f4f6" : "none",
                      background: isFirst ? "#eff6ff" : "#fff",
                      borderLeft: isFirst ? "3px solid #2563eb" : "none",
                      gap: 10,
                      position: "relative",
                    }}
                  >
                    {tier.isPopular && (
                      <span style={{ position: "absolute", top: 0, right: 16, fontSize: 9, fontWeight: 700, color: "#fff", background: "#f59e0b", padding: "2px 8px", borderRadius: "0 0 6px 6px", textTransform: "uppercase" }}>
                        Most Popular
                      </span>
                    )}
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${isFirst ? "#2563eb" : "#d1d5db"}`, background: isFirst ? "#2563eb" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isFirst && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", minWidth: 20 }}>{tier.quantity}x</span>
                    <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{tier.label}</span>
                    {tier.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: tier.isPopular ? "#fef3c7" : "#dcfce7", color: tier.isPopular ? "#d97706" : "#16a34a" }}>
                        {tier.badge}
                      </span>
                    )}
                    <div style={{ textAlign: "right" }}>
                      {hasDiscount && <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>{formatPrice(fullPrice)}</div>}
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{formatPrice(totalPrice)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ margin: "12px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
              Widget appears on product pages above Add to Cart
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
