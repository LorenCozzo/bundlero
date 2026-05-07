// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // Config del discount node (bundle applyTo = "ALL")
  let allTiers = null;
  const discountNodeValue = input?.discountNode?.metafield?.value;
  if (discountNodeValue) {
    try { allTiers = JSON.parse(discountNodeValue); } catch {}
  }

  const discounts = [];

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;

    // Config del metafield del producto (bundle applyTo = "PRODUCT"), tiene prioridad
    let tiers = null;
    const productValue = line.merchandise.product?.metafield?.value;
    if (productValue) {
      try { tiers = JSON.parse(productValue); } catch {}
    }

    // Fallback al config del discount node (ALL)
    if (!tiers && allTiers) tiers = allTiers;
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) continue;

    // Tier de mayor cantidad que no supere la cantidad del carrito
    const match = tiers
      .filter((t) => line.quantity >= t.quantity)
      .sort((a, b) => b.quantity - a.quantity)[0];

    if (!match || match.discountValue <= 0) continue;

    if (match.discountType === "PERCENTAGE") {
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: { percentage: { value: String(match.discountValue) } },
      });
    } else {
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: {
          fixedAmount: {
            amount: String(match.discountValue),
            appliesToEachItem: false,
          },
        },
      });
    }
  }

  return {
    discountApplicationStrategy: DiscountApplicationStrategy.First,
    discounts,
  };
}
