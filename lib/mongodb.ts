import { MongoClient, Db } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const uri = process.env.MONGODB_URI;
const options = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  // Force IPv4 DNS resolution - fixes querySrv ECONNREFUSED on Node.js v18+
  family: 4,
};

// Vercel connection strategy
const client = new MongoClient(uri, options);
attachDatabasePool(client);

let _db: Db | null = null;
let _initialized = false;

/** Separate cluster for consolidated `social` documents (see MONGODB_URI2). */
let _socialClient: MongoClient | null = null;
let _socialDb: Db | null = null;



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

/**
 * Publisher / social archive DB (collection `social` by default).
 * Uses MONGODB_URI2; DB name defaults to `MONGODB_DB2`, then `MONGODB_DB`, then `databases`.
 */
export async function getSocialItemsDb(): Promise<Db> {
  if (_socialDb) return _socialDb;

  const uri2 = process.env.MONGODB_URI2?.trim()
  if (!uri2) {
    throw new Error(
      "MONGODB_URI2 is not configured. Add it to .env.local to load consolidated social documents.",
    )
  }

  _socialClient = new MongoClient(uri2, options)
  attachDatabasePool(_socialClient)

  try {
    await _socialClient.connect()
  } catch (error) {
    console.error("MongoDB (social items) connection error:", error)
    _socialClient = null
    throw error
  }

  const dbName =
    process.env.MONGODB_DB2?.trim() ||
    process.env.MONGODB_DB?.trim() ||
    "databases"
  _socialDb = _socialClient.db(dbName)
  return _socialDb
}
