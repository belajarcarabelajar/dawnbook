const { spawnSync } = require('child_process');
for (let i = 0; i < 10; i++) {
  const result = spawnSync('bun', ['test', 'tests/functions/lib/auth.test.ts'], { encoding: 'utf8' });
  if (result.stdout.includes('fail') || result.stderr.includes('fail')) {
     console.log("FAILED on run " + i);
     console.log(result.stdout);
     process.exit(1);
  }
}
console.log("PASSED 10 runs");
