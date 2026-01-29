const express = require('express');
const { requireAuth } = require('../middleware/clerkAuth');
const userRoles = require('../auth/userRoles');

module.exports = function(blockchainManager) {
    const router = express.Router();

    // Create student - Teacher can only create in their department
    router.post('/', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const { studentName, rollNumber, email, departmentId } = req.body;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Please complete onboarding first'
                });
            }

            // Check department access
            if (userRole.role !== 'admin' && userRole.departmentId !== departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only create students in your own department'
                });
            }

            if (!studentName || !rollNumber || !email || !departmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Student name, roll number, email, and department ID are required'
                });
            }

            // Auto-generate Student ID
            const studentId = `ST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            const result = blockchainManager.createStudent(studentId, studentName, rollNumber, email, departmentId, req.body);
            blockchainManager.saveToFile();
            
            res.status(201).json({
                success: true,
                message: 'Student created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Enroll student in class - Teacher can only enroll in their department's classes
    router.post('/enroll', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const { studentId, classId } = req.body;

            if (!studentId || !classId) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID and Class ID are required'
                });
            }
            
            // Note: Verification of Dept access is handled inside blockchainManager usually, 
            // but we can add extra check if needed. Manager checks if class matches student dept.
            // Admin can do all. Teacher limited?
            // Teacher should only enroll in classes they manage? 
            // Currently Teacher manages Dept. So if Class is in Dept, it's fine.
            
            const result = blockchainManager.enrollStudentInClass(studentId, classId);
            blockchainManager.saveToFile();

            res.json({
                success: true,
                message: 'Student enrolled successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Bulk enroll students in class
    router.post('/enroll-bulk', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const { studentIds, classId } = req.body;

            if (!studentIds || !Array.isArray(studentIds) || !classId) {
                return res.status(400).json({
                    success: false,
                    message: 'Student IDs array and Class ID are required'
                });
            }

            const results = {
                successful: [],
                failed: []
            };

            for (const studentId of studentIds) {
                try {
                    blockchainManager.enrollStudentInClass(studentId, classId);
                    results.successful.push(studentId);
                } catch (error) {
                    results.failed.push({ studentId, error: error.message });
                }
            }
            
            blockchainManager.saveToFile();

            res.json({
                success: true,
                message: `Enrolled ${results.successful.length} students`,
                data: results
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all students - Public
    router.get('/', (req, res) => {
        try {
            const students = blockchainManager.getAllStudents();
            res.json({
                success: true,
                data: students.map(student => ({
                    ...student,
                    id: student.studentId,
                    name: student.studentName
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student by ID - Public
    router.get('/:studentId', (req, res) => {
        try {
            const student = blockchainManager.getStudent(req.params.studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            res.json({
                success: true,
                data: student
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get students by class - Public
    router.get('/class/:classId', (req, res) => {
        try {
            const students = blockchainManager.getStudentsByClass(req.params.classId);
            res.json({
                success: true,
                data: students.map(student => ({
                    ...student,
                    id: student.studentId,
                    name: student.studentName
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get students by department - Public
    router.get('/department/:departmentId', (req, res) => {
        try {
            const students = blockchainManager.getStudentsByDepartment(req.params.departmentId);
            res.json({
                success: true,
                data: students.map(student => ({
                    ...student,
                    id: student.studentId,
                    name: student.studentName
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get students by assigned classes - For teachers with assigned classes
    router.post('/by-classes', requireAuth, (req, res) => {
        try {
            const { classIds } = req.body;
            
            if (!Array.isArray(classIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'classIds array is required'
                });
            }

            // Get all students enrolled in any of the specified classes
            const studentSet = new Map();
            
            for (const classId of classIds) {
                const students = blockchainManager.getStudentsByClass(classId);
                for (const student of students) {
                    if (!studentSet.has(student.studentId)) {
                        studentSet.set(student.studentId, {
                            ...student,
                            id: student.studentId,
                            name: student.studentName
                        });
                    }
                }
            }

            res.json({
                success: true,
                data: Array.from(studentSet.values())
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update student - Teacher can only update in their department
    router.put('/:studentId', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const student = blockchainManager.getStudent(req.params.studentId);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Check department access
            if (userRole.role !== 'admin' && userRole.departmentId !== student.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update students in your own department'
                });
            }

            const result = blockchainManager.updateStudent(req.params.studentId, req.body);
            blockchainManager.saveToFile();
            
            res.json({
                success: true,
                message: 'Student updated successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete student - Teacher can only delete in their department
    router.delete('/:studentId', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const student = blockchainManager.getStudent(req.params.studentId);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Check department access
            if (userRole.role !== 'admin' && userRole.departmentId !== student.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete students in your own department'
                });
            }

            const result = blockchainManager.deleteStudent(req.params.studentId, req.body.reason);
            blockchainManager.saveToFile();
            
            res.json({
                success: true,
                message: 'Student deleted successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Search students - Public
    router.get('/search/:searchTerm', (req, res) => {
        try {
            const results = blockchainManager.searchStudents(req.params.searchTerm);
            res.json({
                success: true,
                data: results.map(student => ({
                    ...student,
                    id: student.studentId,
                    name: student.studentName
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student blockchain - Public
    router.get('/:studentId/blockchain', (req, res) => {
        try {
            const blockchain = blockchainManager.getStudentBlockchain(req.params.studentId);
            res.json({
                success: true,
                data: {
                    student: {
                        ...blockchain,
                        id: blockchain.studentId,
                        name: blockchain.name
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student attendance summary - Public
    router.get('/:studentId/attendance/summary', (req, res) => {
        try {
            const attendance = blockchainManager.getStudentAttendance(req.params.studentId);
            res.json({
                success: true,
                data: attendance
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