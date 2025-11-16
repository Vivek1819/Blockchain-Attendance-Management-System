const BaseBlockchain = require('./BaseBlockchain');

/**
 * ClassChain - Layer 2 Blockchain
 * Child of Department Chain
 * Genesis block uses department's latest block hash as prev_hash
 */
class ClassChain extends BaseBlockchain {
    constructor(className, classId, departmentId, departmentChainHash) {
        super(className, 'class');
        this.classId = classId;
        this.departmentId = departmentId;
        this.parentDepartmentHash = departmentChainHash; // Link to parent
        this.metadata = {
            created: Date.now(),
            status: 'active'
        };
        
        // Create genesis block linked to department chain
        this.createGenesisBlock(departmentChainHash);
    }

    /**
     * Add class creation block
     */
    addClassBlock(classData) {
        const transaction = {
            type: 'class_created',
            action: 'create',
            classId: this.classId,
            className: this.name,
            departmentId: this.departmentId,
            data: classData,
            timestamp: Date.now(),
            status: 'active'
        };

        return this.addBlock(transaction);
    }

    /**
     * Update class - adds a new block with updated info
     */
    updateClass(updatedData) {
        const transaction = {
            type: 'class_updated',
            action: 'update',
            classId: this.classId,
            className: this.name,
            departmentId: this.departmentId,
            previousData: this.getLatestClassData(),
            updatedData: updatedData,
            timestamp: Date.now(),
            status: 'active'
        };

        this.name = updatedData.name || this.name;
        return this.addBlock(transaction);
    }

    /**
     * Delete class - adds a new block marking it as deleted
     */
    deleteClass(reason = '') {
        const transaction = {
            type: 'class_deleted',
            action: 'delete',
            classId: this.classId,
            className: this.name,
            departmentId: this.departmentId,
            reason: reason,
            timestamp: Date.now(),
            status: 'deleted'
        };

        this.metadata.status = 'deleted';
        return this.addBlock(transaction);
    }

    /**
     * Get the latest class data
     */
    getLatestClassData() {
        for (let i = this.chain.length - 1; i >= 0; i--) {
            const block = this.chain[i];
            if (block.transactions.type === 'class_created' || 
                block.transactions.type === 'class_updated') {
                return {
                    classId: this.classId,
                    className: this.name,
                    departmentId: this.departmentId,
                    status: this.metadata.status,
                    data: block.transactions.data || block.transactions.updatedData,
                    lastUpdated: block.timestamp
                };
            }
        }

        return {
            classId: this.classId,
            className: this.name,
            departmentId: this.departmentId,
            status: this.metadata.status,
            created: this.metadata.created
        };
    }

    /**
     * Check if class is active
     */
    isActive() {
        return this.metadata.status === 'active';
    }

    /**
     * Get class history
     */
    getClassHistory() {
        return this.chain
            .filter(block => block.transactions.type && block.transactions.type.startsWith('class_'))
            .map(block => ({
                blockIndex: block.index,
                action: block.transactions.action,
                timestamp: block.timestamp,
                data: block.transactions,
                hash: block.hash
            }));
    }

    /**
     * Verify that this class chain is properly linked to its parent department
     */
    verifyParentLink(departmentChainHash) {
        const genesisBlock = this.chain[0];
        return genesisBlock.prev_hash === departmentChainHash;
    }

    /**
     * Convert to JSON with metadata
     */
    toJSON() {
        return {
            ...super.toJSON(),
            classId: this.classId,
            departmentId: this.departmentId,
            parentDepartmentHash: this.parentDepartmentHash,
            metadata: this.metadata
        };
    }

    /**
     * Create ClassChain from JSON
     */
    static fromJSON(data) {
        const chain = BaseBlockchain.fromJSON(data, ClassChain);
        chain.classId = data.classId;
        chain.departmentId = data.departmentId;
        chain.parentDepartmentHash = data.parentDepartmentHash;
        chain.metadata = data.metadata;
        return chain;
    }
}

module.exports = ClassChain;
