const express = require('express');
const { requireAuth } = require('../middleware/clerkAuth');
const userRoles = require('../auth/userRoles');

module.exports = function(blockchainManager) {
    const router = express.Router();

    // Create department - Admin only
    router.post('/', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            
            // Check if user is admin
            if (!userRoles.isAdmin(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can create departments'
                });
            }

            const { departmentId, departmentName } = req.body;
            
            if (!departmentId || !departmentName) {
                return res.status(400).json({
                    success: false,
                    message: 'Department ID and name are required'
                });
            }

            const result = blockchainManager.createDepartment(departmentId, departmentName, req.body);
            res.status(201).json({
                success: true,
                message: 'Department created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all departments - Public (for blockchain integrity)
    router.get('/', (req, res) => {
        try {
            const departments = blockchainManager.getAllDepartments();
            res.json({
                success: true,
                data: departments.map(dept => ({
                    ...dept,
                    id: dept.departmentId,
                    name: dept.departmentName
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get department by ID - Public
    router.get('/:departmentId', (req, res) => {
        try {
            const department = blockchainManager.getDepartment(req.params.departmentId);
            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }
            res.json({
                success: true,
                data: department
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update department - Admin only
    router.put('/:departmentId', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            
            if (!userRoles.isAdmin(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can update departments'
                });
            }

            const result = blockchainManager.updateDepartment(req.params.departmentId, req.body);
            res.json({
                success: true,
                message: 'Department updated successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete department - Admin only
    router.delete('/:departmentId', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            
            if (!userRoles.isAdmin(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only administrators can delete departments'
                });
            }

            const result = blockchainManager.deleteDepartment(req.params.departmentId, req.body.reason);
            res.json({
                success: true,
                message: 'Department deleted successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Search departments - Public
    router.get('/search/:searchTerm', (req, res) => {
        try {
            const results = blockchainManager.searchDepartments(req.params.searchTerm);
            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get department blockchain - Public (for integrity verification)
    router.get('/:departmentId/blockchain', (req, res) => {
        try {
            const blockchain = blockchainManager.getDepartmentBlockchain(req.params.departmentId);
            res.json({
                success: true,
                data: {
                    department: {
                        ...blockchain,
                        id: blockchain.departmentId,
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

    return router;
};