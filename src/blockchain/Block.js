const crypto = require('crypto');

/**
 * Block Class - Core blockchain block structure
 * Contains all mandatory fields: index, timestamp, transactions, prev_hash, nonce, hash
 */
class Block {
    constructor(index, timestamp, transactions, prev_hash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions; // Can be attendance, metadata, or any data
        this.prev_hash = prev_hash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    /**
     * Calculate SHA-256 hash of the block
     * Includes: timestamp, transactions, prev_hash, nonce (as per requirements)
     */
    calculateHash() {
        const data = this.index + 
                     this.timestamp + 
                     JSON.stringify(this.transactions) + 
                     this.prev_hash + 
                     this.nonce;
        
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Proof of Work - Mine the block until hash starts with "0000"
     * This simulates real blockchain mining
     */
    mineBlock(difficulty = 4) {
        const target = '0'.repeat(difficulty);
        
        console.log(`Mining block ${this.index}...`);
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        
        console.log(`Block mined: ${this.hash}`);
    }

    /**
     * Validate this block's hash
     */
    isValid() {
        // Recalculate hash and check if it matches
        const calculatedHash = this.calculateHash();
        if (calculatedHash !== this.hash) {
            return false;
        }

        // Check if PoW is satisfied (hash starts with "0000")
        if (!this.hash.startsWith('0000')) {
            return false;
        }

        return true;
    }

    /**
     * Convert block to JSON for storage
     */
    toJSON() {
        return {
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions,
            prev_hash: this.prev_hash,
            nonce: this.nonce,
            hash: this.hash
        };
    }

    /**
     * Create Block from JSON data
     */
    static fromJSON(data) {
        const block = new Block(
            data.index,
            data.timestamp,
            data.transactions,
            data.prev_hash
        );
        block.nonce = data.nonce;
        block.hash = data.hash;
        return block;
    }
}

module.exports = Block;
