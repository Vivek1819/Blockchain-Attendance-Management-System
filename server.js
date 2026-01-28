const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const BlockchainManager = require('./src/blockchain/BlockchainManager');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Blockchain Manager
const blockchainManager = new BlockchainManager();

// Load existing data if available
try {
    blockchainManager.loadFromFile();
} catch (error) {
    console.log('Starting with fresh blockchain data');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/departments', require('./src/api/departmentRoutes')(blockchainManager));
app.use('/api/classes', require('./src/api/classRoutes')(blockchainManager));
app.use('/api/students', require('./src/api/studentRoutes')(blockchainManager));
app.use('/api/attendance', require('./src/api/attendanceRoutes')(blockchainManager));
app.use('/api/system', require('./src/api/systemRoutes')(blockchainManager));
app.use('/api/auth', require('./src/api/authRoutes')(blockchainManager));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API documentation route
app.get('/api', (req, res) => {
    res.json({
        message: 'Blockchain-Based Attendance Management System API',
        version: '1.0.0',
        endpoints: {
            departments: {
                'POST /api/departments': 'Create a new department',
                'GET /api/departments': 'Get all departments',
                'GET /api/departments/:departmentId': 'Get department by ID',
                'PUT /api/departments/:departmentId': 'Update department',
                'DELETE /api/departments/:departmentId': 'Delete department (mark as deleted)',
                'GET /api/departments/search/:searchTerm': 'Search departments',
                'GET /api/departments/:departmentId/blockchain': 'Get department blockchain details'
            },
            classes: {
                'POST /api/classes': 'Create a new class',
                'GET /api/classes': 'Get all classes',
                'GET /api/classes/:classId': 'Get class by ID',
                'GET /api/classes/department/:departmentId': 'Get classes by department',
                'PUT /api/classes/:classId': 'Update class',
                'DELETE /api/classes/:classId': 'Delete class (mark as deleted)',
                'GET /api/classes/search/:searchTerm': 'Search classes',
                'GET /api/classes/:classId/blockchain': 'Get class blockchain details'
            },
            students: {
                'POST /api/students': 'Create a new student',
                'GET /api/students': 'Get all students',
                'GET /api/students/:studentId': 'Get student by ID',
                'GET /api/students/class/:classId': 'Get students by class',
                'GET /api/students/department/:departmentId': 'Get students by department',
                'PUT /api/students/:studentId': 'Update student',
                'DELETE /api/students/:studentId': 'Delete student (mark as deleted)',
                'GET /api/students/search/:searchTerm': 'Search students',
                'GET /api/students/:studentId/blockchain': 'Get student blockchain details',
                'GET /api/students/:studentId/attendance/summary': 'Get student attendance summary'
            },
            attendance: {
                'POST /api/attendance/mark': 'Mark attendance for a single student',
                'POST /api/attendance/mark/bulk': 'Mark attendance for multiple students',
                'GET /api/attendance/student/:studentId': 'Get attendance history for a student',
                'GET /api/attendance/class/:classId/date/:date': 'Get attendance for a class on a specific date',
                'GET /api/attendance/department/:departmentId/date/:date': 'Get attendance for a department on a specific date',
                'GET /api/attendance/class/:classId/today': 'Get today\'s attendance for a class',
                'GET /api/attendance/department/:departmentId/today': 'Get today\'s attendance for a department'
            },
            system: {
                'GET /api/system/validate': 'Validate entire blockchain hierarchy',
                'GET /api/system/stats': 'Get system statistics',
                'POST /api/system/save': 'Manually save data',
                'POST /api/system/load': 'Manually load data',
                'POST /api/system/initialize': 'Initialize system with sample data'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('  BLOCKCHAIN-BASED ATTENDANCE MANAGEMENT SYSTEM');
    console.log('='.repeat(60));
    console.log(`  Server running on: http://localhost:${PORT}`);
    console.log(`  API Documentation: http://localhost:${PORT}/api`);
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('  System Stats:');
    const stats = blockchainManager.getSystemStats();
    console.log(`  - Departments: ${stats.totalDepartments}`);
    console.log(`  - Classes: ${stats.totalClasses}`);
    console.log(`  - Students: ${stats.totalStudents}`);
    console.log(`  - Attendance Records: ${stats.totalAttendanceRecords}`);
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nSaving data before shutdown...');
    blockchainManager.saveToFile();
    console.log('Shutdown complete');
    process.exit(0);
});
