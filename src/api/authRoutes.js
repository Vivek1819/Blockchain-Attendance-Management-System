const express = require('express');
const { requireAuth } = require('../middleware/clerkAuth');
const userRoles = require('../auth/userRoles');

module.exports = function(blockchainManager) {
    const router = express.Router();

    /**
     * GET /api/auth/me
     * Get current user's role and department info
     */
    router.get('/me', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);

            if (!userRole) {
                return res.json({
                    success: true,
                    data: {
                        userId: userId,
                        onboarded: false,
                        message: 'User needs to complete onboarding'
                    }
                });
            }

            // Get department name if user is a teacher
            let departmentName = null;
            if (userRole.departmentId) {
                try {
                    const dept = blockchainManager.getDepartment(userRole.departmentId);
                    departmentName = dept ? dept.name : null;
                } catch (e) {
                    // Department might have been deleted but user role persists
                    departmentName = 'Unknown (Deleted?)';
                }
            }

            res.json({
                success: true,
                data: {
                    userId: userId,
                    onboarded: true,
                    role: userRole.role,
                    departmentId: userRole.departmentId,
                    departmentName: departmentName,
                    name: userRole.name,
                    assignedClasses: userRole.assignedClasses || [],
                    assignedAt: userRole.assignedAt
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user info',
                error: error.message
            });
        }
    });

    /**
     * GET /api/auth/departments
     * Get list of departments for onboarding dropdown
     * This is a public route for the onboarding form
     */
    router.get('/departments', (req, res) => {
        try {
            const departments = blockchainManager.getAllDepartments();
            res.json({
                success: true,
                data: departments.map(dept => ({
                    id: dept.departmentId,
                    name: dept.departmentName
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching departments',
                error: error.message
            });
        }
    });

    /**
     * POST /api/auth/onboard
     * Complete teacher onboarding - assign department
     */
    router.post('/onboard', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const { departmentId, name } = req.body;

            // Check if already onboarded
            if (userRoles.hasCompletedOnboarding(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'User already onboarded'
                });
            }

            // Validate department exists
            const department = blockchainManager.getDepartment(departmentId);
            if (!department) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid department ID'
                });
            }

            // Validate name
            if (!name || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid name'
                });
            }

            // Assign teacher role
            const success = userRoles.assignRole(userId, 'teacher', departmentId, name.trim());

            if (success) {
                res.json({
                    success: true,
                    message: 'Onboarding complete',
                    data: {
                        role: 'teacher',
                        departmentId: departmentId,
                        departmentName: department.name,
                        name: name.trim()
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to save role assignment'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error during onboarding',
                error: error.message
            });
        }
    });

    /**
     * GET /api/auth/teachers
     * Get list of all teachers (admin only)
     */
    router.get('/teachers', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            
            // Only admins can view teacher list
            if (!userRole || userRole.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }

            const teachers = userRoles.getAllTeachers();
            
            // Enrich with department names
            const enrichedTeachers = teachers.map(teacher => {
                let departmentName = null;
                if (teacher.departmentId) {
                    try {
                        const dept = blockchainManager.getDepartment(teacher.departmentId);
                        departmentName = dept ? dept.name : 'Unknown';
                    } catch (e) {
                        departmentName = 'Unknown';
                    }
                }
                return {
                    ...teacher,
                    departmentName
                };
            });

            res.json({
                success: true,
                data: enrichedTeachers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching teachers',
                error: error.message
            });
        }
    });

    /**
     * POST /api/auth/assign-classes
     * Assign classes to a teacher (admin only)
     */
    router.post('/assign-classes', requireAuth, (req, res) => {
        try {
            const userId = req.auth.userId;
            const userRole = userRoles.getUserRole(userId);
            
            // Only admins can assign classes
            if (!userRole || userRole.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }

            const { teacherId, classIds } = req.body;

            if (!teacherId || !Array.isArray(classIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'teacherId and classIds array required'
                });
            }

            // Verify teacher exists
            const teacherRole = userRoles.getUserRole(teacherId);
            if (!teacherRole || teacherRole.role !== 'teacher') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid teacher ID'
                });
            }

            // Validate all class IDs exist
            for (const classId of classIds) {
                const cls = blockchainManager.getClass(classId);
                if (!cls) {
                    return res.status(400).json({
                        success: false,
                        message: `Class ${classId} not found`
                    });
                }
            }

            // Check if any class is already assigned to a DIFFERENT teacher
            for (const classId of classIds) {
                const owner = userRoles.getClassOwner(classId);
                if (owner && owner.teacherId !== teacherId) {
                    return res.status(400).json({
                        success: false,
                        message: `Class ${classId} is already assigned to ${owner.teacherName}. Please unassign it first.`
                    });
                }
            }

            // Assign classes
            const success = userRoles.assignClasses(teacherId, classIds);

            if (success) {
                res.json({
                    success: true,
                    message: 'Classes assigned successfully',
                    data: {
                        teacherId,
                        assignedClasses: classIds
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to assign classes'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error assigning classes',
                error: error.message
            });
        }
    });

    return router;
};