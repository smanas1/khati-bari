const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'file:prisma/dev.db',
});

async function run() {
  await client.execute({
    sql: `UPDATE "Tenant" 
          SET "slug" = 'khatibari', 
              "name" = 'খাঁটি বাড়ি', 
              "tagline" = '১০০% প্রাকৃতিক ও খাঁটি উপাদানের বিশ্বস্ত প্রতিষ্ঠান' 
          WHERE "slug" = 'khati-shombhar' OR "slug" = 'khatibari';`,
    args: [],
  });

  const res = await client.execute('SELECT * FROM "Tenant";');
  console.log('Tenants in dev.db:', res.rows);
}

run().catch(console.error);
