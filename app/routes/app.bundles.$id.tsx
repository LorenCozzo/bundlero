import { useState, useEffect } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";

type TierState = {
  quantity: number;
  label: string;
  badge: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isPopular: boolean;
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const bundle = await db.quantityBundle.findFirst({
    where: { id: params.id, shop: session.shop },
    include: { tiers: { orderBy: { position: "asc" } } },
  });
  if (!bundle) throw new Response("Not found", { status: 404 });
  return { bundle };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  const existing = await db.quantityBundle.findFirst({
    where: { id: params.id!, shop: session.shop },
    select: { id: true },
  });
  if (!existing) throw new Response("Not found", { status: 404 });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const applyTo = formData.get("applyTo") as string;
  const productId = (formData.get("productId") as string) || null;
  const widgetTitle = formData.get("widgetTitle") as string;
  const primaryColor = formData.get("primaryColor") as string;
  const combinesWithProductDiscounts =
    formData.get("combinesWithProductDiscounts") === "true";
  const tiersData: TierState[] = JSON.parse(formData.get("tiers") as string);

  await db.quantityBundle.update({
    where: { id: params.id! },
    data: {
      name,
      applyTo,
      productId: applyTo === "PRODUCT" ? productId : null,
      widgetTitle,
      primaryColor,
      combinesWithProductDiscounts,
    },
  });

  await db.tier.deleteMany({ where: { bundleId: params.id! } });

  if (tiersData.length > 0) {
    await db.tier.createMany({
      data: tiersData.map((t, i) => ({
        bundleId: params.id!,
        quantity: Number(t.quantity),
        label: t.label,
        badge: t.badge || null,
        discountType: t.discountType,
        discountValue: Number(t.discountValue),
        isPopular: Boolean(t.isPopular),
        position: i,
      })),
    });
  }

  if (applyTo === "PRODUCT" && productId) {
    await admin.graphql(
      `#graphql
      mutation SetProductMetafield($input: ProductInput!) {
        productUpdate(input: $input) {
          userErrors { field message }
        }
      }`,
      {
        variables: {
          input: {
            id: productId,
            metafields: [
              {
                namespace: "quantity_breaks",
                key: "config",
                value: JSON.stringify(
                  tiersData.map((t, i) => ({
                    quantity: Number(t.quantity),
                    discountType: t.discountType,
                    discountValue: Number(t.discountValue),
                    position: i,
                  })),
                ),
                type: "json",
              },
            ],
          },
        },
      },
    );
  }

  return { ok: true };
};

// ——— Widget Preview ———

function WidgetPreview({
  tiers,
  title,
  primaryColor,
}: {
  tiers: TierState[];
  title: string;
  primaryColor: string;
}) {
  const [selected, setSelected] = useState(0);

  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
        fontFamily: "inherit",
      }}
    >
      <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 12px" }}>
        {title || "Choose a bundle & save!"}
      </p>

      {tiers.length === 0 && (
        <p style={{ color: "#8c9196", fontSize: 13, margin: 0 }}>
          Add tiers to see the preview
        </p>
      )}

      {tiers.map((tier, i) => (
        <div
          key={i}
          onClick={() => setSelected(i)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `2px solid ${i === selected ? primaryColor : "#e1e3e5"}`,
            borderRadius: 6,
            padding: "10px 12px",
            marginBottom: 8,
            cursor: "pointer",
            background: i === selected ? `${primaryColor}18` : "#fff",
          }}
        >
          <input type="radio" readOnly checked={i === selected} style={{ margin: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 13, minWidth: 28 }}>
            {tier.quantity}x
          </span>
          <span style={{ flex: 1, fontSize: 13 }}>
            {tier.label || `Buy ${tier.quantity}`}
          </span>
          {tier.badge && (
            <span
              style={{
                background: primaryColor,
                color: "#fff",
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {tier.badge}
            </span>
          )}
          {tier.isPopular && (
            <span style={{ fontSize: 11, color: primaryColor, fontWeight: 700 }}>
              ★ Popular
            </span>
          )}
          {tier.discountValue > 0 && (
            <span style={{ fontSize: 12, color: "#2a9d8f", fontWeight: 600 }}>
              {tier.discountType === "PERCENTAGE"
                ? `Save ${tier.discountValue}%`
                : `-$${tier.discountValue}`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ——— Shared input styles ———

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #c9cccf",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
  background: "#fff",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  color: "#202223",
};

// ——— Main Editor ———

export default function BundleEditor() {
  const { bundle } = useLoaderData<typeof loader>();
  const saveFetcher = useFetcher<{ ok: boolean }>();
  const navigate = useNavigate();

  const [name, setName] = useState(bundle.name);
  const [applyTo, setApplyTo] = useState(bundle.applyTo);
  const [productId, setProductId] = useState(bundle.productId ?? "");
  const [productTitle, setProductTitle] = useState("");
  const [widgetTitle, setWidgetTitle] = useState(bundle.widgetTitle);
  const [primaryColor, setPrimaryColor] = useState(bundle.primaryColor);
  const [combinesWithProductDiscounts, setCombinesWithProductDiscounts] =
    useState(bundle.combinesWithProductDiscounts);
  const [tiers, setTiers] = useState<TierState[]>(
    bundle.tiers.map((t) => ({
      quantity: t.quantity,
      label: t.label,
      badge: t.badge ?? "",
      discountType: t.discountType as "PERCENTAGE" | "FIXED",
      discountValue: t.discountValue,
      isPopular: t.isPopular,
    })),
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (saveFetcher.data?.ok) {
      setSavedAt(Date.now());
      const t = setTimeout(() => navigate("/app"), 1500);
      return () => clearTimeout(t);
    }
  }, [saveFetcher.data, navigate]);

  const handleSave = () => {
    saveFetcher.submit(
      {
        name,
        applyTo,
        productId,
        widgetTitle,
        primaryColor,
        combinesWithProductDiscounts: String(combinesWithProductDiscounts),
        tiers: JSON.stringify(tiers),
      },
      { method: "post" },
    );
  };

  const openResourcePicker = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (window as any).shopify?.resourcePicker({
      type: "product",
      action: "select",
      multiple: false,
    });
    if (result?.selection?.length > 0) {
      setProductId(result.selection[0].id);
      setProductTitle(result.selection[0].title);
    }
  };

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        quantity: (prev[prev.length - 1]?.quantity ?? 0) + 1,
        label: "",
        badge: "",
        discountType: "PERCENTAGE",
        discountValue: 0,
        isPopular: false,
      },
    ]);
  };

  const removeTier = (i: number) =>
    setTiers((prev) => prev.filter((_, idx) => idx !== i));

  const updateTier = (
    i: number,
    field: keyof TierState,
    value: string | number | boolean,
  ) =>
    setTiers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    );

  const isSaving = saveFetcher.state !== "idle";

  return (
    <s-page heading={name || "New bundle"}>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleSave}
        {...(isSaving ? { loading: true } : {})}
      >
        {savedAt ? "✓ Saved" : "Save"}
      </s-button>

      {/* Bundle settings */}
      <s-section heading="Bundle settings">
        <s-stack direction="block" gap="base">
          <div>
            <label style={labelStyle}>Bundle name</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Buy 2 Save 10%"
            />
          </div>

          <div>
            <label style={labelStyle}>Apply to</label>
            <select
              style={{ ...inputStyle, height: 36 }}
              value={applyTo}
              onChange={(e) => setApplyTo(e.target.value)}
            >
              <option value="ALL">All products</option>
              <option value="PRODUCT">Specific product</option>
            </select>
          </div>

          {applyTo === "PRODUCT" && (
            <div>
              <label style={labelStyle}>Product</label>
              <s-stack direction="inline" gap="tight" align="center">
                <s-button
                  variant="secondary"
                  size="small"
                  onClick={openResourcePicker}
                >
                  {productId ? "Change product" : "Select product"}
                </s-button>
                {(productTitle || productId) && (
                  <s-text tone="neutral">{productTitle || productId}</s-text>
                )}
              </s-stack>
            </div>
          )}

          <div>
            <label
              style={{
                ...labelStyle,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={combinesWithProductDiscounts}
                onChange={(e) =>
                  setCombinesWithProductDiscounts(e.target.checked)
                }
              />
              Combine with other product discounts
            </label>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6d7175" }}>
              Always combines with order and shipping discounts.
            </p>
          </div>
        </s-stack>
      </s-section>

      {/* Tiers */}
      <s-section heading="Quantity tiers">
        <s-stack direction="block" gap="base">
          {tiers.length === 0 && (
            <s-text tone="neutral">No tiers yet — add one below.</s-text>
          )}

          {tiers.map((tier, i) => (
            <s-box key={i} padding="base" border-width="base" border-radius="base">
              <s-stack direction="block" gap="tight">
                <s-stack direction="inline" gap="base" align="center">
                  <s-text emphasis="bold">Tier {i + 1}</s-text>
                  {tier.isPopular && <s-badge tone="success">Popular</s-badge>}
                  <s-button
                    variant="secondary"
                    size="small"
                    tone="critical"
                    onClick={() => removeTier(i)}
                  >
                    Remove
                  </s-button>
                </s-stack>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Qty</label>
                    <input
                      style={inputStyle}
                      type="number"
                      min={1}
                      value={tier.quantity}
                      onChange={(e) =>
                        updateTier(i, "quantity", Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      style={inputStyle}
                      value={tier.label}
                      onChange={(e) => updateTier(i, "label", e.target.value)}
                      placeholder="e.g. Best value"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Badge</label>
                    <input
                      style={inputStyle}
                      value={tier.badge}
                      onChange={(e) => updateTier(i, "badge", e.target.value)}
                      placeholder="e.g. Save 20%"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 8,
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Discount type</label>
                    <select
                      style={{ ...inputStyle, height: 36 }}
                      value={tier.discountType}
                      onChange={(e) =>
                        updateTier(i, "discountType", e.target.value)
                      }
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed ($)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Value ({tier.discountType === "PERCENTAGE" ? "%" : "$"})
                    </label>
                    <input
                      style={inputStyle}
                      type="number"
                      min={0}
                      step={tier.discountType === "PERCENTAGE" ? 1 : 0.01}
                      value={tier.discountValue}
                      onChange={(e) =>
                        updateTier(i, "discountValue", Number(e.target.value))
                      }
                    />
                  </div>
                  <div style={{ paddingBottom: 2 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={tier.isPopular}
                        onChange={(e) =>
                          updateTier(i, "isPopular", e.target.checked)
                        }
                      />
                      Popular
                    </label>
                  </div>
                </div>
              </s-stack>
            </s-box>
          ))}

          <s-button variant="secondary" onClick={addTier}>
            + Add tier
          </s-button>
        </s-stack>
      </s-section>

      {/* Widget customization */}
      <s-section heading="Widget customization">
        <s-stack direction="block" gap="base">
          <div>
            <label style={labelStyle}>Widget title</label>
            <input
              style={inputStyle}
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              placeholder="Choose a bundle & save!"
            />
          </div>
          <div>
            <label style={labelStyle}>Primary color</label>
            <s-stack direction="inline" gap="tight" align="center">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{
                  width: 40,
                  height: 36,
                  padding: 2,
                  border: "1px solid #c9cccf",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "none",
                }}
              />
              <s-text>{primaryColor}</s-text>
            </s-stack>
          </div>
        </s-stack>
      </s-section>

      {/* Live preview */}
      <s-section slot="aside" heading="Preview">
        <WidgetPreview
          tiers={tiers}
          title={widgetTitle}
          primaryColor={primaryColor}
        />
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
