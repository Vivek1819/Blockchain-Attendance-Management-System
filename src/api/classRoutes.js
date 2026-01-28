const express = require('express');
const { requireAuth } = require('../middleware/clerkAuth');
const userRoles = require('../auth/userRoles');

module.exports = function(blockchainManager) {
    const router = express.Router();

    // Create class - Teacher can only create in their department
    router.post('/', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const { classId, className, departmentId } = req.body;

            if (!userRole) {
                return res.status(403).json({
                    success: false,
                    message: 'Please complete onboarding first'
                });
            }

            // Admin can create in any department, teacher only in their own
            if (userRole.role !== 'admin' && userRole.departmentId !== departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only create classes in your own department'
                });
            }

            if (!classId || !className || !departmentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Class ID, name, and department ID are required'
                });
            }

            const result = blockchainManager.createClass(classId, className, departmentId, req.body);
            blockchainManager.saveToFile();
            
            res.status(201).json({
                success: true,
                message: 'Class created successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all classes - Authenticated users see their department, public sees all for blockchain
    router.get('/', (req, res) => {
        try {
            const classes = blockchainManager.getAllClasses();
            res.json({
                success: true,
                data: classes.map(cls => ({
                    ...cls,
                    id: cls.classId,
                    name: cls.className
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get all classes - Public
    router.get('/', (req, res) => {
        try {
            const classes = blockchainManager.getAllClasses();
            res.json({
                success: true,
                data: classes.map(cls => ({
                    ...cls,
                    id: cls.classId,
                    name: cls.className
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get class by ID - Public
    router.get('/:classId', (req, res) => {
        try {
            const classData = blockchainManager.getClass(req.params.classId);
            if (!classData) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }
            res.json({
                success: true,
                data: classData
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Get classes by department - Public
    router.get('/department/:departmentId', (req, res) => {
        try {
            const classes = blockchainManager.getClassesByDepartment(req.params.departmentId);
            res.json({
                success: true,
                data: classes.map(cls => ({
                    ...cls,
                    id: cls.classId,
                    name: cls.className
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });

    // Update class - Teacher can only update in their department
    router.put('/:classId', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const classData = blockchainManager.getClass(req.params.classId);

            if (!classData) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }

            // Check department access
            if (userRole.role !== 'admin' && userRole.departmentId !== classData.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update classes in your own department'
                });
            }

            const result = blockchainManager.updateClass(req.params.classId, req.body);
            blockchainManager.saveToFile();
            
            res.json({
                success: true,
                message: 'Class updated successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Delete class - Teacher can only delete in their department
    router.delete('/:classId', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            const classData = blockchainManager.getClass(req.params.classId);

            if (!classData) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }

            // Check department access
            if (userRole.role !== 'admin' && userRole.departmentId !== classData.departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete classes in your own department'
                });
            }

            const result = blockchainManager.deleteClass(req.params.classId, req.body.reason);
            blockchainManager.saveToFile();
            
            res.json({
                success: true,
                message: 'Class deleted successfully',
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    });

    // Search classes - Public
    router.get('/search/:searchTerm', (req, res) => {
        try {
            const results = blockchainManager.searchClasses(req.params.searchTerm);
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

    // Get class blockchain - Public
    router.get('/:classId/blockchain', (req, res) => {
        try {
            const blockchain = blockchainManager.getClassBlockchain(req.params.classId);
            res.json({
                success: true,
                data: {
                    class: {
                        ...blockchain,
                        id: blockchain.classId,
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