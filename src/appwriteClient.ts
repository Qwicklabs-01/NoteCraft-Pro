import { Client, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '6ac8b12000380b6af116');

export { client };
export const account = new Account(client);

// Ensure ping runs once
client.ping();
