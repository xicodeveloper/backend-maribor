import { DataAPIClient } from '@datastax/astra-db-ts';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.ASTRA_DB_API_ENDPOINT;
const token = process.env.ASTRA_DB_APPLICATION_TOKEN;

if (!endpoint || !token) {
  throw new Error('Astra DB credentials not found');
}

const client = new DataAPIClient(token);
const db = client.db(endpoint);

export default db;