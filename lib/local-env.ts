import { runtimeDatabase as localDatabase } from './runtime-database.mjs';
import {paperStorage} from './paper-storage.mjs';
export const env={DB:localDatabase,ARCHIVE_ADMIN_SETUP_TOKEN:process.env.ARCHIVE_ADMIN_SETUP_TOKEN,BUCKET:paperStorage};

