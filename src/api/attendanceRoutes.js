const express = require('express');
const { requireAuth } = require('../middleware/clerkAuth');
const userRoles = require('../auth/userRoles');

module.exports = function(blockchainManager) {
    const router = express.Router();

    // Mark attendance - Teacher can only mark for their department
    router.post('/mark', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const { studentId, status, date } = req.body;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Please complete onboarding first'
                });
            }

            // Get student to check department
            const student = blockchainManager.getStudent(studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Check department access (admin can mark for any, teacher only for their dept)
            if (userRole.role !== 'admin' && userRole.departmentId !== student.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only mark attendance for students in your department'
                });
            }

            if (!studentId || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID and status are required'
                });
            }

            // Use teacher's name as "markedBy" - this goes into the blockchain!
            const markedBy = userRole.name || 'Unknown Teacher';
            const attendanceDate = date || new Date().toISOString().split('T')[0];

            const result = blockchainManager.markAttendance(studentId, status, attendanceDate, markedBy);
            blockchainManager.saveToFile();
            
            res.status(201).json({
                success: true,
                message: 'Attendance marked successfully',
                data: {
                    ...result,
                    markedBy: markedBy
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Bulk mark attendance - Teacher can only mark for their department
    router.post('/mark/bulk', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const { attendanceRecords, date } = req.body;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Please complete onboarding first'
                });
            }

            if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Attendance records array is required'
                });
            }

            const markedBy = userRole.name || 'Unknown Teacher';
            const attendanceDate = date || new Date().toISOString().split('T')[0];
            const results = [];
            const errors = [];

            for (const record of attendanceRecords) {
                try {
                    const student = blockchainManager.getStudent(record.studentId);
                    
                    if (!student) {
                        errors.push({ studentId: record.studentId, error: 'Student not found' });
                        continue;
                    }

                    // Check department access for each student
                    if (userRole.role !== 'admin' && userRole.departmentId !== student.departmentId) {
                        errors.push({ 
                            studentId: record.studentId, 
                            error: 'Not authorized for this student\'s department' 
                        });
                        continue;
                    }

                    const result = blockchainManager.markAttendance(
                        record.studentId, 
                        record.status, 
                        attendanceDate, 
                        markedBy
                    );
                    results.push({ ...result, markedBy });
                } catch (error) {
                    errors.push({ studentId: record.studentId, error: error.message });
                }
            }

            blockchainManager.saveToFile();

            res.json({
                success: true,
                message: `Marked ${results.length} attendance records`,
                data: {
                    successful: results,
                    failed: errors,
                    markedBy: markedBy
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get student attendance - Public (for blockchain transparency)
    router.get('/student/:studentId', (req, res) => {
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

    // Get class attendance for a date - Public
    router.get('/class/:classId/date/:date', (req, res) => {
        try {
            const attendance = blockchainManager.getClassAttendance(
                req.params.classId, 
                req.params.date
            );
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

    // Get department attendance for a date - Public
    router.get('/department/:departmentId/date/:date', (req, res) => {
        try {
            const attendance = blockchainManager.getDepartmentAttendance(
                req.params.departmentId, 
                req.params.date
            );
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

    // Get today's attendance for a class - Public
    router.get('/class/:classId/today', (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendance = blockchainManager.getClassAttendance(req.params.classId, today);
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

    // Get today's attendance for a department - Public
    router.get('/department/:departmentId/today', (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendance = blockchainManager.getDepartmentAttendance(req.params.departmentId, today);
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