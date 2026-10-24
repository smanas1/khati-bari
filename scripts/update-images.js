require('dotenv').config();
const { createClient } = require('@libsql/client');

const dbUrl = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
  ? { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
  : { url: 'file:prisma/dev.db' };

const client = createClient(dbUrl);

async function run() {
  console.log(`Connecting to: ${dbUrl.url}`);

  try {
    await client.execute('ALTER TABLE "Product" ADD COLUMN "image" TEXT;');
    console.log('Added column "image"');
  } catch (e) {
    // Column might already exist
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
  console.log('Updated products with images:');
  for (const row of res.rows) {
    console.log(`- [${row.category}] ${row.name}: ${row.image}`);
  }
}

run().catch(console.error);
