const express = require('express');
const router = express.Router();

/**
 * Student Routes
 */
module.exports = (blockchainManager) => {
    
    // Create a new student
    router.post('/', (req, res) => {
        try {
            const { studentId, studentName, rollNumber, classId, departmentId, additionalData } = req.body;
            
            if (!studentId || !studentName || !rollNumber || !classId || !departmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'studentId, studentName, rollNumber, classId, and departmentId are required'
                });
            }

            const result = blockchainManager.createStudent(
                studentId, studentName, rollNumber, classId, departmentId, additionalData || {}
            );
            blockchainManager.saveToFile();
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all students
    router.get('/', (req, res) => {
        try {
            const students = blockchainManager.getAllStudents();
            res.json({
                success: true,
                count: students.length,
                students
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student by ID
    router.get('/:studentId', (req, res) => {
        try {
            const student = blockchainManager.getStudent(req.params.studentId);
            res.json({
                success: true,
                student
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get students by class
    router.get('/class/:classId', (req, res) => {
        try {
            const students = blockchainManager.getStudentsByClass(req.params.classId);
            res.json({
                success: true,
                count: students.length,
                students
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get students by department
    router.get('/department/:departmentId', (req, res) => {
        try {
            const students = blockchainManager.getStudentsByDepartment(req.params.departmentId);
            res.json({
                success: true,
                count: students.length,
                students
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update student
    router.put('/:studentId', (req, res) => {
        try {
            const { updatedData } = req.body;
            
            if (!updatedData) {
                return res.status(400).json({
                    success: false,
                    message: 'updatedData is required'
                });
            }

            const result = blockchainManager.updateStudent(req.params.studentId, updatedData);
            blockchainManager.saveToFile();
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete student (mark as deleted)
    router.delete('/:studentId', (req, res) => {
        try {
            const { reason } = req.body;
            const result = blockchainManager.deleteStudent(req.params.studentId, reason || '');
            blockchainManager.saveToFile();
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Search students
    router.get('/search/:searchTerm', (req, res) => {
        try {
            const results = blockchainManager.searchStudents(req.params.searchTerm);
            res.json({
                success: true,
                count: results.length,
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student blockchain details
    router.get('/:studentId/blockchain', (req, res) => {
        try {
            const student = blockchainManager.students.get(req.params.studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            res.json({
                success: true,
                blockchain: {
                    studentId: student.studentId,
                    name: student.name,
                    rollNumber: student.rollNumber,
                    classId: student.classId,
                    departmentId: student.departmentId,
                    chainLength: student.getChainLength(),
                    isValid: student.isChainValid(),
                    parentClassHash: student.parentClassHash,
                    blocks: student.getAllBlocks()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student attendance summary
    router.get('/:studentId/attendance/summary', (req, res) => {
        try {
            const student = blockchainManager.students.get(req.params.studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            res.json({
                success: true,
                summary: student.getAttendanceSummary()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
};
