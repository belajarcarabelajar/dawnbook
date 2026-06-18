const fs = require('fs');

const file = 'scripts/migrate-to-d1.ts';
let code = fs.readFileSync(file, 'utf8');

// replace the part that writes a single file and executes it:
const target = `  const fullSql = statements.join("\\n\\n");

  // Write SQL to a temp file for wrangler execution
  const tmpSqlPath = join(rootDir, "db", "seed.sql");
  await Bun.write(tmpSqlPath, fullSql);
  console.log(\`\\n📝 Wrote seed SQL to \${tmpSqlPath} (\${rows.length} book(s))\`);

  // Execute via wrangler d1
  console.log("🚀 Applying seed to D1 (dawnbook-db)...");
  try {
    await $\`npx wrangler d1 execute dawnbook-db --remote --file=\${tmpSqlPath} --yes\`;
    console.log("✅ Seed applied successfully.");
  } catch (error) {
    console.error("❌ Failed to apply seed:", error);
    console.log("\\n💡 To apply locally instead, run:");
    console.log(\`   wrangler d1 execute dawnbook-db --local --file=\${tmpSqlPath}\`);
    process.exit(1);
  }`;

const replacement = `  console.log(\`\\n📝 Writing \${statements.length} seed SQL files...\`);
  
  console.log("🚀 Applying seed to D1 (dawnbook-db) sequentially to avoid SQLITE_TOOBIG...");
  let hasError = false;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const tmpSqlPath = join(rootDir, "db", \`seed_\${i}.sql\`);
    await Bun.write(tmpSqlPath, stmt);
    try {
      await $\`PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler d1 execute dawnbook-db --remote --file=\${tmpSqlPath} --yes\`;
      console.log(\`✅ Applied seed \${i+1}/\${statements.length} successfully.\`);
    } catch (error) {
      console.error(\`❌ Failed to apply seed \${i+1}:\`, error);
      hasError = true;
    }
  }
  
  if (hasError) {
    process.exit(1);
  }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
