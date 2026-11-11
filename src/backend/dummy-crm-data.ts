export interface DummyCustomerDef {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  segmentTarget: "Loyal Customer" | "Repeat Customer" | "Inactive Customer" | "New Customer";
  registeredDaysAgo: number;
  orders: Array<{
    daysAgo: number;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
    totalAmount: number;
    items: Array<{
      productId: string;
      variantId: string;
      productName: string;
      variantName: string;
      unitPrice: number;
      quantity: number;
    }>;
  }>;
}

const COMMON_HASH = "02f34e4e6b5351afc6ab1163a31aca891937556501c12323ff77d72dbe537543"; // CustomerSweetLayers2026!

export const DUMMY_CUSTOMERS_SPEC: DummyCustomerDef[] = [
  // ================= 7 LOYAL CUSTOMERS (>= 5 orders OR >= Rp 500.000 spend) =================
  {
    id: "usr_dummy_loyal_1",
    name: "Tasya Farasya",
    email: "tasya.farasya@gmail.com",
    phone: "081298711001",
    address: "Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 90,
    orders: [
      {
        daysAgo: 1,
        subtotal: 144000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 159000,
        items: [
          { productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 },
          { productId: "p2", variantId: "v2_regular", productName: "Classic Venetian Tiramisu Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 1 }
        ]
      },
      {
        daysAgo: 8,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [
          { productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }
        ]
      },
      {
        daysAgo: 18,
        subtotal: 147000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 162000,
        items: [
          { productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 3 }
        ]
      },
      {
        daysAgo: 28,
        subtotal: 150000,
        shippingFee: 15000,
        discountAmount: 15000,
        totalAmount: 150000,
        items: [
          { productId: "p1", variantId: "v1_large", productName: "Belgian Dark Choco Melt Box", variantName: "Family Box (650ml)", unitPrice: 75000, quantity: 2 }
        ]
      },
      {
        daysAgo: 42,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 119000,
        items: [
          { productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }
        ]
      },
      {
        daysAgo: 60,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [
          { productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }
        ]
      },
      {
        daysAgo: 75,
        subtotal: 89000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 89000,
        items: [
          { productId: "p6", variantId: "v6_regular", productName: "Signature Triple Berry Shortcake", variantName: "Ukuran Reguler (350ml)", unitPrice: 45000, quantity: 1 },
          { productId: "p5", variantId: "v5_regular", productName: "Tokyo Matcha Forest Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 44000, quantity: 1 }
        ]
      }
    ]
  },
  {
    id: "usr_dummy_loyal_2",
    name: "Chelsea Islan",
    email: "chelsea.islan@gmail.com",
    phone: "081298711002",
    address: "Apartemen Kemang Village Tower Infinity Lt. 18, Jakarta Selatan",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 85,
    orders: [
      {
        daysAgo: 2,
        subtotal: 147000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 162000,
        items: [
          { productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 3 }
        ]
      },
      {
        daysAgo: 10,
        subtotal: 150000,
        shippingFee: 15000,
        discountAmount: 15000,
        totalAmount: 150000,
        items: [
          { productId: "p1", variantId: "v1_large", productName: "Belgian Dark Choco Melt Box", variantName: "Family Box (650ml)", unitPrice: 75000, quantity: 2 }
        ]
      },
      {
        daysAgo: 22,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [
          { productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }
        ]
      },
      {
        daysAgo: 35,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [
          { productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }
        ]
      },
      {
        daysAgo: 45,
        subtotal: 144000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 159000,
        items: [
          { productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 3 }
        ]
      },
      {
        daysAgo: 58,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [
          { productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }
        ]
      },
      {
        daysAgo: 70,
        subtotal: 156000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 156000,
        items: [
          { productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 3 }
        ]
      }
    ]
  },
  {
    id: "usr_dummy_loyal_3",
    name: "Citra Kirana",
    email: "citra.kirana@gmail.com",
    phone: "081298711003",
    address: "Jl. Duren Tiga Elok Blok B No. 12, Pancoran, Jakarta Selatan",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 70,
    orders: [
      {
        daysAgo: 2,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 14,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 25,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 113000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 40,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 55,
        subtotal: 150000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 150000,
        items: [{ productId: "p1", variantId: "v1_large", productName: "Belgian Dark Choco Melt Box", variantName: "Family Box (650ml)", unitPrice: 75000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_loyal_4",
    name: "Maudy Ayunda",
    email: "maudy.ayunda@gmail.com",
    phone: "081298711004",
    address: "Jl. Menteng Raya No. 24, Menteng, Jakarta Pusat",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 75,
    orders: [
      {
        daysAgo: 3,
        subtotal: 150000,
        shippingFee: 15000,
        discountAmount: 15000,
        totalAmount: 150000,
        items: [{ productId: "p1", variantId: "v1_large", productName: "Belgian Dark Choco Melt Box", variantName: "Family Box (650ml)", unitPrice: 75000, quantity: 2 }]
      },
      {
        daysAgo: 16,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 119000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 29,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 45,
        subtotal: 144000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 159000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 3 }]
      },
      {
        daysAgo: 60,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_loyal_5",
    name: "Raditya Dika",
    email: "raditya.dika@gmail.com",
    phone: "081298711005",
    address: "Jl. Ampera Raya Komp. Artis No. 8, Cilandak, Jakarta Selatan",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 65,
    orders: [
      {
        daysAgo: 5,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 17,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 30,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 113000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 44,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 58,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 119000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_loyal_6",
    name: "Bryan Domani",
    email: "bryan.domani@gmail.com",
    phone: "081298711006",
    address: "Jl. Bangka IX No. 17, Mampang Prapatan, Jakarta Selatan",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 60,
    orders: [
      {
        daysAgo: 4,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 15,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 26,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 38,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 50,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_loyal_7",
    name: "Daniel Mananta",
    email: "daniel.mananta@gmail.com",
    phone: "081298711007",
    address: "Jl. Bumi No. 10, Mayestik, Kebayoran Baru, Jakarta Selatan",
    segmentTarget: "Loyal Customer",
    registeredDaysAgo: 55,
    orders: [
      {
        daysAgo: 6,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 19,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 31,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 41,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 52,
        subtotal: 104000,
        shippingFee: 0,
        discountAmount: 10000,
        totalAmount: 94000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      }
    ]
  },

  // ================= 8 REPEAT CUSTOMERS (2-4 orders, spend < 500k, last order <= 30 days) =================
  {
    id: "usr_dummy_repeat_1",
    name: "Rizky Febian",
    email: "rizky.febian@gmail.com",
    phone: "081298722001",
    address: "Jl. Dago Asri No. 14, Coblong, Bandung",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 45,
    orders: [
      {
        daysAgo: 5,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 20,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 113000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 38,
        subtotal: 48000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 63000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 1 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_2",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@gmail.com",
    phone: "081298722002",
    address: "Komp. Billy Moon Blok H No. 5, Pondok Kelapa, Jakarta Timur",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 35,
    orders: [
      {
        daysAgo: 8,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 24,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_3",
    name: "Bagus Wicaksono",
    email: "bagus.wicaksono@gmail.com",
    phone: "081298722003",
    address: "Jl. Kaliurang KM 5, Sleman, Yogyakarta",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 40,
    orders: [
      {
        daysAgo: 12,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 21,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 29,
        subtotal: 52000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 67000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 1 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_4",
    name: "Nadia Maharani",
    email: "nadia.maharani@gmail.com",
    phone: "081298722004",
    address: "Jl. Margonda Raya No. 120, Beji, Depok",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 30,
    orders: [
      {
        daysAgo: 10,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 26,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_5",
    name: "Hendra Gunawan",
    email: "hendra.gunawan@gmail.com",
    phone: "081298722005",
    address: "Perumahan BSD City Sektor 1.2, Serpong, Tangerang Selatan",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 45,
    orders: [
      {
        daysAgo: 15,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 27,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 40,
        subtotal: 49000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 64000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 1 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_6",
    name: "Clarissa Putri",
    email: "clarissa.putri@gmail.com",
    phone: "081298722006",
    address: "Jl. Tebet Barat Dalam Raya No. 32, Tebet, Jakarta Selatan",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 38,
    orders: [
      {
        daysAgo: 7,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 22,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 113000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 35,
        subtotal: 52000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 67000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 1 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_7",
    name: "Alifia Zahra",
    email: "alifia.zahra@gmail.com",
    phone: "081298722007",
    address: "Jl. Dipati Ukur No. 88, Lebakgede, Bandung",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 25,
    orders: [
      {
        daysAgo: 14,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 24,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_repeat_8",
    name: "Rendy Kusuma",
    email: "rendy.kusuma@gmail.com",
    phone: "081298722008",
    address: "Jl. Mayjen Sungkono No. 101, Dukuh Pakis, Surabaya",
    segmentTarget: "Repeat Customer",
    registeredDaysAgo: 42,
    orders: [
      {
        daysAgo: 20,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 28,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 39,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },

  // ================= 7 INACTIVE CUSTOMERS (>=2 orders >30 days OR 1 order >45 days) =================
  {
    id: "usr_dummy_inactive_1",
    name: "Bima Sakti",
    email: "bima.sakti@gmail.com",
    phone: "081298733001",
    address: "Jl. Boulevard Barat Raya Blok LC7, Kelapa Gading, Jakarta Utara",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 80,
    orders: [
      {
        daysAgo: 50,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 70,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_inactive_2",
    name: "Dewi Persik",
    email: "dewi.persik@gmail.com",
    phone: "081298733002",
    address: "Jl. Veteran No. 25, Gambir, Jakarta Pusat",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 95,
    orders: [
      {
        daysAgo: 60,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 78,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_inactive_3",
    name: "Eko Patrio",
    email: "eko.patrio@gmail.com",
    phone: "081298733003",
    address: "Jl. Cipinang Muara No. 15, Jatinegara, Jakarta Timur",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 75,
    orders: [
      {
        daysAgo: 70,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_inactive_4",
    name: "Gita Gutawa",
    email: "gita.gutawa@gmail.com",
    phone: "081298733004",
    address: "Jl. Brawijaya Raya No. 4, Kebayoran Baru, Jakarta Selatan",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 65,
    orders: [
      {
        daysAgo: 42,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      },
      {
        daysAgo: 60,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_inactive_5",
    name: "Harris Vriza",
    email: "harris.vriza@gmail.com",
    phone: "081298733005",
    address: "Jl. Cipete Raya No. 19, Cipete Selatan, Jakarta Selatan",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 70,
    orders: [
      {
        daysAgo: 55,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      },
      {
        daysAgo: 68,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_inactive_6",
    name: "Indah Permatasari",
    email: "indah.permatasari@gmail.com",
    phone: "081298733006",
    address: "Jl. Cinere Raya Blok M No. 8, Cinere, Depok",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 75,
    orders: [
      {
        daysAgo: 65,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_inactive_7",
    name: "Julian Jacob",
    email: "julian.jacob@gmail.com",
    phone: "081298733007",
    address: "Jl. Danau Sunter Utara Blok F No. 12, Tanjung Priok, Jakarta Utara",
    segmentTarget: "Inactive Customer",
    registeredDaysAgo: 60,
    orders: [
      {
        daysAgo: 48,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 111000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      },
      {
        daysAgo: 58,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },

  // ================= 8 NEW CUSTOMERS (1 order <= 45 days OR 0 orders) =================
  {
    id: "usr_dummy_new_1",
    name: "Naufal Pratama",
    email: "naufal.pratama@gmail.com",
    phone: "081298744001",
    address: "Jl. KH Ahmad Dahlan No. 18, Kebayoran Baru, Jakarta Selatan",
    segmentTarget: "New Customer",
    registeredDaysAgo: 3,
    orders: [
      {
        daysAgo: 2,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_new_2",
    name: "Jessica Wijaya",
    email: "jessica.wijaya@gmail.com",
    phone: "081298744002",
    address: "Green Garden Blok A3 No. 7, Kebon Jeruk, Jakarta Barat",
    segmentTarget: "New Customer",
    registeredDaysAgo: 5,
    orders: [
      {
        daysAgo: 4,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 109000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_new_3",
    name: "Dimas Arya Putra",
    email: "dimas.arya@gmail.com",
    phone: "081298744003",
    address: "Perumahan Harapan Indah Blok DB No. 9, Tarumajaya, Bekasi",
    segmentTarget: "New Customer",
    registeredDaysAgo: 8,
    orders: [
      {
        daysAgo: 7,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 113000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_new_4",
    name: "Amanda Aurelia",
    email: "amanda.aurelia@gmail.com",
    phone: "081298744004",
    address: "Jl. Boulevard Bintaro Jaya Sektor 7, Tangerang Selatan",
    segmentTarget: "New Customer",
    registeredDaysAgo: 11,
    orders: [
      {
        daysAgo: 10,
        subtotal: 96000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 101000,
        items: [{ productId: "p1", variantId: "v1_regular", productName: "Belgian Dark Choco Melt Box", variantName: "Ukuran Reguler (350ml)", unitPrice: 48000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_new_5",
    name: "Fajar Ramadhan",
    email: "fajar.ramadhan@gmail.com",
    phone: "081298744005",
    address: "Jl. Pajajaran No. 44, Sukasari, Bogor",
    segmentTarget: "New Customer",
    registeredDaysAgo: 14,
    orders: [
      {
        daysAgo: 12,
        subtotal: 104000,
        shippingFee: 15000,
        discountAmount: 0,
        totalAmount: 119000,
        items: [{ productId: "p2", variantId: "v2_large", productName: "Classic Venetian Tiramisu Box", variantName: "Family Box (650ml)", unitPrice: 52000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_new_6",
    name: "Bella Safitri",
    email: "bella.safitri@gmail.com",
    phone: "081298744006",
    address: "Jl. Palagan Tentara Pelajar KM 7, Sariharjo, Sleman, Yogyakarta",
    segmentTarget: "New Customer",
    registeredDaysAgo: 4,
    orders: [
      {
        daysAgo: 3,
        subtotal: 98000,
        shippingFee: 15000,
        discountAmount: 10000,
        totalAmount: 103000,
        items: [{ productId: "p3", variantId: "v3_regular", productName: "Lotus Biscoff Caramel Velvet", variantName: "Ukuran Reguler (350ml)", unitPrice: 49000, quantity: 2 }]
      }
    ]
  },
  {
    id: "usr_dummy_new_7",
    name: "Kevin Sanjaya",
    email: "kevin.sanjaya@gmail.com",
    phone: "081298744007",
    address: "Pakuwon City Cluster San Antonio Blok N1 No. 5, Surabaya",
    segmentTarget: "New Customer",
    registeredDaysAgo: 5,
    orders: [] // Newly registered, 0 orders
  },
  {
    id: "usr_dummy_new_8",
    name: "Tiara Andini",
    email: "tiara.andini@gmail.com",
    phone: "081298744008",
    address: "Jl. Ijen No. 62, Klojen, Malang",
    segmentTarget: "New Customer",
    registeredDaysAgo: 7,
    orders: [] // Newly registered, 0 orders
  }
];

export function buildGeneratedDummyDataset(now: number = Date.now()) {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const generatedUsers: any[] = [];
  const generatedOrders: any[] = [];
  const generatedOrderItems: any[] = [];

  let orderSequence = 1001;

  for (const cust of DUMMY_CUSTOMERS_SPEC) {
    const userCreatedAt = now - cust.registeredDaysAgo * ONE_DAY_MS;
    generatedUsers.push({
      id: cust.id,
      name: cust.name,
      email: cust.email.toLowerCase().trim(),
      phone: cust.phone,
      passwordHash: COMMON_HASH,
      role: "customer",
      createdAt: userCreatedAt,
    });

    cust.orders.forEach((ordDef, idx) => {
      const orderCreatedAt = now - ordDef.daysAgo * ONE_DAY_MS;
      const orderId = `ord_dmy_${cust.id}_${idx + 1}`;
      const orderNum = `SL-DMY-${orderSequence++}`;

      generatedOrders.push({
        id: orderId,
        orderNumber: orderNum,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email.toLowerCase().trim(),
        deliveryMethod: "instant_courier",
        deliveryAddress: cust.address,
        deliveryDate: new Date(orderCreatedAt).toISOString().split("T")[0],
        deliveryTimeSlot: "13:00 - 16:00",
        greetingCardText: "Nikmati kelezatan artisan dessert box SweetLayers! 🍰",
        subtotal: ordDef.subtotal,
        discountAmount: ordDef.discountAmount,
        shippingFee: ordDef.shippingFee,
        totalAmount: ordDef.totalAmount,
        promoCode: ordDef.discountAmount > 0 ? "SWEETHEMAT" : null,
        status: "completed",
        paymentMethod: "midtrans_snap",
        snapToken: `dummy_token_${orderId}`,
        createdAt: orderCreatedAt,
      });

      ordDef.items.forEach((item, itemIdx) => {
        generatedOrderItems.push({
          id: `item_dmy_${orderId}_${itemIdx + 1}`,
          orderId: orderId,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity,
        });
      });
    });
  }

  return {
    users: generatedUsers,
    orders: generatedOrders,
    orderItems: generatedOrderItems,
  };
}
