require('dotenv').config();
const { createClient } = require('@libsql/client');

async function checkAndAdd() {
  const clients = [
    { name: 'Local SQLite', client: createClient({ url: 'file:prisma/dev.db' }) },
  ];

  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    clients.push({
      name: 'Turso Cloud',
      client: createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    });
  }

  for (const { name, client } of clients) {
    console.log(`Checking ${name}...`);
    try {
      const info = await client.execute(`PRAGMA table_info("Tenant")`);
      const hasCol = info.rows.some((r) => r.name === 'enabledCouriers');
      console.log(`${name} has enabledCouriers:`, hasCol);

      if (!hasCol) {
        console.log(`Adding enabledCouriers column to ${name}...`);
        await client.execute(
          `ALTER TABLE "Tenant" ADD COLUMN "enabledCouriers" TEXT DEFAULT 'steadfast,pathao,sundarban,sa_paribahan'`
        );
        console.log(`Added to ${name} successfully!`);
      }

      // Update nulls if any
      await client.execute(
        `UPDATE "Tenant" SET "enabledCouriers" = 'steadfast,pathao,sundarban,sa_paribahan' WHERE "enabledCouriers" IS NULL`
      );
      
      const tenants = await client.execute(`SELECT id, slug, enabledCouriers FROM "Tenant"`);
      console.log(`${name} tenants:`, tenants.rows);
    } catch (err) {
      console.error(`Error on ${name}:`, err.message);
    }
  }
}

checkAndAdd();
