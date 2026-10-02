import 'dotenv/config';
import {readFileSync} from 'node:fs';
import {sqlite} from './local-database.mjs';
sqlite.exec(readFileSync('db/seed.sql','utf8'));
sqlite.exec(readFileSync('db/seed-demo.sql','utf8'));
console.log('Clearly labeled fictional demo paper is available for local verification.');
