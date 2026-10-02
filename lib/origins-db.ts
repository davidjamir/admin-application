import { Collection, Db, MongoClient } from "mongodb"
import { attachDatabasePool } from "@vercel/functions"

const options = {
  appName: "admin-application.origins",
  maxIdleTimeMS: 5000,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  family: 4,
}

let _client: MongoClient | null = null
let _db: Db | null = null

const ORIGINS_COLLECTION = "origins"

async function getOriginsDb(): Promise<Db> {
  if (_db) return _db

  const uri = process.env.MONGODB_URI3?.trim()
  if (!uri) {
    throw new Error("MONGODB_URI3 is not configured.")
  }

  _client = new MongoClient(uri, options)
  attachDatabasePool(_client)

  try {
    await _client.connect()
  } catch (error) {
    _client = null
    console.error("MongoDB (origins) connection error:", error)
    throw error
  }

  const dbName =
    process.env.MONGODB_DB3?.trim() ||
    process.env.MONGODB_DB?.trim() ||
    "databases"
  _db = _client.db(dbName)
  return _db
}

/** Site-config cluster. Only the `origins` collection is exposed. */
export async function getOriginsCollection(): Promise<Collection> {
  const db = await getOriginsDb()
  return db.collection(ORIGINS_COLLECTION)
}
