import { Client, Account, Databases } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6ac8b12000380b6af116');

export { client };
export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const NOTEBOOKS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTEBOOKS_COLLECTION_ID;

// Ensure ping runs once
client.ping();
