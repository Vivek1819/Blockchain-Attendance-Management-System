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

module.exports = {
    getUserRole,
    assignRole,
    isAdmin,
    isTeacherForDepartment,
    hasCompletedOnboarding,
    loadRoles,
    saveRoles
};