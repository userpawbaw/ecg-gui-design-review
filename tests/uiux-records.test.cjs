'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'scripts', 'check-uiux-records.cjs')], {
  cwd: root,
  stdio: 'inherit'
});
