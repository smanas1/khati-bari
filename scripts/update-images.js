require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await client.execute('ALTER TABLE "Product" ADD COLUMN "image" TEXT;');
    console.log('Added column "image" to Turso');
  } catch (e) {
    console.log('Note on ALTER TABLE:', e.message);
  }

  await client.execute({
    sql: 'UPDATE "Product" SET "image" = ? WHERE "category" = ? OR "name" LIKE ?',
    args: ['/products/honey.jpg', 'মধু', '%মধু%'],
  });

  await client.execute({
    sql: 'UPDATE "Product" SET "image" = ? WHERE "category" = ? OR "name" LIKE ?',
    args: ['/products/mango.jpg', 'আম', '%আম%'],
  });

  await client.execute({
    sql: 'UPDATE "Product" SET "image" = ? WHERE "category" = ? OR "name" LIKE ?',
    args: ['/products/gur.jpg', 'গুড়', '%গুড়%'],
  });

  const res = await client.execute('SELECT id, name, category, image FROM "Product";');
  console.log('Products in Turso with images:');
  for (const row of res.rows) {
    console.log(`- [${row.category}] ${row.name}: ${row.image}`);
  }
}

run().catch(console.error);
