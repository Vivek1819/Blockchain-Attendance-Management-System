const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Simulate the exact loading process the server uses
const Block = require('./src/blockchain/Block');
const StudentChain = require('./src/blockchain/StudentChain');

const DATA_FILE = './data/blockchain_data.json';

function diagnoseLoading() {
    console.log('=== SIMULATING SERVER LOAD PROCESS ===\n');
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // Load first student using StudentChain.fromJSON
    const studentId = Object.keys(data.students)[0];
    const studentData = data.students[studentId];
    
    console.log(`Loading student: ${studentId}`);
    console.log(`Raw JSON chain length: ${studentData.chain.length}`);
    console.log(`\nBlock 1 from JSON:`);
    console.log(`  Index: ${studentData.chain[1].index}`);
    console.log(`  Timestamp: ${studentData.chain[1].timestamp}`);
    console.log(`  Nonce: ${studentData.chain[1].nonce}`);
    console.log(`  Hash: ${studentData.chain[1].hash}`);
    console.log(`  Transactions.enrolledClasses: ${JSON.stringify(studentData.chain[1].transactions.enrolledClasses)}`);
    
    // Now use StudentChain.fromJSON to load it
    console.log(`\n--- Loading via StudentChain.fromJSON ---`);
    const loadedChain = StudentChain.fromJSON(studentData);
    
    console.log(`Loaded chain length: ${loadedChain.chain.length}`);
    console.log(`\nBlock 1 after loading:`);
    const block1 = loadedChain.chain[1];
    console.log(`  Index: ${block1.index}`);
    console.log(`  Timestamp: ${block1.timestamp}`);
    console.log(`  Nonce: ${block1.nonce}`);
    console.log(`  Hash: ${block1.hash}`);
    console.log(`  Transactions.enrolledClasses: ${JSON.stringify(block1.transactions.enrolledClasses)}`);
    
    // Calculate what the hash SHOULD be
    const calculatedHash = crypto.createHash('sha256').update(
        block1.index + 
        block1.timestamp + 
        JSON.stringify(block1.transactions) + 
        block1.prev_hash + 
        block1.nonce
    ).digest('hex');
    
    console.log(`\n  Calculated hash: ${calculatedHash}`);
    console.log(`  Match: ${calculatedHash === block1.hash ? 'YES ✅' : 'NO ❌'}`);
    
    // Check if isValid passes
    console.log(`\n--- Running isChainValid() ---`);
    const isValid = loadedChain.isChainValid();
    console.log(`Chain valid: ${isValid}`);
}

diagnoseLoading();
