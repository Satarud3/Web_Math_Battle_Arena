import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Look for .env in current, parent, or grandparent directories to support monorepo paths
const possiblePaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(process.cwd(), '..', '..', '.env'),
  path.join(__dirname, '..', '..', '..', '.env'),
  path.join(__dirname, '..', '..', '..', '..', '.env'),
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
