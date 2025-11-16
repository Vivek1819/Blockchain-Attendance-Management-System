const express = require('express');
const router = express.Router();

/**
 * Class Routes
 */
module.exports = (blockchainManager) => {
    
    // Create a new class
    router.post('/', (req, res) => {
        try {
            const { classId, className, departmentId, additionalData } = req.body;
            
            if (!classId || !className || !departmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'classId, className, and departmentId are required'
                });
            }

            const result = blockchainManager.createClass(classId, className, departmentId, additionalData || {});
            blockchainManager.saveToFile();
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all classes
    router.get('/', (req, res) => {
        try {
            const classes = blockchainManager.getAllClasses();
            res.json({
                success: true,
                count: classes.length,
                classes
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get class by ID
    router.get('/:classId', (req, res) => {
        try {
            const classData = blockchainManager.getClass(req.params.classId);
            res.json({
                success: true,
                class: classData
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get classes by department
    router.get('/department/:departmentId', (req, res) => {
        try {
            const classes = blockchainManager.getClassesByDepartment(req.params.departmentId);
            res.json({
                success: true,
                count: classes.length,
                classes
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update class
    router.put('/:classId', (req, res) => {
        try {
            const { updatedData } = req.body;
            
            if (!updatedData) {
                return res.status(400).json({
                    success: false,
                    message: 'updatedData is required'
                });
            }

            const result = blockchainManager.updateClass(req.params.classId, updatedData);
            blockchainManager.saveToFile();
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete class (mark as deleted)
    router.delete('/:classId', (req, res) => {
        try {
            const { reason } = req.body;
            const result = blockchainManager.deleteClass(req.params.classId, reason || '');
            blockchainManager.saveToFile();
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Search classes
    router.get('/search/:searchTerm', (req, res) => {
        try {
            const results = blockchainManager.searchClasses(req.params.searchTerm);
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

    // Get class blockchain details
    router.get('/:classId/blockchain', (req, res) => {
        try {
            const cls = blockchainManager.classes.get(req.params.classId);
            if (!cls) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }

            res.json({
                success: true,
                blockchain: {
                    classId: cls.classId,
                    name: cls.name,
                    departmentId: cls.departmentId,
                    chainLength: cls.getChainLength(),
                    isValid: cls.isChainValid(),
                    parentDepartmentHash: cls.parentDepartmentHash,
                    blocks: cls.getAllBlocks()
                }
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
