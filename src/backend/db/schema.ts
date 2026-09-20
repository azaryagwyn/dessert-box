import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"), // 'admin' | 'customer'
  createdAt: integer("created_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  shortDesc: text("short_desc").notNull(),
  basePrice: integer("base_price").notNull(),
  originalPrice: integer("original_price"), // for promo strike-through
  imageUrl: text("image_url").notNull(),
  badge: text("badge"),
  temperatureInfo: text("temperature_info"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at").notNull(),
});

export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantName: text("variant_name").notNull(),
  additionalPrice: integer("additional_price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
});

export const promotions = sqliteTable("promotions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull(), // 'percentage' | 'fixed'
  discountValue: integer("discount_value").notNull(),
  minPurchase: integer("min_purchase").notNull().default(0),
  maxDiscount: integer("max_discount"),
  quota: integer("quota").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  bannerImageUrl: text("banner_image_url"),
  isBanner: integer("is_banner").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: text("customer_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  deliveryMethod: text("delivery_method").notNull(), // 'instant_courier' | 'sameday' | 'pickup'
  deliveryAddress: text("delivery_address"),
  deliveryDate: text("delivery_date"),
  deliveryTimeSlot: text("delivery_time_slot"),
  greetingCardText: text("greeting_card_text"),
  subtotal: integer("subtotal").notNull(),
  discountAmount: integer("discount_amount").notNull().default(0),
  shippingFee: integer("shipping_fee").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  promoCode: text("promo_code"),
  status: text("status").notNull().default("pending"), // 'pending' | 'paid' | 'kitchen_processing' | 'out_for_delivery' | 'completed' | 'cancelled'
  paymentMethod: text("payment_method"),
  snapToken: text("snap_token"),
  createdAt: integer("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  variantId: text("variant_id").notNull(),
  productName: text("product_name").notNull(),
  variantName: text("variant_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: integer("subtotal").notNull(),
});
