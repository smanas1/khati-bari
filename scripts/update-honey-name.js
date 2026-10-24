require('dotenv').config();
const { createClient } = require('@libsql/client');

async function updateDb(name, client) {
  console.log(`\nUpdating DB: ${name}...`);
  try {
    const res = await client.execute({
      sql: `UPDATE "Product" 
            SET "name" = 'প্রাকৃতিক চাকের খাঁটি মধু',
                "description" = 'প্রাকৃতিকভাবে মৌমাছির তৈরি গাছ ও আসল মৌচাক থেকে সরাসরি সংগৃহীত খাঁটি কাঁচা মধু। কোনো প্রকার কৃত্রিম চিনি, চাষের ভেজাল বা কেমিক্যাল নেই।'
            WHERE "category" = 'মধু' OR "name" LIKE '%মধু%';`,
      args: [],
    });
    console.log(`Rows affected in ${name}:`, res.rowsAffected);

    const check = await client.execute(`SELECT id, name, category, description FROM "Product" WHERE "category" = 'মধু' OR "name" LIKE '%মধু%';`);
    console.log(`Current honey products in ${name}:`, check.rows);
  } catch (err) {
    console.error(`Error updating ${name}:`, err.message);
  }
}

async function run() {
  const localClient = createClient({ url: 'file:prisma/dev.db' });
  await updateDb('Local dev.db', localClient);

  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    await updateDb('Turso Cloud DB', tursoClient);
  }
}

run().catch(console.error);
