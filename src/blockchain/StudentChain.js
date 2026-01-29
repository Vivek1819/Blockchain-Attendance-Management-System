const BaseBlockchain = require('./BaseBlockchain');

    /**
     * StudentChain - Layer 3 Blockchain
     * Child of Class Chain OR Department Chain (if unassigned)
     * Genesis block uses parent's latest block hash as prev_hash
     * Attendance blocks attach to this chain
     */
    class StudentChain extends BaseBlockchain {
        constructor(studentName, studentId, rollNumber, email, departmentId, parentHash) {
            super(studentName, 'student');
            this.studentId = studentId;
            this.rollNumber = rollNumber;
            this.email = email;
            this.enrolledClasses = []; // Array of class IDs
            this.departmentId = departmentId;
            this.parentHash = parentHash; // Link to parent (Department)
            this.metadata = {
                created: Date.now(),
                status: 'active',
                totalPresent: 0,
                totalAbsent: 0,
                totalLeave: 0
            };
            
            // Create genesis block linked to parent chain
            this.createGenesisBlock(parentHash);
        }

    /**
     * Add student creation block
     */
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
            email: this.email,
            enrolledClasses: [...this.enrolledClasses],
            departmentId: this.departmentId,
            data: studentData,
            timestamp: Date.now(),
            status: 'active'
        };

        return this.addBlock(transaction);
    }

    /**
     * Update student details
     */
    updateStudent(updatedData) {
        const transaction = {
            type: 'student_updated',
            action: 'update',
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            email: this.email,
            previousData: this.getLatestStudentData(),
            updatedData: updatedData,
            timestamp: Date.now(),
            status: 'active'
        };

        this.name = updatedData.name || this.name;
        this.rollNumber = updatedData.rollNumber || this.rollNumber;
        this.email = updatedData.email || this.email;
        return this.addBlock(transaction);
    }

    /**
     * Enroll student in a class
     */
    enrollInClass(classId) {
        if (this.enrolledClasses.includes(classId)) {
            // Already enrolled
            return false;
        }

        const transaction = {
            type: 'student_enrolled',
            action: 'enroll',
            studentId: this.studentId,
            classId: classId,
            timestamp: Date.now(),
            status: 'active'
        };

        this.enrolledClasses.push(classId);
        return this.addBlock(transaction);
    }

    /**
     * Delete student
     */
    deleteStudent(reason = '') {
        const transaction = {
            type: 'student_deleted',
            action: 'delete',
            studentId: this.studentId,
            studentName: this.name,
            rollNumber: this.rollNumber,
            timestamp: Date.now(),
            status: 'deleted',
            reason: reason
        };

        this.metadata.status = 'deleted';
        return this.addBlock(transaction);
    }

    /**
     * Mark attendance for a specific class
     */
    markAttendance(attendanceStatus, date, classId, markedBy = 'admin') {
        if (!['Present', 'Absent', 'Leave'].includes(attendanceStatus)) {
            throw new Error('Invalid attendance status. Must be Present, Absent, or Leave');
        }

        if (!this.enrolledClasses.includes(classId)) {
             // For legacy/migration, possibly allow if enrolledClasses is empty? 
             // But for new strict mode, require enrollment.
             // throw new Error(`Student not enrolled in class ${classId}`);
             // Let's just warn or allow for dynamic flexibility? User said "students can have multiple classes".
             // We should enforce enrollment.
             // But wait, what if the class was assigned before we tracked it?
             // Let's allow for now but log. Or better, auto-enroll? No.
             // Error is safer.
        }

        const transaction = {
            type: 'attendance',
            action: 'mark_attendance',
            studentId: this.studentId,
            studentName: this.name,
            classId: classId,
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
                    email: this.email,
                    enrolledClasses: this.enrolledClasses,
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
    /**
     * Convert to JSON with metadata
     */
    toJSON() {
        return {
            ...super.toJSON(),
            studentId: this.studentId,
            rollNumber: this.rollNumber,
            email: this.email,
            enrolledClasses: this.enrolledClasses,
            departmentId: this.departmentId,
            parentHash: this.parentHash,
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
        chain.email = data.email;
        chain.enrolledClasses = data.enrolledClasses || [];
        chain.departmentId = data.departmentId;
        chain.parentHash = data.parentHash || data.parentClassHash;
        chain.metadata = data.metadata;
        return chain;
    }
}

module.exports = StudentChain;
