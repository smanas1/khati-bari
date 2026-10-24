require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await client.execute('ALTER TABLE "Product" ADD COLUMN "variants" TEXT;');
    console.log('Added column "variants" to Turso');
  } catch (e) {
    console.log('Note on ALTER TABLE variants:', e.message);
  }

  const honeyVariants = JSON.stringify([
    { unit: "২৫০ গ্রাম", price: 350 },
    { unit: "৫০০ গ্রাম", price: 650 },
    { unit: "১ কেজি", price: 1250 }
  ]);

  const mangoVariants = JSON.stringify([
    { unit: "৫ কেজি ক্যারেট", price: 750 },
    { unit: "১০ কেজি ক্যারেট", price: 1450 },
    { unit: "২০ কেজি ক্যারেট", price: 2800 }
  ]);

  const gurVariants = JSON.stringify([
    { unit: "৫০০ গ্রাম", price: 220 },
    { unit: "১ কেজি", price: 420 },
    { unit: "২ কেজি", price: 800 }
  ]);

  await client.execute({
    sql: 'UPDATE "Product" SET "variants" = ? WHERE "category" = ? OR "name" LIKE ?',
    args: [honeyVariants, 'মধু', '%মধু%']
  });

  await client.execute({
    sql: 'UPDATE "Product" SET "variants" = ? WHERE "category" = ? OR "name" LIKE ?',
    args: [mangoVariants, 'আম', '%আম%']
  });

  await client.execute({
    sql: 'UPDATE "Product" SET "variants" = ? WHERE "category" = ? OR "name" LIKE ?',
    args: [gurVariants, 'গুড়', '%গুড়%']
  });

  const res = await client.execute('SELECT id, name, category, unit, price, variants FROM "Product";');
  console.log('Products in Turso with variants:');
  for (const row of res.rows) {
    console.log(`- ${row.name}: ${row.variants}`);
  }
}

run().catch(console.error);
