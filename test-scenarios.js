import { createServer } from "vite";

async function runTests() {
  console.log("=== STARTING AUTOMATED TEST SCENARIOS ===");
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });

  const backendMod = await vite.ssrLoadModule("/src/backend/index.ts");
  const app = backendMod.default || backendMod.app;
  console.log("Loaded backend app successfully.");

  let results = [];

  // Helper to make app request
  async function request(path, options = {}) {
    const url = "http://localhost" + path;
    const res = await app.request(url, options);
    const contentType = res.headers.get("content-type") || "";
    let body = null;
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return { status: res.status, headers: res.headers, body };
  }

  // Login as Admin to get authorization token for admin routes
  const adminLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@sweetlayers.com", password: "AdminSweetLayers2026!" }),
  });
  const adminToken = adminLoginRes.body.token;
  console.log("Admin login success, token received:", !!adminToken);

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  };

  // 1. Get initial product list & variants
  const productsRes = await request("/api/products");
  const products = productsRes.body;
  const targetProduct = products[0];
  const targetVariant = targetProduct.variants[0];
  const initialStock = targetVariant.stock;
  console.log(`Initial test product: ${targetProduct.name} - ${targetVariant.variantName}, Stock: ${initialStock}`);

  // Test Case 1: Promo validation with date & customer constraints
  const promoRes = await request("/api/promotions/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "MANIS20", subtotal: 100000, customerEmail: "budi.tester@example.com" }),
  });
  console.log("Promo MANIS20 validation result:", promoRes.body);

  // Test Case 2: New Customer Checkout with Promo
  const order1Payload = {
    customerName: "Budi Santoso",
    customerEmail: "budi.tester@example.com",
    customerPhone: "081234567890",
    deliveryMethod: "instant_courier",
    deliveryAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
    promoCode: "MANIS20",
    items: [
      {
        productId: targetProduct.id,
        variantId: targetVariant.id,
        quantity: 2,
      },
    ],
  };

  const createOrder1 = await request("/api/orders/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order1Payload),
  });

  const order1Number = createOrder1.body.orderNumber;
  const order1Id = createOrder1.body.orderId;
  console.log("Order 1 created:", order1Number, "Status code:", createOrder1.status);

  // Simulate payment for Order 1
  const pay1Res = await request("/api/payment/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: order1Number }),
  });
  console.log("Order 1 payment simulated:", pay1Res.body);

  // Verify stock deduction
  const verifyProd1 = await request(`/api/products/${targetProduct.slug}`);
  const v1 = verifyProd1.body.variants.find((v) => v.id === targetVariant.id);
  console.log(`Stock after Order 1 payment: ${v1.stock} (Expected: ${initialStock - 2})`);

  // Check CRM status for Budi (Expected: New Customer)
  const crmRes1 = await request("/api/admin/crm/customers", { headers: adminHeaders });
  console.log("crmRes1 status:", crmRes1.status, "body length:", crmRes1.body?.length);
  const budiCRM1 = Array.isArray(crmRes1.body) ? crmRes1.body.find((c) => c.email === "budi.tester@example.com") : null;
  console.log("Budi CRM after 1st order:", {
    segment: budiCRM1?.segment,
    totalOrders: budiCRM1?.totalOrders,
    totalSpent: budiCRM1?.totalSpent,
  });

  results.push({
    name: "Skenario 1: Pembeli Baru, Promo & Pengurangan Stok",
    status: v1.stock === initialStock - 2 && budiCRM1?.segment === "New Customer" ? "PASS" : "FAIL",
    detail: `Stok berkurang dari ${initialStock} ke ${v1.stock}, CRM Segment: ${budiCRM1?.segment}, Total Spent: Rp ${budiCRM1?.totalSpent?.toLocaleString("id-ID")}`,
  });

  // Test Case 3: Repeat Customer Checkout with same email
  const order2Payload = {
    customerName: "Budi Santoso",
    customerEmail: "budi.tester@example.com",
    customerPhone: "081234567890",
    deliveryMethod: "instant_courier",
    deliveryAddress: "Jl. Sudirman No. 45, Jakarta Selatan",
    items: [
      {
        productId: targetProduct.id,
        variantId: targetVariant.id,
        quantity: 1,
      },
    ],
  };

  const createOrder2 = await request("/api/orders/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order2Payload),
  });
  const order2Number = createOrder2.body.orderNumber;

  // Pay order 2
  await request("/api/payment/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: order2Number }),
  });

  // Check CRM status for Budi again (Expected: Repeat Customer)
  const crmRes2 = await request("/api/admin/crm/customers", { headers: adminHeaders });
  const budiCRM2 = Array.isArray(crmRes2.body) ? crmRes2.body.find((c) => c.email === "budi.tester@example.com") : null;
  console.log("Budi CRM after 2nd order:", {
    segment: budiCRM2?.segment,
    totalOrders: budiCRM2?.totalOrders,
    totalSpent: budiCRM2?.totalSpent,
  });

  results.push({
    name: "Skenario 2: Repeat Order & Dynamic CRM Update",
    status: budiCRM2?.segment === "Repeat Customer" && budiCRM2?.totalOrders === 2 ? "PASS" : "FAIL",
    detail: `Order count: ${budiCRM2?.totalOrders}, Segment: ${budiCRM2?.segment}, Total Spent: Rp ${budiCRM2?.totalSpent?.toLocaleString("id-ID")}`,
  });

  // Test Case 4: Overselling Prevention
  const excessQty = v1.stock + 100;
  const oversellOrder = await request("/api/orders/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...order1Payload,
      items: [{ productId: targetProduct.id, variantId: targetVariant.id, quantity: excessQty }],
    }),
  });
  console.log("Oversell order attempt status:", oversellOrder.status, oversellOrder.body?.error);

  results.push({
    name: "Skenario 3: Pencegahan Overselling (Stok Habis/Kurang)",
    status: oversellOrder.status === 400 ? "PASS" : "FAIL",
    detail: `HTTP Status: ${oversellOrder.status}, Pesan: ${oversellOrder.body?.error || "Error"}`,
  });

  // Test Case 5: Order Cancellation & Automatic Stock Restoral
  const cancelOrderPayload = {
    customerName: "Siti Rahma",
    customerEmail: "siti.rahma@example.com",
    customerPhone: "081987654321",
    deliveryMethod: "instant_courier",
    deliveryAddress: "Jl. Tebet Barat Dalam, Jakarta Selatan",
    items: [{ productId: targetProduct.id, variantId: targetVariant.id, quantity: 3 }],
  };
  const createOrderCancel = await request("/api/orders/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cancelOrderPayload),
  });
  const cancelOrderNum = createOrderCancel.body.orderNumber;
  const cancelOrderId = createOrderCancel.body.orderId;

  // Pay it so stock is deducted
  await request("/api/payment/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: cancelOrderNum }),
  });

  const stockBeforeCancel = (await request(`/api/products/${targetProduct.slug}`)).body.variants.find((v) => v.id === targetVariant.id).stock;

  // Now admin cancels the order
  const cancelAction = await request(`/api/admin/orders/${cancelOrderId}/cancel`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ reason: "Customer requested cancellation before baking" }),
  });
  console.log("Cancel action result:", cancelAction.body);

  const stockAfterCancel = (await request(`/api/products/${targetProduct.slug}`)).body.variants.find((v) => v.id === targetVariant.id).stock;
  console.log(`Stock before cancel: ${stockBeforeCancel}, after cancel: ${stockAfterCancel} (Expected restored: +3)`);

  results.push({
    name: "Skenario 4: Pembatalan Pesanan & Pengembalian Stok Otomatis",
    status: stockAfterCancel === stockBeforeCancel + 3 ? "PASS" : "FAIL",
    detail: `Stok sebelum cancel: ${stockBeforeCancel}, setelah cancel: ${stockAfterCancel} (+3 berhasil dipulihkan)`,
  });

  // Test Case 6: Idempotent Payment & Webhook Protection
  const stockBeforeRePay = stockAfterCancel;
  // Trigger simulation again on an already paid order
  const duplicateSimulate = await request("/api/payment/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: order1Number }),
  });
  const stockAfterRePay = (await request(`/api/products/${targetProduct.slug}`)).body.variants.find((v) => v.id === targetVariant.id).stock;

  results.push({
    name: "Skenario 5: Idempotensi Pembayaran / Webhook (Anti Pemotongan Ganda)",
    status: stockBeforeRePay === stockAfterRePay ? "PASS" : "FAIL",
    detail: `Stok tetap ${stockAfterRePay} (tidak terpotong ganda saat simulate/webhook dipanggil ulang)`,
  });

  console.log("\n=== TEST RESULTS SUMMARY ===");
  console.table(results);

  await vite.close();
}

runTests().catch(console.error);
