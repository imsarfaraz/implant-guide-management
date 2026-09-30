import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "global_access" boolean NOT NULL DEFAULT false;');
    console.log('Column global_access added successfully.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
