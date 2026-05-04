export interface Tier {
  id?: string;
  quantity: number;
  label: string;
  badge?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  isPopular: boolean;
  sortOrder: number;
}

export interface Bundle {
  id: string;
  shop: string;
  productId?: string;
  isGlobal: boolean;
  title: string;
  isActive: boolean;
  tiers: Tier[];
  createdAt: string;
  updatedAt: string;
}
