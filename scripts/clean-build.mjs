import {rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// Restored build artifacts have served stale global CSS despite successful builds.
// Resolve a fixed generated directory relative to this script, never user input.
rmSync(fileURLToPath(new URL('../.next/', import.meta.url)), {recursive:true, force:true});
