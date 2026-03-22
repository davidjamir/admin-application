import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "databases";

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const admins = db.collection("admins");

    const email = "admin@7forge.com";
    const password = "admin123@7forge"; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await admins.findOne({ email });
    if (existing) {
      console.log("Admin user already exists");
    } else {
      await admins.insertOne({
        email,
        password: hashedPassword,
        name: "7 Forge Admin",
        role: "admin",
        createdAt: new Date(),
      });
      console.log("Admin user created successfully");
      console.log("Email: " + email);
      console.log("Password: " + password);
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await client.close();
  }
}

seed();
