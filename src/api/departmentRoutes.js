const express = require('express');
const router = express.Router();

/**
 * Department Routes
 */
module.exports = (blockchainManager) => {
    
    // Create a new department
    router.post('/', (req, res) => {
        try {
            const { departmentId, departmentName, additionalData } = req.body;
            
            if (!departmentId || !departmentName) {
                return res.status(400).json({
                    success: false,
                    message: 'departmentId and departmentName are required'
                });
            }

            const result = blockchainManager.createDepartment(departmentId, departmentName, additionalData || {});
            blockchainManager.saveToFile();
            
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all departments
    router.get('/', (req, res) => {
        try {
            const departments = blockchainManager.getAllDepartments();
            res.json({
                success: true,
                count: departments.length,
                departments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get department by ID
    router.get('/:departmentId', (req, res) => {
        try {
            const department = blockchainManager.getDepartment(req.params.departmentId);
            res.json({
                success: true,
                department
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update department
    router.put('/:departmentId', (req, res) => {
        try {
            const { updatedData } = req.body;
            
            if (!updatedData) {
                return res.status(400).json({
                    success: false,
                    message: 'updatedData is required'
                });
            }

            const result = blockchainManager.updateDepartment(req.params.departmentId, updatedData);
            blockchainManager.saveToFile();
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete department (mark as deleted)
    router.delete('/:departmentId', (req, res) => {
        try {
            const { reason } = req.body;
            const result = blockchainManager.deleteDepartment(req.params.departmentId, reason || '');
            blockchainManager.saveToFile();
            
            res.json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Search departments
    router.get('/search/:searchTerm', (req, res) => {
        try {
            const results = blockchainManager.searchDepartments(req.params.searchTerm);
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

    // Get department blockchain details
    router.get('/:departmentId/blockchain', (req, res) => {
        try {
            const dept = blockchainManager.departments.get(req.params.departmentId);
            if (!dept) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }

            res.json({
                success: true,
                blockchain: {
                    departmentId: dept.departmentId,
                    name: dept.name,
                    chainLength: dept.getChainLength(),
                    isValid: dept.isChainValid(),
                    blocks: dept.getAllBlocks()
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
