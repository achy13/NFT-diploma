const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config({ path: './backend/.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function dropAndRecreate() {
  try {
    console.log('=== Drop and Recreate Diplomas Collection ===\n');
    console.log('⚠️  WARNING: This will DELETE ALL EXISTING DIPLOMAS!\n');
    
    const answer = await question('Are you sure you want to continue? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      rl.close();
      process.exit(0);
    }
    
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const db = mongoose.connection.db;
    
    console.log('Dropping diplomas collection...');
    try {
      await db.dropCollection('diplomas');
      console.log('✅ Collection dropped\n');
    } catch (err) {
      console.log('ℹ️  Collection does not exist or already dropped\n');
    }

    console.log('Creating diplomas collection with correct indexes...');
    const collection = db.collection('diplomas');
 
    await collection.createIndex(
      { tokenId: 1 },
      { unique: true, name: 'tokenId_1_unique' }
    );
    console.log('  ✅ Created unique index on tokenId');

    await collection.createIndex(
      { index: 1, createdAt: -1 },
      { unique: false, name: 'index_1_createdAt_-1' }
    );
    console.log('  ✅ Created non-unique index on (index, createdAt)\n');

    console.log('Verifying indexes...');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      const status = idx.unique ? 'UNIQUE' : 'NOT UNIQUE';
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} (${status})`);
    });
    console.log('');

    console.log('=== Success ===');
    console.log('✅ Collection recreated with correct schema');
    console.log('✅ Multiple diplomas per student index are now allowed');
    console.log('');

    await mongoose.disconnect();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    rl.close();
    process.exit(1);
  }
}

dropAndRecreate();

