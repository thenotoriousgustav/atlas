import * as fs from 'fs';
import * as path from 'path';

// Parse .env file manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const userId = 'c48371ad-18d9-4582-886a-4087d90072bd';

  // Find a bookmark with deletedAt: null
  const activeBookmark = await prisma.bookmark.findFirst({
    where: {
      userId,
      deletedAt: null
    }
  });

  if (!activeBookmark) {
    console.log('No active bookmarks found in database!');
    return;
  }

  const id = activeBookmark.id;
  console.log('Testing delete queries for Bookmark:', activeBookmark.title, '(', id, ')');

  // Query 1: Find one (check existence)
  const found1 = await prisma.bookmark.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    }
  });
  console.log('Query 1 Result:', found1 ? 'Found' : 'Not Found');

  // Query 2: Soft delete update
  const deleted = await prisma.bookmark.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
  console.log('Query 2 Result (Soft Deleted):', deleted.deletedAt ? 'Yes' : 'No');

  // Query 3: Find one again (check existence after delete)
  const found2 = await prisma.bookmark.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    }
  });
  console.log('Query 3 Result (After Delete):', found2 ? 'Found' : 'Not Found');

  // Restore the bookmark
  await prisma.bookmark.update({
    where: { id },
    data: { deletedAt: null }
  });
  console.log('Restored bookmark to deletedAt: null.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
