require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const client = createClient({ 
  url: process.env.TURSO_DATABASE_URL, 
  authToken: process.env.TURSO_AUTH_TOKEN 
}); 
client.execute('SELECT 1').then(console.log).catch(console.error);
