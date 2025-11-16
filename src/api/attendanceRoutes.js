const express = require('express');
const router = express.Router();

/**
 * Attendance Routes
 */
module.exports = (blockchainManager) => {
    
    // Mark attendance for a single student
    router.post('/mark', (req, res) => {
        try {
            const { studentId, status, date, markedBy } = req.body;
            
            if (!studentId || !status || !date) {
                return res.status(400).json({
                    success: false,
                    message: 'studentId, status (Present/Absent/Leave), and date are required'
                });
            }

            const result = blockchainManager.markAttendance(studentId, status, date, markedBy || 'admin');
            blockchainManager.saveToFile();
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Mark attendance for multiple students (bulk)
    router.post('/mark/bulk', (req, res) => {
        try {
            const { attendanceRecords, date, markedBy } = req.body;
            
            if (!attendanceRecords || !Array.isArray(attendanceRecords) || !date) {
                return res.status(400).json({
                    success: false,
                    message: 'attendanceRecords (array) and date are required'
                });
            }

            const results = [];
            const errors = [];

            for (const record of attendanceRecords) {
                try {
                    const result = blockchainManager.markAttendance(
                        record.studentId, 
                        record.status, 
                        date, 
                        markedBy || 'admin'
                    );
                    results.push(result);
                } catch (error) {
                    errors.push({
                        studentId: record.studentId,
                        error: error.message
                    });
                }
            }

            blockchainManager.saveToFile();
            
            res.status(201).json({
                success: true,
                message: 'Bulk attendance marking completed',
                successCount: results.length,
                errorCount: errors.length,
                results,
                errors
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get attendance history for a student
    router.get('/student/:studentId', (req, res) => {
        try {
            const attendance = blockchainManager.getStudentAttendance(req.params.studentId);
            res.json({
                success: true,
                attendance
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get attendance for a class on a specific date
    router.get('/class/:classId/date/:date', (req, res) => {
        try {
            const attendance = blockchainManager.getClassAttendance(req.params.classId, req.params.date);
            res.json({
                success: true,
                classId: req.params.classId,
                date: req.params.date,
                count: attendance.length,
                attendance
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get attendance for a department on a specific date
    router.get('/department/:departmentId/date/:date', (req, res) => {
        try {
            const attendance = blockchainManager.getDepartmentAttendance(req.params.departmentId, req.params.date);
            res.json({
                success: true,
                departmentId: req.params.departmentId,
                date: req.params.date,
                count: attendance.length,
                attendance
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get today's attendance for a class
    router.get('/class/:classId/today', (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendance = blockchainManager.getClassAttendance(req.params.classId, today);
            res.json({
                success: true,
                classId: req.params.classId,
                date: today,
                count: attendance.length,
                attendance
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get today's attendance for a department
    router.get('/department/:departmentId/today', (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendance = blockchainManager.getDepartmentAttendance(req.params.departmentId, today);
            res.json({
                success: true,
                departmentId: req.params.departmentId,
                date: today,
                count: attendance.length,
                attendance
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
