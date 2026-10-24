const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:prisma/dev.db',
});

async function run() {
  await client.execute({
    sql: `UPDATE "Tenant" 
          SET "tagline" = 'প্রাকৃতিক ও নির্ভেজাল খাদ্যের বিশ্বস্ত প্রতিষ্ঠান' 
          WHERE "slug" = 'khatibari' OR "slug" = 'khati-bari' OR "slug" = 'khati-shombhar';`,
    args: [],
  });

  const res = await client.execute('SELECT slug, name, tagline FROM "Tenant";');
  console.log('Updated Tenants:', res.rows);
}

run().catch(console.error);
