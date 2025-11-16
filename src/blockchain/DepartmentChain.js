const BaseBlockchain = require('./BaseBlockchain');

/**
 * DepartmentChain - Layer 1 Blockchain
 * Independent chain for each department
 * Genesis block is tied only to the department
 */
class DepartmentChain extends BaseBlockchain {
    constructor(departmentName, departmentId) {
        super(departmentName, 'department');
        this.departmentId = departmentId;
        this.metadata = {
            created: Date.now(),
            status: 'active'
        };
        
        // Create genesis block (no parent chain)
        this.createGenesisBlock('0');
    }

    /**
     * Add department creation block
     */
    addDepartmentBlock(departmentData) {
        const transaction = {
            type: 'department_created',
            action: 'create',
            departmentId: this.departmentId,
            departmentName: this.name,
            data: departmentData,
            timestamp: Date.now(),
            status: 'active'
        };

        return this.addBlock(transaction);
    }

    /**
     * Update department - adds a new block with updated info
     * (No existing blocks are modified - blockchain immutability)
     */
    updateDepartment(updatedData) {
        const transaction = {
            type: 'department_updated',
            action: 'update',
            departmentId: this.departmentId,
            departmentName: this.name,
            previousData: this.getLatestDepartmentData(),
            updatedData: updatedData,
            timestamp: Date.now(),
            status: 'active'
        };

        this.name = updatedData.name || this.name;
        return this.addBlock(transaction);
    }

    /**
     * Delete department - adds a new block marking it as deleted
     * (No blocks are removed - just status changes)
     */
    deleteDepartment(reason = '') {
        const transaction = {
            type: 'department_deleted',
            action: 'delete',
            departmentId: this.departmentId,
            departmentName: this.name,
            reason: reason,
            timestamp: Date.now(),
            status: 'deleted'
        };

        this.metadata.status = 'deleted';
        return this.addBlock(transaction);
    }

    /**
     * Get the latest department data by reading the chain
     * Prioritizes most recent block
     */
    getLatestDepartmentData() {
        // Read chain backwards to find latest data
        for (let i = this.chain.length - 1; i >= 0; i--) {
            const block = this.chain[i];
            if (block.transactions.type === 'department_created' || 
                block.transactions.type === 'department_updated') {
                return {
                    departmentId: this.departmentId,
                    departmentName: this.name,
                    status: this.metadata.status,
                    data: block.transactions.data || block.transactions.updatedData,
                    lastUpdated: block.timestamp
                };
            }
        }

        return {
            departmentId: this.departmentId,
            departmentName: this.name,
            status: this.metadata.status,
            created: this.metadata.created
        };
    }

    /**
     * Check if department is active (not deleted)
     */
    isActive() {
        return this.metadata.status === 'active';
    }

    /**
     * Get department history (all changes)
     */
    getDepartmentHistory() {
        return this.chain
            .filter(block => block.transactions.type && block.transactions.type.startsWith('department_'))
            .map(block => ({
                blockIndex: block.index,
                action: block.transactions.action,
                timestamp: block.timestamp,
                data: block.transactions,
                hash: block.hash
            }));
    }

    /**
     * Convert to JSON with metadata
     */
    toJSON() {
        return {
            ...super.toJSON(),
            departmentId: this.departmentId,
            metadata: this.metadata
        };
    }

    /**
     * Create DepartmentChain from JSON
     */
    static fromJSON(data) {
        const chain = BaseBlockchain.fromJSON(data, DepartmentChain);
        chain.departmentId = data.departmentId;
        chain.metadata = data.metadata;
        return chain;
    }
}

module.exports = DepartmentChain;
