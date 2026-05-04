/**
 * bundlero Quantity Breaks Widget
 * Embed in Shopify theme: <script src="https://YOUR_APP_URL/widget.js" data-shop="{{ shop.permanent_domain }}"></script>
 */
(function () {
  "use strict";

  const APP_URL = document.currentScript?.src?.replace("/widget.js", "") || "";
  const SHOP = document.currentScript?.dataset?.shop || window.Shopify?.shop || "";

  const STYLES = `
    .bundlero-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 16px 0 20px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
    }
    .bundlero-widget__title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 14px 16px 10px;
      border-bottom: 1px solid #f3f4f6;
    }
    .bundlero-widget__tiers {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .bundlero-tier {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.15s ease;
      position: relative;
      gap: 12px;
    }
    .bundlero-tier:last-child {
      border-bottom: none;
    }
    .bundlero-tier:hover {
      background: #f9fafb;
    }
    .bundlero-tier.bundlero-tier--selected {
      background: #eff6ff;
      border-left: 3px solid #2563eb;
    }
    .bundlero-tier__radio {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #d1d5db;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, background 0.15s;
    }
    .bundlero-tier--selected .bundlero-tier__radio {
      border-color: #2563eb;
      background: #2563eb;
    }
    .bundlero-tier--selected .bundlero-tier__radio::after {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #fff;
    }
    .bundlero-tier__qty {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      min-width: 24px;
    }
    .bundlero-tier__label {
      font-size: 14px;
      color: #374151;
      flex: 1;
    }
    .bundlero-tier__badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      background: #dcfce7;
      color: #16a34a;
      white-space: nowrap;
    }
    .bundlero-tier--popular .bundlero-tier__badge {
      background: #fef3c7;
      color: #d97706;
    }
    .bundlero-tier__price {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      text-align: right;
    }
    .bundlero-tier__price-original {
      font-size: 12px;
      color: #9ca3af;
      text-decoration: line-through;
    }
    .bundlero-popular-label {
      position: absolute;
      top: -1px;
      right: 16px;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      background: #f59e0b;
      padding: 2px 8px;
      border-radius: 0 0 6px 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `;

  function injectStyles() {
    if (document.getElementById("bundlero-styles")) return;
    const style = document.createElement("style");
    style.id = "bundlero-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function formatMoney(cents) {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: window.Shopify?.currency?.active || "USD" });
  }

  function calcPrice(originalPrice, tier) {
    if (tier.discountValue === 0) return originalPrice * tier.quantity;
    if (tier.discountType === "percentage") {
      return originalPrice * tier.quantity * (1 - tier.discountValue / 100);
    }
    return Math.max(0, originalPrice * tier.quantity - tier.discountValue);
  }

  function renderWidget(container, bundle, productData) {
    injectStyles();

    const originalPrice = productData?.price || 0;
    let selectedTier = bundle.tiers.find(t => t.isPopular) || bundle.tiers[0];

    function render() {
      container.innerHTML = `
        <div class="bundlero-widget">
          <div class="bundlero-widget__title">${bundle.title}</div>
          <div class="bundlero-widget__tiers">
            ${bundle.tiers.map(tier => {
              const totalPrice = calcPrice(originalPrice, tier);
              const fullPrice = originalPrice * tier.quantity;
              const isSelected = tier.id === selectedTier.id;
              const hasDiscount = tier.discountValue > 0;
              return `
                <div
                  class="bundlero-tier${isSelected ? " bundlero-tier--selected" : ""}${tier.isPopular ? " bundlero-tier--popular" : ""}"
                  data-tier-id="${tier.id}"
                  data-quantity="${tier.quantity}"
                >
                  ${tier.isPopular ? `<span class="bundlero-popular-label">Most Popular</span>` : ""}
                  <div class="bundlero-tier__radio"></div>
                  <span class="bundlero-tier__qty">${tier.quantity}x</span>
                  <span class="bundlero-tier__label">${tier.label}</span>
                  ${tier.badge ? `<span class="bundlero-tier__badge${tier.isPopular ? " bundlero-tier--popular" : ""}">${tier.badge}</span>` : ""}
                  <div class="bundlero-tier__price">
                    ${hasDiscount ? `<div class="bundlero-tier__price-original">${formatMoney(fullPrice)}</div>` : ""}
                    <div>${formatMoney(totalPrice)}</div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;

      container.querySelectorAll(".bundlero-tier").forEach(el => {
        el.addEventListener("click", () => {
          const tierId = el.dataset.tierId;
          selectedTier = bundle.tiers.find(t => t.id === tierId);
          const qty = parseInt(el.dataset.quantity, 10);

          // Update Shopify qty input
          const qtyInput = document.querySelector('input[name="quantity"]');
          if (qtyInput) {
            qtyInput.value = qty;
            qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
          }

          render();
        });
      });
    }

    render();

    // Set initial quantity
    const qtyInput = document.querySelector('input[name="quantity"]');
    if (qtyInput && selectedTier) {
      qtyInput.value = selectedTier.quantity;
    }
  }

  async function init() {
    const productId = window.ShopifyAnalytics?.meta?.product?.id ||
      document.querySelector('[data-product-id]')?.dataset?.productId;

    const res = await fetch(`${APP_URL}/api/widget?shop=${SHOP}&productId=${productId}`);
    const data = await res.json();

    if (!data.bundle) return;

    // Try to get product price from page
    const priceEl = document.querySelector('.price, [data-product-price], .product__price');
    const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, "");
    const priceCents = priceText ? Math.round(parseFloat(priceText) * 100) : 0;

    // Find insertion point: before Add to Cart
    const addToCart = document.querySelector('[name="add"], .product-form__submit, button[type="submit"]');
    if (!addToCart) return;

    const container = document.createElement("div");
    container.id = "bundlero-root";
    addToCart.parentElement?.insertBefore(container, addToCart);

    renderWidget(container, data.bundle, { price: priceCents });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
