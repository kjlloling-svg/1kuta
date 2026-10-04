import { runtimeDatabase as localDatabase } from './runtime-database.mjs';
import {paperStorage} from './paper-storage.mjs';
export const env={DB:localDatabase,BUCKET:paperStorage};

