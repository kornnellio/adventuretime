#!/usr/bin/env node

/**
 * Script to run the dates structure migration.
 * This script will convert from the old date structure (date, endDate, dates, endDates)
 * to the new unified dates array structure.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env and .env.local
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  console.log('Loading .env file');
  dotenv.config({ path: envPath });
}

if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local file');
  dotenv.config({ path: envLocalPath, override: true });
}

// Path to the migration script
const migrationScript = path.join(__dirname, 'migrations', 'migrate-dates-structure.ts');

console.log('Starting dates structure migration...');
console.log(`Running migration script: ${migrationScript}`);

// Run the migration script with ts-node
const migration = spawn('npx', ['ts-node', '--esm', migrationScript], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env } // Pass the loaded environment variables
});

migration.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully!');
  } else {
    console.error(`Migration failed with code ${code}`);
    process.exit(code);
  }
}); 