// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  // যদি Turso URL ও Token দেওয়া থাকে এবং ডামি না হয়, তবে Turso ক্লাউডে কানেক্ট হবে, নতুবা লোকাল SQLite ব্যবহার করবে
  if (
    tursoUrl &&
    tursoAuthToken &&
    !tursoUrl.includes("yourname") &&
    !tursoAuthToken.includes("your-turso-auth-token")
  ) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
