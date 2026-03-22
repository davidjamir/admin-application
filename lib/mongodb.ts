import { MongoClient, Db } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const uri = process.env.MONGODB_URI;
const options = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
};

// Vercel connection strategy
const client = new MongoClient(uri, options);
attachDatabasePool(client);

let _db: Db | null = null;
let _initialized = false;

// Optional TTL indexing as referenced by your blueprint
const BATCHES_TTL_INDEX_NAME = "batches_createdAt_ttl";
const BATCHES_TTL_SECONDS = Math.max(
  60,
  Number(process.env.BATCHES_TTL_SECONDS || 60 * 60 * 12),
);

async function ensureTTLIndex(db: Db) {
  try {
    const queueCol = db.collection("queue");
    // Just a placeholder implementation from your logic
    // await queueCol.createIndex({ createdAt: 1 }, { expireAfterSeconds: BATCHES_TTL_SECONDS, name: BATCHES_TTL_INDEX_NAME });
  } catch (e) {
    console.error("Failed to create TTL index", e);
  }
}

export async function getDb(): Promise<Db> {
  if (_db) return _db;

  try {
    await client.connect();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }

  // Fallback to "databases" if MONGODB_DB is not provided
  _db = client.db(process.env.MONGODB_DB || "databases");

  if (!_initialized) {
    // await ensureTTLIndex(_db);
    _initialized = true;
  }
  return _db;
}
