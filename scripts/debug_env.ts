import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL);
console.log('TURSO_AUTH_TOKEN length:', process.env.TURSO_AUTH_TOKEN?.length);
