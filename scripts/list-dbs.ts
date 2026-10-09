import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

async function check() {
  try {
    const dbs = await databases.list();
    console.log("Databases:", dbs.databases.map(d => ({ name: d.name, id: d.$id })));
    for (const db of dbs.databases) {
      const cols = await databases.listCollections(db.$id);
      console.log(`Collections in ${db.name}:`, cols.collections.map(c => ({ name: c.name, id: c.$id })));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
