import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findPhysicalProperties } from '../src/lib/i18n/logical-properties';

const root = join(process.cwd(), 'src');
const extensions = ['.ts', '.tsx', '.css'];

function* walk(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (
      extensions.some((extension) => path.endsWith(extension)) &&
      !path.includes('.test.')
    ) {
      yield path;
    }
  }
}

let count = 0;
for (const file of walk(root)) {
  for (const violation of findPhysicalProperties(readFileSync(file, 'utf8'), file)) {
    console.error(`${relative(process.cwd(), file)}:${violation.line}  ${violation.match}`);
    count += 1;
  }
}

if (count > 0) {
  console.error(`\n${count} physical direction rule(s) found. Use logical properties instead.`);
  process.exit(1);
}

console.log('Logical property check passed.');
