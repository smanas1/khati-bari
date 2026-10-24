# খাঁটি বাড়ি (Khati Bari) — ই-কমার্স প্ল্যাটফর্ম

১০০% খাঁটি প্রাকৃতিক মধু, রাজশাহীর আম ও খাঁটি খেজুরের গুড়ের আধুনিক মাল্টি-টেন্যান্ট ই-কমার্স প্ল্যাটফর্ম।

## টেকনোলজি স্ট্যাক
- **ফ্রেমওয়ার্ক:** Next.js 16 (App Router, Turbopack, React 19)
- **স্টাইলিং:** Tailwind CSS v4, Lucide Icons
- **ডাটাবেস ও ORM:** Prisma ORM, SQLite / Turso LibSQL (Cloud)
- **নোটিফিকেশন:** Telegram Bot & WhatsApp API
- **লজিস্টিকস ও কুরিয়ার:** নাটোর থেকে সারা বাংলাদেশে স্বয়ংক্রিয় কুরিয়ার চার্জ ক্যালকুলেটর (Steadfast, Pathao, Sundarban, SA Paribahan)

## প্রজেক্ট রান করার নিয়ম

১. ডিপেন্ডেন্সি ইনস্টল (যদি ইতিমধ্যে না করা থাকে):
```bash
npm install
```

২. ডাটাবেস সেটআপ ও প্রিজমা ক্লায়েন্ট তৈরি:
```bash
npx prisma generate
npx prisma db push
```

৩. ডেভেলপমেন্ট সার্ভার চালু:
```bash
npm run dev
```
ব্রাউজারে ওপেন করুন: [http://localhost:3000](http://localhost:3000)

## অ্যাডমিন প্যানেল
- ইউআরএল: [http://localhost:3000/admin](http://localhost:3000/admin) (অটোমেটিক্যালি `/khatibari/admin`-এ রিডাইরেক্ট করবে)
- ডিফল্ট পাসওয়ার্ড: `.env` ফাইলে নির্ধারিত `admin123`
