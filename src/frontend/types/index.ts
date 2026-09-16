export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantName: string;
  additionalPrice: number;
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  basePrice: number;
  originalPrice?: number | null;
  imageUrl: string;
  badge?: string | null;
  temperatureInfo?: string | null;
  isActive: number;
  createdAt: number;
  variants: ProductVariant[];
  totalStock: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number | null;
  quota: number;
  usedCount: number;
  bannerImageUrl?: string | null;
  isBanner: number;
  isActive: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: "instant_courier" | "sameday" | "pickup";
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  greetingCardText?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  promoCode?: string;
  status: "pending" | "paid" | "kitchen_processing" | "out_for_delivery" | "completed" | "cancelled";
  paymentMethod?: string;
  snapToken?: string;
  createdAt: number;
  items?: OrderItem[];
}
