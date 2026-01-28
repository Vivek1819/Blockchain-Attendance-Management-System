const express = require('express');
const router = express.Router();

/**
 * System Routes - Validation, Stats, etc.
 */
module.exports = (blockchainManager) => {
    
    // Validate entire blockchain hierarchy
    router.get('/validate', (req, res) => {
        try {
            const validation = blockchainManager.validateAllChains();
            res.json({
                success: true,
                data: validation
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get system statistics
    router.get('/stats', (req, res) => {
        try {
            const stats = blockchainManager.getSystemStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Manually save data
    router.post('/save', (req, res) => {
        try {
            blockchainManager.saveToFile();
            res.json({
                success: true,
                message: 'Data saved successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Manually load data
    router.post('/load', (req, res) => {
        try {
            blockchainManager.loadFromFile();
            res.json({
                success: true,
                message: 'Data loaded successfully',
                stats: blockchainManager.getSystemStats()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Initialize with sample data
    router.post('/initialize', (req, res) => {
        try {
            // Create 2 departments
            const dept1 = blockchainManager.createDepartment('DEPT001', 'School of Computing', {
                description: 'Computer Science and related programs'
            });

            const dept2 = blockchainManager.createDepartment('DEPT002', 'School of Software Engineering', {
                description: 'Software Engineering programs'
            });

            // Create 5 classes per department
            const classes = [];
            for (let i = 1; i <= 5; i++) {
                classes.push(blockchainManager.createClass(
                    `CS-CLASS-${i}`,
                    `CS Year ${i}`,
                    'DEPT001',
                    { year: i }
                ));

                classes.push(blockchainManager.createClass(
                    `SE-CLASS-${i}`,
                    `SE Year ${i}`,
                    'DEPT002',
                    { year: i }
                ));
            }

            // Create 35 students per class
            let studentCount = 0;
            for (const classInfo of classes) {
                for (let i = 1; i <= 35; i++) {
                    studentCount++;
                    const rollNumber = `${classInfo.classId}-${String(i).padStart(3, '0')}`;
                    blockchainManager.createStudent(
                        `STUDENT-${studentCount}`,
                        `Student ${studentCount}`,
                        rollNumber,
                        classInfo.classId,
                        classInfo.departmentId,
                        { email: `student${studentCount}@university.edu` }
                    );
                }
            }

            blockchainManager.saveToFile();

            res.json({
                success: true,
                message: 'System initialized with sample data',
                stats: blockchainManager.getSystemStats()
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    return router;
};
