"use client";
import { Bundle } from "@/types";

interface Props {
  bundles: Bundle[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (b: Bundle) => void;
  onDelete: (id: string) => void;
  onToggle: (b: Bundle) => void;
}

export default function BundleList({ bundles, loading, onCreate, onEdit, onDelete, onToggle }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18 }}>💰</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Quantity Breaks</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Boost your AOV with volume discounts</p>
          </div>
        </div>
        <button
          onClick={onCreate}
          style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          + Create Bundle
        </button>
      </div>

      <div style={{ padding: "32px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>Loading bundles...</div>
        ) : bundles.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {bundles.map(bundle => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                onEdit={() => onEdit(bundle)}
                onDelete={() => onDelete(bundle.id)}
                onToggle={() => onToggle(bundle)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BundleCard({ bundle, onEdit, onDelete, onToggle }: { bundle: Bundle; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
    }}>
      {/* Toggle */}
      <div
        onClick={onToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: bundle.isActive ? "#667eea" : "#cbd5e1",
          cursor: "pointer",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <div style={{
          position: "absolute",
          top: 2,
          left: bundle.isActive ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{bundle.title}</span>
          {bundle.isGlobal && (
            <span style={{ fontSize: 11, background: "#dbeafe", color: "#2563eb", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Global</span>
          )}
          {bundle.productId && (
            <span style={{ fontSize: 11, background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Product-specific</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {bundle.tiers.map((tier, i) => (
            <span key={i} style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 10px" }}>
              {tier.quantity}x — {tier.discountValue > 0 ? `${tier.discountValue}${tier.discountType === "percentage" ? "%" : "$"} off` : "No discount"}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onEdit}
          style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Edit
        </button>
        <button
          onClick={() => { if (confirm("Delete this bundle?")) onDelete(); }}
          style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", background: "#fff", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>No bundles yet</h2>
      <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>Create your first quantity break to start boosting your AOV</p>
      <button
        onClick={onCreate}
        style={{
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Create your first bundle
      </button>
    </div>
  );
}
