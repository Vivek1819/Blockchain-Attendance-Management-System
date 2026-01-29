const fs = require('fs');
const path = require('path');

const ROLES_FILE = path.join(__dirname, '../../data/user_roles.json');

/**
 * Load user roles from JSON file
 */
function loadRoles() {
    try {
        if (fs.existsSync(ROLES_FILE)) {
            const data = fs.readFileSync(ROLES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading roles:', error.message);
    }
    return {};
}

/**
 * Save user roles to JSON file
 */
function saveRoles(roles) {
    try {
        fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving roles:', error.message);
        return false;
    }
}

/**
 * Get a user's role and department
 */
function getUserRole(userId) {
    const roles = loadRoles();
    return roles[userId] || null;
}

/**
 * Assign role to a user
 */
function assignRole(userId, role, departmentId, name) {
    const roles = loadRoles();
    
    roles[userId] = {
        role: role,
        departmentId: departmentId,
        name: name,
        assignedAt: Date.now()
    };
    
    return saveRoles(roles);
}

/**
 * Check if user is an admin
 */
function isAdmin(userId) {
    const userRole = getUserRole(userId);
    return userRole && userRole.role === 'admin';
}

/**
 * Check if user is a teacher for a specific department
 */
function isTeacherForDepartment(userId, departmentId) {
    const userRole = getUserRole(userId);
    return userRole && 
           userRole.role === 'teacher' && 
           userRole.departmentId === departmentId;
}

/**
 * Check if user has completed onboarding
 */
function hasCompletedOnboarding(userId) {
    const userRole = getUserRole(userId);
    return userRole !== null;
}

/**
 * Get all teachers
 */
function getAllTeachers() {
    const roles = loadRoles();
    const teachers = [];
    
    for (const [userId, userData] of Object.entries(roles)) {
        if (userData.role === 'teacher') {
            teachers.push({
                userId,
                ...userData
            });
        }
    }
    
    return teachers;
}

/**
 * Assign classes to a teacher
 */
function assignClasses(teacherId, classIds) {
    const roles = loadRoles();
    
    if (!roles[teacherId]) {
        return false;
    }
    
    roles[teacherId].assignedClasses = classIds;
    return saveRoles(roles);
}

/**
 * Check if teacher has access to a specific class
 */
function hasClassAccess(userId, classId) {
    const userRole = getUserRole(userId);
    if (!userRole) return false;
    
    // Admins have access to all classes
    if (userRole.role === 'admin') return true;
    
    // Teachers need the class in their assignedClasses
    if (userRole.role === 'teacher') {
        const assignedClasses = userRole.assignedClasses || [];
        return assignedClasses.includes(classId);
    }
    
    return false;
}

/**
 * Get the teacher who owns a specific class (if any)
 * Returns { teacherId, teacherName } or null
 */
function getClassOwner(classId) {
    const roles = loadRoles();
    
    for (const [userId, userData] of Object.entries(roles)) {
        if (userData.role === 'teacher' && userData.assignedClasses) {
            if (userData.assignedClasses.includes(classId)) {
                return {
                    teacherId: userId,
                    teacherName: userData.name || 'Unknown'
                };
            }
        }
    }
    
    return null;
}

/**
 * Get all class->teacher assignments
 * Returns { classId: { teacherId, teacherName } }
 */
function getClassAssignments() {
    const roles = loadRoles();
    const assignments = {};
    
    for (const [userId, userData] of Object.entries(roles)) {
        if (userData.role === 'teacher' && userData.assignedClasses) {
            userData.assignedClasses.forEach(classId => {
                assignments[classId] = {
                    teacherId: userId,
                    teacherName: userData.name || 'Unknown'
                };
            });
        }
    }
    
    return assignments;
}

module.exports = {
    getUserRole,
    assignRole,
    isAdmin,
    isTeacherForDepartment,
    hasCompletedOnboarding,
    getAllTeachers,
    assignClasses,
    hasClassAccess,
    getClassOwner,
    getClassAssignments,
    loadRoles,
    saveRoles
};