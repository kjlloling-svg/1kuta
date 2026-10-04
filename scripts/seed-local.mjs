import {existsSync,writeFileSync,appendFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import dotenv from 'dotenv';
if(!existsSync('.env'))writeFileSync('.env',`SESSION_SECRET=${randomBytes(48).toString('hex')}\nPORT=3000\nDATABASE_PATH=data/kuta.sqlite\n`);
dotenv.config({quiet:true});
if(!process.env.SESSION_SECRET){appendFileSync('.env',`\nSESSION_SECRET=${randomBytes(48).toString('hex')}\n`);dotenv.config({override:true,quiet:true});}
await import('./local-database.mjs');
console.log('Local database ready. Configure GOOGLE_CLIENT_ID in .env, sign in with Google, then run npm run admin:google -- --local if you need administrator access.');
