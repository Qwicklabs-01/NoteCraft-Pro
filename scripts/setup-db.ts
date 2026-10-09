import { Client, Databases, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error("Missing VITE_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

async function setup() {
  try {
    console.log("Setting up Appwrite Database...");

    // 1. Create Database
    const db = await databases.create('unique()', 'NoteCraftDB');
    const dbId = db.$id;
    console.log(`✅ Database created: ${dbId}`);

    // 2. Create Notebooks Collection
    // Schema: 
    // - title: string (required)
    // - userId: string (required) - to match the Appwrite user ID
    // - pages: string (optional, large text to store JSON array of pages, or we can use a separate collection for pages)
    // - lastEdited: datetime (optional)
    const notebooksCol = await databases.createCollection(dbId, 'unique()', 'Notebooks', [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]);
    const notebooksId = notebooksCol.$id;
    console.log(`✅ Notebooks Collection created: ${notebooksId}`);

    await databases.createStringAttribute(dbId, notebooksId, 'title', 255, true);
    await databases.createStringAttribute(dbId, notebooksId, 'userId', 255, true);
    await databases.createStringAttribute(dbId, notebooksId, 'content', 1000000, false); // Store stringified JSON content
    await databases.createDatetimeAttribute(dbId, notebooksId, 'lastEdited', false);

    console.log("✅ Attributes created (Note: Appwrite takes a few seconds to fully deploy attributes).");

    // 3. Save to .env
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    if (!envContent.includes('VITE_APPWRITE_DATABASE_ID')) {
      envContent += `\nVITE_APPWRITE_DATABASE_ID=${dbId}\n`;
    }
    if (!envContent.includes('VITE_APPWRITE_NOTEBOOKS_COLLECTION_ID')) {
      envContent += `VITE_APPWRITE_NOTEBOOKS_COLLECTION_ID=${notebooksId}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env file updated with Database and Collection IDs.");
    
    console.log("Setup Complete!");

  } catch (error) {
    console.error("❌ Setup failed:", error);
  }
}

setup();
