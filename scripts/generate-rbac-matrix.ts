import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderMatrix } from '../src/lib/permissions/matrix';

writeFileSync(join(process.cwd(), 'docs', 'rbac-matrix.md'), renderMatrix());
console.log('Wrote docs/rbac-matrix.md');
