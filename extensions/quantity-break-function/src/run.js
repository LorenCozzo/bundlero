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
  let allTiers = null;
  const discountNodeValue = input?.discountNode?.metafield?.value;
  if (discountNodeValue) {
    try { allTiers = JSON.parse(discountNodeValue); } catch {}
  }

  const discounts = [];

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;

    let tiers = null;
    const productValue = line.merchandise.product?.metafield?.value;
    if (productValue) {
      try { tiers = JSON.parse(productValue); } catch {}
    }
    if (!tiers && allTiers) tiers = allTiers;
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) continue;

    const match = tiers
      .filter((t) => line.quantity >= t.quantity)
      .sort((a, b) => b.quantity - a.quantity)[0];

    if (!match) continue;

    if (match.discountType === "PERCENTAGE") {
      if (match.discountValue <= 0) continue;
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: { percentage: { value: String(match.discountValue) } },
      });
    } else {
      // FIXED = precio total del tier — calculamos el descuento contra el precio original
      const unitPrice = parseFloat(line.cost.amountPerQuantity.amount);
      const originalTotal = unitPrice * line.quantity;
      const discount = originalTotal - match.discountValue;
      if (discount <= 0) continue;
      discounts.push({
        targets: [{ productVariant: { id: line.merchandise.id } }],
        value: {
          fixedAmount: {
            amount: String(discount.toFixed(2)),
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
