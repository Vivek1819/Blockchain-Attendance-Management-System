const fs = require('fs');
const crypto = require('crypto');

const DATA_FILE = './data/blockchain_data.json';

function calculateHash(index, timestamp, transactions, prev_hash, nonce) {
    const data = index + 
                 timestamp + 
                 JSON.stringify(transactions) + 
                 prev_hash + 
                 nonce;
    return crypto.createHash('sha256').update(data).digest('hex');
}

function diagnose() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    console.log('=== BLOCKCHAIN HASH DIAGNOSTIC ===\n');
    
    // Check departments
    console.log('--- DEPARTMENTS ---');
    for (const id in data.departments) {
        const dept = data.departments[id];
        for (let i = 0; i < dept.chain.length; i++) {
            const block = dept.chain[i];
            const calculated = calculateHash(block.index, block.timestamp, block.transactions, block.prev_hash, block.nonce);
            if (calculated !== block.hash) {
                console.log(`DEPT ${id} Block ${i}: MISMATCH`);
                console.log(`  Stored:     ${block.hash}`);
                console.log(`  Calculated: ${calculated}`);
                console.log(`  Transactions: ${JSON.stringify(block.transactions)}`);
            } else {
                console.log(`DEPT ${id} Block ${i}: OK`);
            }
        }
    }
    
    // Check classes
    console.log('\n--- CLASSES ---');
    for (const id in data.classes) {
        const cls = data.classes[id];
        for (let i = 0; i < cls.chain.length; i++) {
            const block = cls.chain[i];
            const calculated = calculateHash(block.index, block.timestamp, block.transactions, block.prev_hash, block.nonce);
            if (calculated !== block.hash) {
                console.log(`CLASS ${id} Block ${i}: MISMATCH`);
                console.log(`  Stored:     ${block.hash}`);
                console.log(`  Calculated: ${calculated}`);
                console.log(`  Transactions: ${JSON.stringify(block.transactions)}`);
            } else {
                console.log(`CLASS ${id} Block ${i}: OK`);
            }
        }
    }

    // Check students
    console.log('\n--- STUDENTS ---');
    for (const id in data.students) {
        const student = data.students[id];
        for (let i = 0; i < student.chain.length; i++) {
            const block = student.chain[i];
            const calculated = calculateHash(block.index, block.timestamp, block.transactions, block.prev_hash, block.nonce);
            if (calculated !== block.hash) {
                console.log(`STUDENT ${id} Block ${i}: MISMATCH`);
                console.log(`  Stored:     ${block.hash}`);
                console.log(`  Calculated: ${calculated}`);
                console.log(`  Transactions: ${JSON.stringify(block.transactions)}`);
            } else {
                console.log(`STUDENT ${id} Block ${i}: OK`);
            }
        }
    }
}

diagnose();
