require('dotenv').config();
const { createClient } = require('@libsql/client');

async function migrate() {
  console.log('--- Starting migration for whatsapp2 ---');

  // 1. Local dev.db
  try {
    const local = createClient({ url: 'file:prisma/dev.db' });
    try {
      await local.execute('ALTER TABLE "Tenant" ADD COLUMN "whatsapp2" TEXT;');
      console.log('✓ Added column whatsapp2 to dev.db');
    } catch (err) {
      console.log('dev.db:', err.message);
    }
    await local.execute({
      sql: `UPDATE "Tenant" SET "whatsapp" = ?, "whatsapp2" = ? WHERE "slug" = ?;`,
      args: ['01778910924', '01852387701', 'khatibari'],
    });
    console.log('✓ Updated khatibari in dev.db with 01778910924 and 01852387701');
  } catch (err) {
    console.error('Error on local dev.db:', err);
  }

  // 2. Turso Cloud DB
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    try {
      const turso = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      try {
        await turso.execute('ALTER TABLE "Tenant" ADD COLUMN "whatsapp2" TEXT;');
        console.log('✓ Added column whatsapp2 to Turso');
      } catch (err) {
        console.log('Turso:', err.message);
      }
      await turso.execute({
        sql: `UPDATE "Tenant" SET "whatsapp" = ?, "whatsapp2" = ? WHERE "slug" = ?;`,
        args: ['+8801778910924', '01852387701', 'khatibari'],
      });
      console.log('✓ Updated khatibari in Turso with +8801778910924 and 01852387701');

      const res = await turso.execute(`SELECT id, slug, name, whatsapp, whatsapp2 FROM "Tenant" WHERE "slug" = 'khatibari';`);
      console.log('Turso Khatibari row:', res.rows);
    } catch (err) {
      console.error('Error on Turso:', err);
    }
  }

  console.log('--- Migration Finished ---');
}

migrate();
