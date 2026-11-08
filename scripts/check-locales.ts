import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { LOCALES, defaultLocale } from '../src/i18n/locales';
import { checkMessages, type MessageTree } from '../src/lib/i18n/check-messages';

const messagesDirectory = join(process.cwd(), 'messages');
const files = readdirSync(messagesDirectory).filter((file) => file.endsWith('.json'));
const catalogs: Record<string, MessageTree> = {};
let failed = false;

for (const file of files) {
  const locale = basename(file, '.json');
  try {
    catalogs[locale] = JSON.parse(
      readFileSync(join(messagesDirectory, file), 'utf8'),
    ) as MessageTree;
  } catch (error) {
    console.error(
      `${file}: not valid JSON (${error instanceof Error ? error.message : 'unknown'})`,
    );
    failed = true;
  }
}

for (const locale of Object.keys(LOCALES)) {
  if (!(locale in catalogs)) {
    console.error(`messages/${locale}.json is missing for a registered locale`);
    failed = true;
  }
}

for (const locale of Object.keys(catalogs)) {
  if (!(locale in LOCALES)) {
    console.error(`messages/${locale}.json has no entry in src/i18n/locales.ts`);
    failed = true;
  }
}

const issues = checkMessages({ source: defaultLocale, catalogs });
for (const issue of issues) {
  console.error(`${issue.locale}  ${issue.key}  [${issue.code}] ${issue.detail}`);
}

if (failed || issues.length > 0) {
  console.error(`\nLocale check failed with ${issues.length} message issue(s).`);
  process.exit(1);
}

console.log(`Locale check passed for ${Object.keys(catalogs).length} locales.`);
