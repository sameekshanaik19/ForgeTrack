
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const connectionString = env.DATABASE_URL;

async function testDirectConnection() {
  console.log('Testing direct DB connection...');
  // Try with and without brackets if it fails
  let urlsToTry = [connectionString];
  
  // If it contains [password], try removing brackets
  if (connectionString.includes('[') && connectionString.includes(']')) {
    const cleaned = connectionString.replace(/\[/g, '').replace(/\]/g, '');
    urlsToTry.push(cleaned);
  }

  for (const url of urlsToTry) {
    console.log('Trying URL:', url.replace(/:([^:@]+)@/, ':****@'));
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      console.log('Direct DB connection successful!');
      const res = await client.query('SELECT NOW()');
      console.log('Query result:', res.rows[0]);
      await client.end();
      return;
    } catch (err) {
      console.error('Connection failed for this URL:', err.message);
    }
  }
}

testDirectConnection();
