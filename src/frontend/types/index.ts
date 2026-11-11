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
  maxUsagePerUser?: number;
  validFrom?: number | null;
  validUntil?: number | null;
  isActive: number;
  targetSegment?: "all" | "new" | "repeat" | "loyal" | "inactive" | "specific_email";
  targetCustomerEmail?: string | null;
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

export interface StockLog {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  changeType: "sale" | "restock" | "adjustment" | "cancellation";
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  createdAt: number;
}

export interface CustomerCRM {
  email: string;
  name: string;
  phone?: string;
  registeredAt?: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: number | null;
  averageOrderValue: number;
  segment: "New Customer" | "Repeat Customer" | "Loyal Customer" | "Inactive Customer";
  recentOrders: Order[];
  retentionActionSent?: boolean;
}

export interface PromotionUsage {
  id: string;
  promotionId: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  discountAmount: number;
  usedAt: number;
}

export interface BusinessModelCanvasBlock {
  title: string;
  icon: string;
  color: string;
  items: string[];
}
