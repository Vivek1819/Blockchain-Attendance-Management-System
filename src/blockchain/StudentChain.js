const BaseBlockchain = require('./BaseBlockchain');

/**
 * StudentChain - Layer 3 Blockchain
 * Child of Class Chain
 * Genesis block uses class's latest block hash as prev_hash
 * Attendance blocks attach to this chain
 */
class StudentChain extends BaseBlockchain {
    constructor(studentName, studentId, rollNumber, classId, departmentId, classChainHash) {
        super(studentName, 'student');
        this.studentId = studentId;
        this.rollNumber = rollNumber;
        this.classId = classId;
        this.departmentId = departmentId;
        this.parentClassHash = classChainHash; // Link to parent class
        this.metadata = {
            created: Date.now(),
            status: 'active',
            totalPresent: 0,
            totalAbsent: 0,
            totalLeave: 0
        };
        
        // Create genesis block linked to class chain
        this.createGenesisBlock(classChainHash);
    }

    /**
     * Add student creation block
     */
    addStudentBlock(studentData) {
        const transaction = {
            type: 'student_created',
            action: 'create',
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            classId: this.classId,
            departmentId: this.departmentId,
            data: studentData,
            timestamp: Date.now(),
            status: 'active'
        };

        return this.addBlock(transaction);
    }

    /**
     * Update student - adds a new block with updated info
     */
    updateStudent(updatedData) {
        const transaction = {
            type: 'student_updated',
            action: 'update',
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            classId: this.classId,
            departmentId: this.departmentId,
            previousData: this.getLatestStudentData(),
            updatedData: updatedData,
            timestamp: Date.now(),
            status: 'active'
        };

        this.name = updatedData.name || this.name;
        this.rollNumber = updatedData.rollNumber || this.rollNumber;
        return this.addBlock(transaction);
    }

    /**
     * Delete student - adds a new block marking as deleted
     */
    deleteStudent(reason = '') {
        const transaction = {
            type: 'student_deleted',
            action: 'delete',
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            classId: this.classId,
            departmentId: this.departmentId,
            reason: reason,
            timestamp: Date.now(),
            status: 'deleted'
        };

        this.metadata.status = 'deleted';
        return this.addBlock(transaction);
    }

    /**
     * Mark attendance - adds an attendance block to the chain
     */
    markAttendance(attendanceStatus, date, markedBy = 'admin') {
        if (!['Present', 'Absent', 'Leave'].includes(attendanceStatus)) {
            throw new Error('Invalid attendance status. Must be Present, Absent, or Leave');
        }

        const transaction = {
            type: 'attendance',
            action: 'mark_attendance',
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            classId: this.classId,
            departmentId: this.departmentId,
            status: attendanceStatus,
            date: date,
            markedBy: markedBy,
            timestamp: Date.now()
        };

        // Update metadata counters
        if (attendanceStatus === 'Present') {
            this.metadata.totalPresent++;
        } else if (attendanceStatus === 'Absent') {
            this.metadata.totalAbsent++;
        } else if (attendanceStatus === 'Leave') {
            this.metadata.totalLeave++;
        }

        return this.addBlock(transaction);
    }

    /**
     * Get the latest student data
     */
    getLatestStudentData() {
        for (let i = this.chain.length - 1; i >= 0; i--) {
            const block = this.chain[i];
            if (block.transactions.type === 'student_created' || 
                block.transactions.type === 'student_updated') {
                return {
                    studentId: this.studentId,
                    studentName: this.name,
                    rollNumber: this.rollNumber,
                    classId: this.classId,
                    departmentId: this.departmentId,
                    status: this.metadata.status,
                    data: block.transactions.data || block.transactions.updatedData,
                    lastUpdated: block.timestamp
                };
            }
        }

        return {
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            classId: this.classId,
            departmentId: this.departmentId,
            status: this.metadata.status,
            created: this.metadata.created
        };
    }

    /**
     * Get attendance history for this student
     */
    getAttendanceHistory() {
        return this.chain
            .filter(block => block.transactions.type === 'attendance')
            .map(block => ({
                blockIndex: block.index,
                date: block.transactions.date,
                status: block.transactions.status,
                markedBy: block.transactions.markedBy,
                timestamp: block.timestamp,
                hash: block.hash,
                prev_hash: block.prev_hash,
                nonce: block.nonce
            }));
    }

    /**
     * Get attendance summary
     */
    getAttendanceSummary() {
        return {
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            totalPresent: this.metadata.totalPresent,
            totalAbsent: this.metadata.totalAbsent,
            totalLeave: this.metadata.totalLeave,
            totalRecords: this.metadata.totalPresent + this.metadata.totalAbsent + this.metadata.totalLeave,
            attendancePercentage: this.calculateAttendancePercentage()
        };
    }

    /**
     * Calculate attendance percentage
     */
    calculateAttendancePercentage() {
        const total = this.metadata.totalPresent + this.metadata.totalAbsent + this.metadata.totalLeave;
        if (total === 0) return 0;
        return ((this.metadata.totalPresent / total) * 100).toFixed(2);
    }

    /**
     * Check if student is active
     */
    isActive() {
        return this.metadata.status === 'active';
    }

    /**
     * Get student history (all changes)
     */
    getStudentHistory() {
        return this.chain
            .filter(block => block.transactions.type && block.transactions.type.startsWith('student_'))
            .map(block => ({
                blockIndex: block.index,
                action: block.transactions.action,
                timestamp: block.timestamp,
                data: block.transactions,
                hash: block.hash
            }));
    }

    /**
     * Verify that this student chain is properly linked to its parent class
     */
    verifyParentLink(classChainHash) {
        const genesisBlock = this.chain[0];
        return genesisBlock.prev_hash === classChainHash;
    }

    /**
     * Convert to JSON with metadata
     */
    toJSON() {
        return {
            ...super.toJSON(),
            studentId: this.studentId,
            rollNumber: this.rollNumber,
            classId: this.classId,
            departmentId: this.departmentId,
            parentClassHash: this.parentClassHash,
            metadata: this.metadata
        };
    }

    /**
     * Create StudentChain from JSON
     */
    static fromJSON(data) {
        const chain = BaseBlockchain.fromJSON(data, StudentChain);
        chain.studentId = data.studentId;
        chain.rollNumber = data.rollNumber;
        chain.classId = data.classId;
        chain.departmentId = data.departmentId;
        chain.parentClassHash = data.parentClassHash;
        chain.metadata = data.metadata;
        return chain;
    }
}

module.exports = StudentChain;
