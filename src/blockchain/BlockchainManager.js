const DepartmentChain = require('./DepartmentChain');
const ClassChain = require('./ClassChain');
const StudentChain = require('./StudentChain');
const fs = require('fs');
const path = require('path');

/**
 * BlockchainManager - Central management system for all three blockchain layers
 * Manages departments, classes, and students with hierarchical blockchain linking
 */
class BlockchainManager {
    constructor() {
        this.departments = new Map(); // departmentId -> DepartmentChain
        this.classes = new Map(); // classId -> ClassChain
        this.students = new Map(); // studentId -> StudentChain
        this.dataPath = path.join(__dirname, '../../data/blockchain_data.json');
    }

    // ==================== DEPARTMENT OPERATIONS ====================

    /**
     * Create a new department
     */
    createDepartment(departmentId, departmentName, additionalData = {}) {
        if (this.departments.has(departmentId)) {
            throw new Error(`Department with ID ${departmentId} already exists`);
        }

        const departmentChain = new DepartmentChain(departmentName, departmentId);
        departmentChain.addDepartmentBlock(additionalData);
        this.departments.set(departmentId, departmentChain);

        return {
            success: true,
            departmentId: departmentId,
            departmentName: departmentName,
            latestHash: departmentChain.getLatestBlock().hash
        };
    }

    /**
     * Get department by ID
     */
    getDepartment(departmentId) {
        const dept = this.departments.get(departmentId);
        if (!dept) {
            throw new Error(`Department ${departmentId} not found`);
        }
        return dept.getLatestDepartmentData();
    }

    /**
     * Get all departments
     */
    getAllDepartments() {
        const departments = [];
        for (const [id, chain] of this.departments) {
            departments.push(chain.getLatestDepartmentData());
        }
        return departments;
    }

    /**
     * Update department
     */
    updateDepartment(departmentId, updatedData) {
        const dept = this.departments.get(departmentId);
        if (!dept) {
            throw new Error(`Department ${departmentId} not found`);
        }

        dept.updateDepartment(updatedData);
        return {
            success: true,
            departmentId: departmentId,
            message: 'Department updated successfully'
        };
    }

    /**
     * Delete department (marks as deleted)
     */
    deleteDepartment(departmentId, reason = '') {
        const dept = this.departments.get(departmentId);
        if (!dept) {
            throw new Error(`Department ${departmentId} not found`);
        }

        dept.deleteDepartment(reason);
        
        // Also mark all classes and students under this department
        for (const [classId, classChain] of this.classes) {
            if (classChain.departmentId === departmentId && classChain.isActive()) {
                classChain.deleteClass('Parent department deleted');
            }
        }

        for (const [studentId, studentChain] of this.students) {
            if (studentChain.departmentId === departmentId && studentChain.isActive()) {
                studentChain.deleteStudent('Parent department deleted');
            }
        }

        return {
            success: true,
            departmentId: departmentId,
            message: 'Department and all related entities marked as deleted'
        };
    }

    /**
     * Search departments by name
     */
    searchDepartments(searchTerm) {
        const results = [];
        for (const [id, chain] of this.departments) {
            const data = chain.getLatestDepartmentData();
            if (data.departmentName.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push(data);
            }
        }
        return results;
    }

    // ==================== CLASS OPERATIONS ====================

    /**
     * Create a new class under a department
     */
    createClass(classId, className, departmentId, additionalData = {}) {
        if (this.classes.has(classId)) {
            throw new Error(`Class with ID ${classId} already exists`);
        }

        const dept = this.departments.get(departmentId);
        if (!dept) {
            throw new Error(`Department ${departmentId} not found`);
        }

        if (!dept.isActive()) {
            throw new Error(`Cannot create class under inactive department`);
        }

        // Get department's latest hash for linking
        const departmentHash = dept.getLatestBlock().hash;
        const classChain = new ClassChain(className, classId, departmentId, departmentHash);
        classChain.addClassBlock(additionalData);
        this.classes.set(classId, classChain);

        return {
            success: true,
            classId: classId,
            className: className,
            departmentId: departmentId,
            linkedToDepartmentHash: departmentHash,
            latestHash: classChain.getLatestBlock().hash
        };
    }

    /**
     * Get class by ID
     */
    getClass(classId) {
        const cls = this.classes.get(classId);
        if (!cls) {
            throw new Error(`Class ${classId} not found`);
        }
        return cls.getLatestClassData();
    }

    /**
     * Get all classes
     */
    getAllClasses() {
        const classes = [];
        for (const [id, chain] of this.classes) {
            classes.push(chain.getLatestClassData());
        }
        return classes;
    }

    /**
     * Get classes by department
     */
    getClassesByDepartment(departmentId) {
        const classes = [];
        for (const [id, chain] of this.classes) {
            if (chain.departmentId === departmentId) {
                classes.push(chain.getLatestClassData());
            }
        }
        return classes;
    }

    /**
     * Update class
     */
    updateClass(classId, updatedData) {
        const cls = this.classes.get(classId);
        if (!cls) {
            throw new Error(`Class ${classId} not found`);
        }

        cls.updateClass(updatedData);
        return {
            success: true,
            classId: classId,
            message: 'Class updated successfully'
        };
    }

    /**
     * Delete class
     */
    deleteClass(classId, reason = '') {
        const cls = this.classes.get(classId);
        if (!cls) {
            throw new Error(`Class ${classId} not found`);
        }

        cls.deleteClass(reason);

        // Also mark all students under this class
        for (const [studentId, studentChain] of this.students) {
            if (studentChain.classId === classId && studentChain.isActive()) {
                studentChain.deleteStudent('Parent class deleted');
            }
        }

        return {
            success: true,
            classId: classId,
            message: 'Class and all students marked as deleted'
        };
    }

    /**
     * Search classes by name
     */
    searchClasses(searchTerm) {
        const results = [];
        for (const [id, chain] of this.classes) {
            const data = chain.getLatestClassData();
            if (data.className.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push(data);
            }
        }
        return results;
    }

    // ==================== STUDENT OPERATIONS ====================

    /**
     * Create a new student under a class
     */
    createStudent(studentId, studentName, rollNumber, classId, departmentId, additionalData = {}) {
        if (this.students.has(studentId)) {
            throw new Error(`Student with ID ${studentId} already exists`);
        }

        const cls = this.classes.get(classId);
        if (!cls) {
            throw new Error(`Class ${classId} not found`);
        }

        if (!cls.isActive()) {
            throw new Error(`Cannot create student under inactive class`);
        }

        // Get class's latest hash for linking
        const classHash = cls.getLatestBlock().hash;
        const studentChain = new StudentChain(studentName, studentId, rollNumber, classId, departmentId, classHash);
        studentChain.addStudentBlock(additionalData);
        this.students.set(studentId, studentChain);

        return {
            success: true,
            studentId: studentId,
            studentName: studentName,
            rollNumber: rollNumber,
            classId: classId,
            departmentId: departmentId,
            linkedToClassHash: classHash,
            latestHash: studentChain.getLatestBlock().hash
        };
    }

    /**
     * Get student by ID
     */
    getStudent(studentId) {
        const student = this.students.get(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }
        return student.getLatestStudentData();
    }

    /**
     * Get all students
     */
    getAllStudents() {
        const students = [];
        for (const [id, chain] of this.students) {
            students.push(chain.getLatestStudentData());
        }
        return students;
    }

    /**
     * Get students by class
     */
    getStudentsByClass(classId) {
        const students = [];
        for (const [id, chain] of this.students) {
            if (chain.classId === classId) {
                students.push(chain.getLatestStudentData());
            }
        }
        return students;
    }

    /**
     * Get students by department
     */
    getStudentsByDepartment(departmentId) {
        const students = [];
        for (const [id, chain] of this.students) {
            if (chain.departmentId === departmentId) {
                students.push(chain.getLatestStudentData());
            }
        }
        return students;
    }

    /**
     * Update student
     */
    updateStudent(studentId, updatedData) {
        const student = this.students.get(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        student.updateStudent(updatedData);
        return {
            success: true,
            studentId: studentId,
            message: 'Student updated successfully'
        };
    }

    /**
     * Delete student
     */
    deleteStudent(studentId, reason = '') {
        const student = this.students.get(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        student.deleteStudent(reason);
        return {
            success: true,
            studentId: studentId,
            message: 'Student marked as deleted'
        };
    }

    /**
     * Search students by name or roll number
     */
    searchStudents(searchTerm) {
        const results = [];
        for (const [id, chain] of this.students) {
            const data = chain.getLatestStudentData();
            if (data.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push(data);
            }
        }
        return results;
    }

    // ==================== ATTENDANCE OPERATIONS ====================

    /**
     * Mark attendance for a student
     */
    markAttendance(studentId, status, date, markedBy = 'admin') {
        const student = this.students.get(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        if (!student.isActive()) {
            throw new Error(`Cannot mark attendance for inactive student`);
        }

        student.markAttendance(status, date, markedBy);
        return {
            success: true,
            studentId: studentId,
            status: status,
            date: date,
            message: 'Attendance marked successfully'
        };
    }

    /**
     * Get attendance history for a student
     */
    getStudentAttendance(studentId) {
        const student = this.students.get(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }

        return {
            student: student.getLatestStudentData(),
            summary: student.getAttendanceSummary(),
            history: student.getAttendanceHistory()
        };
    }

    /**
     * Get attendance for a class on a specific date
     */
    getClassAttendance(classId, date) {
        const students = this.getStudentsByClass(classId);
        const attendance = [];

        for (const studentData of students) {
            const student = this.students.get(studentData.studentId);
            const history = student.getAttendanceHistory();
            const dateAttendance = history.find(a => a.date === date);

            attendance.push({
                studentId: studentData.studentId,
                studentName: studentData.studentName,
                rollNumber: studentData.rollNumber,
                status: dateAttendance ? dateAttendance.status : 'Not Marked',
                timestamp: dateAttendance ? dateAttendance.timestamp : null
            });
        }

        return attendance;
    }

    /**
     * Get attendance for a department on a specific date
     */
    getDepartmentAttendance(departmentId, date) {
        const students = this.getStudentsByDepartment(departmentId);
        const attendance = [];

        for (const studentData of students) {
            const student = this.students.get(studentData.studentId);
            const history = student.getAttendanceHistory();
            const dateAttendance = history.find(a => a.date === date);

            attendance.push({
                studentId: studentData.studentId,
                studentName: studentData.studentName,
                rollNumber: studentData.rollNumber,
                classId: studentData.classId,
                status: dateAttendance ? dateAttendance.status : 'Not Marked',
                timestamp: dateAttendance ? dateAttendance.timestamp : null
            });
        }

        return attendance;
    }

    /**
     * Get department blockchain (full chain)
     */
    getDepartmentBlockchain(departmentId) {
        const dept = this.departments.get(departmentId);
        if (!dept) {
            throw new Error(`Department ${departmentId} not found`);
        }
        return dept.toJSON();
    }

    /**
     * Get class blockchain (full chain)
     */
    getClassBlockchain(classId) {
        const cls = this.classes.get(classId);
        if (!cls) {
            throw new Error(`Class ${classId} not found`);
        }
        return cls.toJSON();
    }

    /**
     * Get student blockchain (full chain)
     */
    getStudentBlockchain(studentId) {
        const student = this.students.get(studentId);
        if (!student) {
            throw new Error(`Student ${studentId} not found`);
        }
        return student.toJSON();
    }

    // ==================== VALIDATION OPERATIONS ====================

    /**
     * Validate entire blockchain hierarchy
     */
    validateAllChains() {
        const validation = {
            isValid: true,
            departments: {},
            classes: {},
            students: {},
            errors: []
        };

        // Validate all department chains
        for (const [deptId, deptChain] of this.departments) {
            const isValid = deptChain.isChainValid();
            validation.departments[deptId] = isValid;
            if (!isValid) {
                validation.isValid = false;
                validation.errors.push(`Department ${deptId} chain is invalid`);
            }
        }

        // Validate all class chains and their parent links
        for (const [classId, classChain] of this.classes) {
            const isValid = classChain.isChainValid();
            validation.classes[classId] = isValid;
            
            if (!isValid) {
                validation.isValid = false;
                validation.errors.push(`Class ${classId} chain is invalid`);
            }

            // Verify parent link - check against the stored parent hash
            const parentValid = classChain.verifyParentLink(classChain.parentDepartmentHash);
            if (!parentValid) {
                validation.isValid = false;
                validation.errors.push(`Class ${classId} has invalid parent link to department ${classChain.departmentId}`);
            }
        }

        // Validate all student chains and their parent links
        for (const [studentId, studentChain] of this.students) {
            const isValid = studentChain.isChainValid();
            validation.students[studentId] = isValid;
            
            if (!isValid) {
                validation.isValid = false;
                validation.errors.push(`Student ${studentId} chain is invalid`);
            }

            // Verify parent link - check against the stored parent hash
            const parentValid = studentChain.verifyParentLink(studentChain.parentClassHash);
            if (!parentValid) {
                validation.isValid = false;
                validation.errors.push(`Student ${studentId} has invalid parent link to class ${studentChain.classId}`);
            }
        }

        return validation;
    }

    // ==================== PERSISTENCE OPERATIONS ====================

    /**
     * Save all blockchain data to JSON file
     */
    saveToFile() {
        const data = {
            departments: {},
            classes: {},
            students: {},
            savedAt: Date.now()
        };

        for (const [id, chain] of this.departments) {
            data.departments[id] = chain.toJSON();
        }

        for (const [id, chain] of this.classes) {
            data.classes[id] = chain.toJSON();
        }

        for (const [id, chain] of this.students) {
            data.students[id] = chain.toJSON();
        }

        // Ensure data directory exists
        const dataDir = path.dirname(this.dataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
        console.log('Blockchain data saved successfully');
    }

    /**
     * Load blockchain data from JSON file
     */
    loadFromFile() {
        if (!fs.existsSync(this.dataPath)) {
            console.log('No saved data found, starting fresh');
            return;
        }

        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));

        // Load departments
        for (const [id, chainData] of Object.entries(data.departments)) {
            this.departments.set(id, DepartmentChain.fromJSON(chainData));
        }

        // Load classes
        for (const [id, chainData] of Object.entries(data.classes)) {
            this.classes.set(id, ClassChain.fromJSON(chainData));
        }

        // Load students
        for (const [id, chainData] of Object.entries(data.students)) {
            this.students.set(id, StudentChain.fromJSON(chainData));
        }

        console.log('Blockchain data loaded successfully');
        console.log(`Loaded: ${this.departments.size} departments, ${this.classes.size} classes, ${this.students.size} students`);
    }

    /**
     * Get system statistics
     */
    getSystemStats() {
        let totalAttendance = 0;
        for (const [id, student] of this.students) {
            const summary = student.getAttendanceSummary();
            totalAttendance += summary.totalRecords;
        }

        return {
            totalDepartments: this.departments.size,
            totalClasses: this.classes.size,
            totalStudents: this.students.size,
            totalAttendanceRecords: totalAttendance,
            activeDepartments: Array.from(this.departments.values()).filter(d => d.isActive()).length,
            activeClasses: Array.from(this.classes.values()).filter(c => c.isActive()).length,
            activeStudents: Array.from(this.students.values()).filter(s => s.isActive()).length
        };
    }
}

module.exports = BlockchainManager;
