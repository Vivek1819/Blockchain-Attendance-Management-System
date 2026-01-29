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

function mineBlock(block, difficulty = 4) {
    const target = '0'.repeat(difficulty);
    block.nonce = 0;
    block.hash = calculateHash(block.index, block.timestamp, block.transactions, block.prev_hash, block.nonce);
    
    console.log(`  Mining block ${block.index}...`);
    while (block.hash.substring(0, difficulty) !== target) {
        block.nonce++;
        block.hash = calculateHash(block.index, block.timestamp, block.transactions, block.prev_hash, block.nonce);
    }
    console.log(`  Mined: ${block.hash}`);
    return block;
}

function repairBlockchain() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('Data file not found!');
        return;
    }

    console.log('Loading blockchain data...');
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let fixedCount = 0;

    // Fix ALL students
    console.log('\n=== REPAIRING STUDENT CHAINS ===\n');
    for (const studentId in data.students) {
        const student = data.students[studentId];
        const chain = student.chain;
        const difficulty = student.difficulty || 4;

        // Check Block 1 (Creation Block)
        if (chain.length > 1) {
            const creationBlock = chain[1];
            
            // Force enrolledClasses to be empty in creation block
            if (creationBlock.transactions.enrolledClasses && 
                creationBlock.transactions.enrolledClasses.length > 0) {
                
                console.log(`Fixing: ${student.name} (${studentId})`);
                console.log(`  Found enrolledClasses: ${JSON.stringify(creationBlock.transactions.enrolledClasses)}`);
                
                // 1. Clear the leaked data
                creationBlock.transactions.enrolledClasses = [];
                
                // 2. Re-mine Block 1
                mineBlock(creationBlock, difficulty);

                // 3. Update all subsequent blocks with new prev_hash and re-mine them
                for (let i = 2; i < chain.length; i++) {
                    const block = chain[i];
                    block.prev_hash = chain[i-1].hash;
                    mineBlock(block, difficulty);
                }

                fixedCount++;
                console.log(`  Done!\n`);
            }
        }
    }

    if (fixedCount > 0) {
        // Backup
        const backupPath = DATA_FILE + '.backup_' + Date.now();
        fs.writeFileSync(backupPath, fs.readFileSync(DATA_FILE));
        console.log(`Backup saved to: ${backupPath}`);
        
        // Save fixed data
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`\n✅ Successfully repaired ${fixedCount} student chains!`);
    } else {
        console.log('No corrupted chains found. All chains appear valid.');
    }
}

repairBlockchain();
