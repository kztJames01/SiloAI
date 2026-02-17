const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Reading migration SQL...');
    const migrationPath = path.join(__dirname, 'prisma/migrations/20260216164530_init/migration.sql');
    let sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove SQL comments
    sql = sql.replace(/--.*$/gm, '');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
          
          // Use $queryRawUnsafe instead
          await prisma.$queryRawUnsafe(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.code === '42710' || err.code === '42P07' || err.code === 'P2010') {
            console.log(`    ⚠️  Already exists, skipping...`);
          } else {
            throw err;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
