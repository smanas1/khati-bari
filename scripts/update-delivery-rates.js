require('dotenv').config();
const { createClient } = require('@libsql/client');

async function updateRates() {
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
    console.log(`Updating ${name}...`);
    try {
      await client.execute(
        `UPDATE "Tenant" SET "deliveryDhaka" = 120, "deliveryOutside" = 130 WHERE "deliveryDhaka" < 120 OR "deliveryOutside" < 120`
      );
      const res = await client.execute(`SELECT slug, deliveryLocal, deliveryDhaka, deliveryOutside FROM "Tenant"`);
      console.log(`${name} updated:`, res.rows);
    } catch (err) {
      console.error(`Error on ${name}:`, err.message);
    }
  }
}

updateRates();
