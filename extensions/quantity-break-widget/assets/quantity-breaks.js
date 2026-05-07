(function () {
  "use strict";

  var container = document.getElementById("quantity-breaks-container");
  if (!container) return;

  var shop = container.dataset.shop;
  var productId = container.dataset.productId;

  if (!shop) return;

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateQuantityInput(qty) {
    var inputs = document.querySelectorAll(
      "input[name='quantity'], input[id*='quantity'], input[id*='Quantity']"
    );
    inputs.forEach(function (input) {
      try {
        var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        if (setter && setter.set) setter.set.call(input, String(qty));
        input.value = String(qty);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (e) {}
    });
  }

  function findAddToCart() {
    return document.querySelector(
      "#AddToCart, #add-to-cart, [name='add'], form[action*='/cart/add'] button[type='submit'], button[type='submit'][id*='add']"
    );
  }

  function render(bundle) {
    var tiers = bundle.tiers;
    var primaryColor = bundle.primaryColor || "#000000";
    var title = bundle.widgetTitle || "Choose a bundle & save!";

    if (!tiers || tiers.length === 0) return;

    var wrapper = document.createElement("div");
    wrapper.id = "qb-widget";

    var css = [
      "#qb-widget { font-family: inherit; margin-bottom: 16px; }",
      "#qb-widget .qb-title { font-weight: 600; font-size: 14px; margin: 0 0 10px; }",
      "#qb-widget .qb-tier { display: flex; align-items: center; gap: 10px; border: 2px solid #e1e3e5; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }",
      "#qb-widget .qb-tier.qb-selected { border-color: " + primaryColor + "; background: " + primaryColor + "12; }",
      "#qb-widget .qb-tier input[type=radio] { margin: 0; cursor: pointer; }",
      "#qb-widget .qb-qty { font-weight: 700; font-size: 14px; min-width: 28px; }",
      "#qb-widget .qb-label { flex: 1; font-size: 14px; }",
      "#qb-widget .qb-badge { background: " + primaryColor + "; color: #fff; border-radius: 4px; padding: 2px 7px; font-size: 11px; font-weight: 700; }",
      "#qb-widget .qb-popular { font-size: 11px; font-weight: 700; color: " + primaryColor + "; }",
      "#qb-widget .qb-saving { font-size: 12px; font-weight: 600; color: #2a9d8f; }",
    ].join("\n");

    var style = document.createElement("style");
    style.textContent = css;
    wrapper.appendChild(style);

    var titleEl = document.createElement("p");
    titleEl.className = "qb-title";
    titleEl.textContent = title;
    wrapper.appendChild(titleEl);

    tiers.forEach(function (tier, i) {
      var row = document.createElement("label");
      row.className = "qb-tier" + (i === 0 ? " qb-selected" : "");
      row.dataset.qty = tier.quantity;
      row.dataset.index = i;

      var radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "qb-tier";
      radio.value = i;
      radio.checked = i === 0;

      var qtySpan = document.createElement("span");
      qtySpan.className = "qb-qty";
      qtySpan.textContent = tier.quantity + "x";

      var labelSpan = document.createElement("span");
      labelSpan.className = "qb-label";
      labelSpan.textContent = tier.label || ("Buy " + tier.quantity);

      row.appendChild(radio);
      row.appendChild(qtySpan);
      row.appendChild(labelSpan);

      if (tier.badge) {
        var badge = document.createElement("span");
        badge.className = "qb-badge";
        badge.textContent = tier.badge;
        row.appendChild(badge);
      }

      if (tier.isPopular) {
        var pop = document.createElement("span");
        pop.className = "qb-popular";
        pop.textContent = "★ Popular";
        row.appendChild(pop);
      }

      if (tier.discountValue > 0) {
        var saving = document.createElement("span");
        saving.className = "qb-saving";
        saving.textContent = tier.discountType === "PERCENTAGE"
          ? "Save " + tier.discountValue + "%"
          : "-$" + tier.discountValue;
        row.appendChild(saving);
      }

      wrapper.appendChild(row);
    });

    // Event: seleccionar tier
    wrapper.addEventListener("change", function (e) {
      var radio = e.target;
      if (!radio || radio.name !== "qb-tier") return;
      wrapper.querySelectorAll(".qb-tier").forEach(function (el) {
        el.classList.remove("qb-selected");
      });
      radio.closest(".qb-tier").classList.add("qb-selected");
      updateQuantityInput(parseInt(radio.closest(".qb-tier").dataset.qty, 10));
    });

    // Insertar antes del botón Add to Cart
    var addToCart = findAddToCart();
    if (addToCart) {
      addToCart.parentNode.insertBefore(wrapper, addToCart);
    } else {
      container.appendChild(wrapper);
    }

    // Setear cantidad inicial
    updateQuantityInput(tiers[0].quantity);

    // Interceptar fetch global para modificar la cantidad en /cart/add
    // Dawn captura FormData antes de que event listeners puedan actualizarla
    var _origFetch = window.fetch;
    window.fetch = function (url, opts) {
      var urlStr = typeof url === "string" ? url : (url && url.url) || "";
      if (urlStr.indexOf("/cart/add") !== -1) {
        var selected = wrapper.querySelector(".qb-tier.qb-selected");
        var qty = selected ? parseInt(selected.dataset.qty, 10) : null;
        var bodyType = opts && opts.body ? opts.body.constructor.name : "none";
        console.log("[qb] cart/add fetch — selected qty:", qty, "body type:", bodyType);
        if (selected && opts && opts.body) {
          if (opts.body instanceof FormData) {
            opts.body.set("quantity", String(qty));
            console.log("[qb] FormData quantity set to", qty);
          } else if (opts.body instanceof URLSearchParams) {
            opts.body.set("quantity", String(qty));
            console.log("[qb] URLSearchParams quantity set to", qty);
          } else if (typeof opts.body === "string") {
            opts.body = opts.body.replace(/quantity=\d+/, "quantity=" + qty);
            console.log("[qb] string body quantity set to", qty);
          }
        }
      }
      return _origFetch.apply(this, arguments);
    };
  }

  function init() {
    // /apps/comboloco es el App Proxy — Shopify lo redirige al servidor sin necesitar la URL
    var url = "/apps/comboloco"
      + "?shop=" + encodeURIComponent(shop)
      + (productId ? "&productId=" + encodeURIComponent(productId) : "");

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.bundle) render(data.bundle);
      })
      .catch(function () {
        // Fail silencioso — no romper la página del merchant
      });
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
