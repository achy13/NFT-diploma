const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function fixSchema() {
  try {
    console.log('=== Database Schema Fix Tool ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('diplomas');

    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });
    console.log('');

    console.log('Dropping all custom indexes...');
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        try {
          await collection.dropIndex(idx.name);
          console.log(`  ✅ Dropped: ${idx.name}`);
        } catch (err) {
          console.log(`  ⚠️  Could not drop ${idx.name}: ${err.message}`);
        }
      }
    }
    console.log('');

    console.log('Creating correct indexes...');

    await collection.createIndex(
      { tokenId: 1 },
      { unique: true, name: 'tokenId_1_unique' }
    );
    console.log('  ✅ Created unique index on tokenId');

    await collection.createIndex(
      { index: 1, createdAt: -1 },
      { unique: false, name: 'index_1_createdAt_-1' }
    );
    console.log('  ✅ Created non-unique compound index on (index, createdAt)');
    console.log('');

    console.log('Testing duplicate index insertion...');
    const testIndex = `TEST_VERIFY_${Date.now()}`;
    
    const doc1 = {
      studentName: "Test 1",
      index: testIndex,
      tokenId: `token1_${Date.now()}`,
      valid: true,
      createdAt: new Date()
    };

    const doc2 = {
      studentName: "Test 2",
      index: testIndex,  
      tokenId: `token2_${Date.now()}`,
      valid: true,
      createdAt: new Date()
    };

    await collection.insertOne(doc1);
    console.log(`  ✅ Inserted first document with index: ${testIndex}`);

    await collection.insertOne(doc2);
    console.log(`  ✅ Inserted second document with SAME index: ${testIndex}`);
    console.log('  ✅ SUCCESS: Multiple diplomas per index are allowed!\n');

    await collection.deleteMany({ index: testIndex });
    console.log('  ✅ Test data cleaned up\n');

    console.log('=== Final Schema Configuration ===');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      const status = idx.unique ? '⚠️  UNIQUE' : '✅ NOT UNIQUE';
      console.log(`  ${idx.name}: ${JSON.stringify(idx.key)} ${status}`);
    });
    console.log('');

    console.log('=== Summary ===');
    console.log('✅ Database schema is correctly configured');
    console.log('✅ Index field can contain duplicate values');
    console.log('✅ Multiple diplomas per student index are allowed');
    console.log('✅ TokenId field is unique (as required)');
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    
    if (error.code === 11000) {
      console.error('\n⚠️  DUPLICATE KEY ERROR DETECTED!');
      console.error('This means a unique constraint exists on the index field.');
      console.error('');
      console.error('Solution:');
      console.error('1. Drop the diplomas collection:');
      console.error('   mongo diplomadb --eval "db.diplomas.drop()"');
      console.error('');
      console.error('2. Or manually drop the unique index:');
      console.error('   mongo diplomadb --eval "db.diplomas.dropIndex(\'index_1\')"');
      console.error('');
      console.error('3. Then run this script again');
      console.error('');
    }
    
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyIndexNotUnique();

