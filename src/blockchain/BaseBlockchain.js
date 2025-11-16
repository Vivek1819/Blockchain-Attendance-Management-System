const Block = require('./Block');

/**
 * BaseBlockchain - Base class for all blockchain types
 * Provides common blockchain functionality
 */
class BaseBlockchain {
    constructor(name, type) {
        this.name = name;
        this.type = type; // 'department', 'class', or 'student'
        this.chain = [];
        this.difficulty = 4; // PoW difficulty (4 leading zeros)
    }

    /**
     * Create the genesis block
     * @param {string} parentHash - Hash from parent chain (empty for department)
     */
    createGenesisBlock(parentHash = '0') {
        const genesisBlock = new Block(
            0,
            Date.now(),
            {
                type: 'genesis',
                message: `Genesis block for ${this.type}: ${this.name}`,
                data: {}
            },
            parentHash
        );
        
        genesisBlock.mineBlock(this.difficulty);
        this.chain.push(genesisBlock);
        return genesisBlock;
    }

    /**
     * Get the latest block in the chain
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Add a new block to the chain
     */
    addBlock(transactions) {
        const latestBlock = this.getLatestBlock();
        const newBlock = new Block(
            this.chain.length,
            Date.now(),
            transactions,
            latestBlock.hash
        );
        
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        return newBlock;
    }

    /**
     * Validate the entire blockchain
     * Checks:
     * 1. Each block's hash is correctly calculated
     * 2. Each block's prev_hash matches previous block's hash
     * 3. PoW is satisfied for all blocks
     */
    isChainValid() {
        // Genesis block validation
        if (this.chain.length === 0) {
            return false;
        }

        // Check all blocks
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Validate block hash
            if (!currentBlock.isValid()) {
                console.log(`Block ${i} has invalid hash`);
                return false;
            }

            // Validate chain linkage
            if (currentBlock.prev_hash !== previousBlock.hash) {
                console.log(`Block ${i} has invalid prev_hash`);
                return false;
            }
        }

        return true;
    }

    /**
     * Get all blocks in the chain
     */
    getAllBlocks() {
        return this.chain.map(block => block.toJSON());
    }

    /**
     * Get a specific block by index
     */
    getBlock(index) {
        if (index >= 0 && index < this.chain.length) {
            return this.chain[index];
        }
        return null;
    }

    /**
     * Get the length of the chain
     */
    getChainLength() {
        return this.chain.length;
    }

    /**
     * Convert blockchain to JSON for storage
     */
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            difficulty: this.difficulty,
            chain: this.chain.map(block => block.toJSON())
        };
    }

    /**
     * Load blockchain from JSON
     */
    static fromJSON(data, BlockchainClass) {
        const blockchain = new BlockchainClass(data.name);
        blockchain.type = data.type;
        blockchain.difficulty = data.difficulty;
        blockchain.chain = data.chain.map(blockData => Block.fromJSON(blockData));
        return blockchain;
    }
}

module.exports = BaseBlockchain;
