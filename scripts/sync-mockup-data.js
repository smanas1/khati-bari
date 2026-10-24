require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const honeyVariants = JSON.stringify([
    { unit: "৫০০ মিলি", price: 650 },
    { unit: "১ লিটার", price: 1250 },
    { unit: "২ লিটার", price: 2400 }
  ]);

  const mangoVariants = JSON.stringify([
    { unit: "৫ কেজি", price: 450 },
    { unit: "১০ কেজি", price: 850 },
    { unit: "২০ কেজি", price: 1600 }
  ]);

  const gurVariants = JSON.stringify([
    { unit: "পাটালি (৫০০ গ্রাম)", price: 220 },
    { unit: "পাটালি (১ কেজি)", price: 420 },
    { unit: "ঝোলা গুড় (১ কেজি)", price: 450 },
    { unit: "দানা গুড় (১ কেজি)", price: 450 }
  ]);

  // Update Honey (starts from 500ml minimum, not specific to Sundarban)
  await client.execute({
    sql: `UPDATE "Product" 
          SET "name" = '১০০% খাঁটি প্রাকৃতিক মধু',
              "description" = 'সরাসরি মৌচাক থেকে সংগৃহীত ১০০% খাঁটি ও প্রাকৃতিক মধু। কোনো কেমিক্যাল বা ভেজাল নেই।',
              "variants" = ?,
              "unit" = '৫০০ মিলি',
              "price" = 650
          WHERE "category" = 'মধু' OR "name" LIKE '%মধু%'`,
    args: [honeyVariants]
  });

  // Update Mango (not strictly Himsagar, realistic affordable pricing)
  await client.execute({
    sql: `UPDATE "Product" 
          SET "name" = 'রাজশাহীর বাছাইকৃত মিষ্টি আম',
              "description" = 'সম্পূর্ণ প্রাকৃতিকভাবে গাছপাকা, মিষ্টি ও সুস্বাদু সেরা জাতের আম। কোনো কার্বাইড বা কেমিক্যাল ছাড়া সরাসরি বাগান থেকে সংগৃহীত।',
              "variants" = ?,
              "unit" = '৫ কেজি',
              "price" = 450
          WHERE "category" = 'আম' OR "name" LIKE '%আম%'`,
    args: [mangoVariants]
  });

  // Update Gur (supports multiple varieties: Patali, Jhola, Dana)
  await client.execute({
    sql: `UPDATE "Product" 
          SET "name" = '১০০% খাঁটি খেজুরের গুড়',
              "description" = 'কোনো চিনি, হাইড্রোজ বা কেমিক্যাল ছাড়া তৈরি খাঁটি খেজুরের গুড়। আপনার পছন্দমতো ঐতিহ্যবাহী পাটালি, সুস্বাদু ঝোলা কিংবা দানা গুড়।',
              "variants" = ?,
              "unit" = 'পাটালি (৫০০ গ্রাম)',
              "price" = 220
          WHERE "category" = 'গুড়' OR "name" LIKE '%গুড়%'`,
    args: [gurVariants]
  });

  console.log('Successfully updated honey to 100% natural pure honey starting from 500ml!');
  const res = await client.execute('SELECT id, name, unit, price, variants FROM "Product";');
  for (const r of res.rows) {
    console.log(`- ${r.name} (${r.unit}, ৳${r.price}): ${r.variants}`);
  }
}

run().catch(console.error);
