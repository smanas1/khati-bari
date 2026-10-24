require('dotenv').config();
const { createClient } = require('@libsql/client');

const localClient = createClient({ url: 'file:prisma/dev.db' });
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  console.log('Connecting to Turso:', process.env.TURSO_DATABASE_URL);

  // 1. Create tables in Turso
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "Tenant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "tagline" TEXT,
      "whatsapp" TEXT NOT NULL,
      "fbPageUrl" TEXT,
      "deliveryLocal" INTEGER NOT NULL DEFAULT 60,
      "deliveryDhaka" INTEGER NOT NULL DEFAULT 100,
      "deliveryOutside" INTEGER NOT NULL DEFAULT 130,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");`,

    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "unit" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "stock" INTEGER NOT NULL DEFAULT 20,
      "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
      "isComingSoon" BOOLEAN NOT NULL DEFAULT false,
      "icon" TEXT NOT NULL DEFAULT '🍯',
      "image" TEXT,
      "variants" TEXT,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "Product_tenantId_category_idx" ON "Product"("tenantId", "category");`,

    `CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderNumber" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "customerName" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "shippingAddress" TEXT NOT NULL,
      "deliveryArea" TEXT NOT NULL,
      "deliveryCharge" INTEGER NOT NULL,
      "totalAmount" INTEGER NOT NULL,
      "paymentMethod" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");`,
    `CREATE INDEX IF NOT EXISTS "Order_tenantId_status_idx" ON "Order"("tenantId", "status");`,

    `CREATE TABLE IF NOT EXISTS "OrderItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "productName" TEXT NOT NULL,
      "unit" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "unitPrice" INTEGER NOT NULL,
      CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`
  ];

  for (const sql of ddlStatements) {
    await tursoClient.execute(sql);
  }
  console.log('✓ Turso schema created successfully.');

  // 2. Copy Tenants from local dev.db
  const tenants = await localClient.execute('SELECT * FROM "Tenant";');
  for (const t of tenants.rows) {
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO "Tenant" (id, slug, name, tagline, whatsapp, fbPageUrl, deliveryLocal, deliveryDhaka, deliveryOutside, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        t.id, t.slug, t.name, t.tagline, t.whatsapp, t.fbPageUrl,
        t.deliveryLocal, t.deliveryDhaka, t.deliveryOutside, t.createdAt
      ]
    });
  }
  console.log(`✓ Copied ${tenants.rows.length} tenant(s) to Turso.`);

  // 3. Copy Products from local dev.db
  const products = await localClient.execute('SELECT * FROM "Product";');
  for (const p of products.rows) {
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO "Product" (id, tenantId, name, category, unit, price, stock, isSeasonal, isComingSoon, icon, image, variants, description, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        p.id, p.tenantId, p.name, p.category, p.unit, p.price, p.stock,
        p.isSeasonal ? 1 : 0, p.isComingSoon ? 1 : 0, p.icon, p.image,
        p.variants, p.description, p.createdAt
      ]
    });
  }
  console.log(`✓ Copied ${products.rows.length} product(s) to Turso.`);

  // 4. Copy Orders & Items if any
  const orders = await localClient.execute('SELECT * FROM "Order";');
  for (const o of orders.rows) {
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO "Order" (id, orderNumber, tenantId, customerName, customerPhone, shippingAddress, deliveryArea, deliveryCharge, totalAmount, paymentMethod, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        o.id, o.orderNumber, o.tenantId, o.customerName, o.customerPhone,
        o.shippingAddress, o.deliveryArea, o.deliveryCharge, o.totalAmount,
        o.paymentMethod, o.status, o.createdAt
      ]
    });
  }

  const items = await localClient.execute('SELECT * FROM "OrderItem";');
  for (const i of items.rows) {
    await tursoClient.execute({
      sql: `INSERT OR REPLACE INTO "OrderItem" (id, orderId, productId, productName, unit, quantity, unitPrice)
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [i.id, i.orderId, i.productId, i.productName, i.unit, i.quantity, i.unitPrice]
    });
  }
  console.log(`✓ Copied ${orders.rows.length} order(s) and ${items.rows.length} order item(s) to Turso.`);

  // Verify
  const verifiedProducts = await tursoClient.execute('SELECT name, price, stock, isComingSoon FROM "Product";');
  console.log('\nVerified Turso Products:');
  for (const p of verifiedProducts.rows) {
    console.log(`- ${p.name} (৳${p.price}, Stock: ${p.stock}, ComingSoon: ${p.isComingSoon})`);
  }
}

run().then(() => {
  console.log('\nAll done! Turso cloud database is now fully synced and ready.');
  process.exit(0);
}).catch((err) => {
  console.error('Error syncing to Turso:', err);
  process.exit(1);
});
