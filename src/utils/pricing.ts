export type DiscountType = "percentage" | "amount";

export interface DiscountableProduct {
  price: number;
  discount?: number | null;
  discount_type?: DiscountType | null;
  discount_amount?: number | null;
}

export interface DiscountComputation {
  basePrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountType: DiscountType | null;
  discountValue: number;
  savings: number;
  discountLabel?: string;
}

const formatAmountLabel = (value: number) => {
  const rounded = Math.round(Math.max(value, 0));
  return `-Rs ${rounded.toLocaleString("en-IN")}`;
};

/**
 * Calculate the final price for a product given optional variant/base price.
 * Handles both percentage and fixed amount discounts while preserving backwards compatibility
 * with legacy percentage-only data.
 */
export const computeDiscountedPrice = (
  product: DiscountableProduct,
  overrideBasePrice?: number
): DiscountComputation => {
  const rawBase = Number.isFinite(overrideBasePrice)
    ? Number(overrideBasePrice)
    : Number(product.price) || 0;

  const percent = Number(product.discount) || 0;
  const amountValue = Number(product.discount_amount) || 0;
  const type: DiscountType | null =
    product.discount_type ??
    (percent > 0 ? "percentage" : null);

  let discountedPrice = rawBase;
  let hasDiscount = false;
  let appliedDiscountValue = 0;
  let savings = 0;

  if (type === "percentage" && percent > 0) {
    discountedPrice = rawBase * (1 - percent / 100);
    hasDiscount = discountedPrice < rawBase - 0.005;
    appliedDiscountValue = percent;
  } else if (type === "amount" && amountValue > 0) {
    discountedPrice = rawBase - amountValue;
    hasDiscount = discountedPrice < rawBase - 0.005;
    appliedDiscountValue = amountValue;
  }

  const clampedPrice = hasDiscount ? Math.max(discountedPrice, 0) : rawBase;
  const finalPrice = hasDiscount ? Math.round(clampedPrice) : rawBase;
  savings = hasDiscount ? rawBase - finalPrice : 0;

  let discountLabel: string | undefined;
  if (hasDiscount) {
    discountLabel =
      type === "amount"
        ? formatAmountLabel(appliedDiscountValue)
        : `-${appliedDiscountValue}%`;
  }

  return {
    basePrice: rawBase,
    finalPrice,
    hasDiscount,
    discountType: hasDiscount ? type : null,
    discountValue: hasDiscount ? appliedDiscountValue : 0,
    savings,
    discountLabel,
  };
};
