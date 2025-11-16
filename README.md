# 🔗 Blockchain-Based Attendance Management System (BAMS)

A comprehensive multi-layered blockchain system for managing attendance with hierarchical blockchain structure: Department → Class → Student.

## 📋 Overview

This project implements an advanced blockchain-based attendance management system with **three hierarchical layers**:

1. **Layer 1 - Department Blockchain**: Independent chains for each department
2. **Layer 2 - Class Blockchain**: Child chains linked to department chains
3. **Layer 3 - Student Blockchain**: Personal chains for each student, linked to class chains

Each layer is cryptographically linked through hash references, ensuring data integrity across the entire hierarchy.

## ✨ Features

### Core Blockchain Features
- ✅ **SHA-256 Hashing**: Secure cryptographic hashing for all blocks
- ✅ **Proof of Work (PoW)**: Mining with difficulty level (4 leading zeros)
- ✅ **Chain Validation**: Multi-level validation across all hierarchies
- ✅ **Immutability**: No blocks can be deleted or modified
- ✅ **Parent-Child Linking**: Genesis blocks reference parent chain hashes

### CRUD Operations
- ✅ **Departments**: Create, Read, Update (via new blocks), Delete (mark as deleted)
- ✅ **Classes**: Full CRUD with automatic parent chain linking
- ✅ **Students**: Full CRUD with personal blockchain for each student
- ✅ **Attendance**: Mark attendance (Present/Absent/Leave) as blockchain transactions

### Advanced Features
- ✅ **Search Functionality**: Search departments, classes, and students
- ✅ **Blockchain Explorer**: View complete blockchain with all blocks
- ✅ **Attendance History**: View student attendance records in blockchain format
- ✅ **Bulk Attendance**: Mark attendance for multiple students at once
- ✅ **Data Persistence**: Save/load blockchain data to JSON files
- ✅ **Real-time Validation**: Validate entire blockchain hierarchy

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     Department Blockchain (L1)      │
│   Independent - Genesis: prev_hash=0 │
└───────────────┬─────────────────────┘
                │
                ├── Dept Hash used as prev_hash
                ↓
┌─────────────────────────────────────┐
│      Class Blockchain (L2)          │
│  Genesis: prev_hash=dept_latest_hash│
└───────────────┬─────────────────────┘
                │
                ├── Class Hash used as prev_hash
                ↓
┌─────────────────────────────────────┐
│     Student Blockchain (L3)         │
│ Genesis: prev_hash=class_latest_hash│
│  Attendance blocks attach here      │
└─────────────────────────────────────┘
```

## 📁 Project Structure

```
Assignment3/
├── server.js                      # Express server entry point
├── package.json                   # Dependencies
├── src/
│   ├── blockchain/
│   │   ├── Block.js              # Core block structure
│   │   ├── BaseBlockchain.js     # Base blockchain functionality
│   │   ├── DepartmentChain.js    # Layer 1 - Department blockchain
│   │   ├── ClassChain.js         # Layer 2 - Class blockchain
│   │   ├── StudentChain.js       # Layer 3 - Student blockchain
│   │   └── BlockchainManager.js  # Central management system
│   └── api/
│       ├── departmentRoutes.js   # Department API endpoints
│       ├── classRoutes.js        # Class API endpoints
│       ├── studentRoutes.js      # Student API endpoints
│       ├── attendanceRoutes.js   # Attendance API endpoints
│       └── systemRoutes.js       # System utilities
├── public/
│   ├── index.html                # Frontend UI
│   └── app.js                    # Frontend JavaScript
└── data/
    └── blockchain_data.json      # Persisted blockchain data
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Navigate to the project directory**:
```powershell
cd "d:\BSSE Notes\Blockchain\Assignment3"
```

2. **Install dependencies** (already done):
```powershell
npm install
```

3. **Start the server**:
```powershell
npm start
```

4. **Open your browser**:
Navigate to `http://localhost:3000`

## 🎯 Usage Guide

### Quick Start with Sample Data

1. Open the Dashboard tab
2. Click "Initialize Sample Data" button
3. This creates:
   - 2 Departments (School of Computing, School of Software Engineering)
   - 10 Classes (5 per department)
   - 350 Students (35 per class)

### Manual Operations

#### Creating a Department
1. Go to **Departments** tab
2. Enter Department ID (e.g., `DEPT001`)
3. Enter Department Name (e.g., `School of Computing`)
4. Click "Create Department"

#### Creating a Class
1. Go to **Classes** tab
2. Enter Class ID (e.g., `CS-CLASS-1`)
3. Enter Class Name (e.g., `CS Year 1`)
4. Select Parent Department
5. Click "Create Class"

#### Creating a Student
1. Go to **Students** tab
2. Enter Student ID, Name, and Roll Number
3. Select Department and Class
4. Click "Create Student"

#### Marking Attendance
1. Go to **Attendance** tab
2. Select a Class
3. Select Date
4. Click Present/Absent/Leave buttons for each student

### Viewing Blockchain

1. Go to **Blockchain** tab
2. Select Type (Department/Class/Student)
3. Select specific entity
4. Click "View Blockchain"
5. View all blocks with hashes, nonces, and transactions

### Validating Blockchain

1. Go to **Validation** tab
2. Click "Validate All Chains"
3. View validation results for all chains

## 🔌 API Endpoints

### Departments
- `POST /api/departments` - Create department
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get specific department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department (mark as deleted)
- `GET /api/departments/:id/blockchain` - View department blockchain

### Classes
- `POST /api/classes` - Create class
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get specific class
- `GET /api/classes/department/:deptId` - Get classes by department
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `GET /api/classes/:id/blockchain` - View class blockchain

### Students
- `POST /api/students` - Create student
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get specific student
- `GET /api/students/class/:classId` - Get students by class
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/blockchain` - View student blockchain
- `GET /api/students/:id/attendance/summary` - Get attendance summary

### Attendance
- `POST /api/attendance/mark` - Mark attendance for single student
- `POST /api/attendance/mark/bulk` - Mark attendance for multiple students
- `GET /api/attendance/student/:id` - Get student attendance history
- `GET /api/attendance/class/:classId/date/:date` - Get class attendance for date
- `GET /api/attendance/class/:classId/today` - Get today's class attendance

### System
- `GET /api/system/stats` - Get system statistics
- `GET /api/system/validate` - Validate all blockchains
- `POST /api/system/initialize` - Initialize with sample data
- `POST /api/system/save` - Save data to file
- `POST /api/system/load` - Load data from file

## 🔐 Blockchain Implementation Details

### Block Structure
```javascript
{
  index: Number,           // Block number
  timestamp: Number,       // Creation time
  transactions: Object,    // Transaction data
  prev_hash: String,       // Previous block hash
  nonce: Number,          // Proof of Work nonce
  hash: String            // SHA-256 hash of block
}
```

### Hashing Algorithm
- Uses Node.js built-in `crypto` module
- SHA-256 hashing
- Includes: index + timestamp + transactions + prev_hash + nonce

### Proof of Work
- Difficulty: 4 (hash must start with "0000")
- Continuously increments nonce until valid hash found
- Demonstrates computational work like real blockchains

### Immutability
- No blocks can be deleted or modified
- Updates/Deletes create new blocks with updated status
- Historical records always preserved

### Parent-Child Linking
- Class genesis block: `prev_hash = department.latestHash`
- Student genesis block: `prev_hash = class.latestHash`
- Altering parent invalidates all children

## 📊 Validation

The system validates:
1. ✅ Each block's hash is correctly calculated
2. ✅ Each block's prev_hash matches previous block's hash
3. ✅ PoW is satisfied (hash starts with "0000")
4. ✅ Class chains link to correct department hash
5. ✅ Student chains link to correct class hash
6. ✅ All attendance blocks are valid

## 💾 Data Persistence

- Data automatically saved to `data/blockchain_data.json`
- Saved on every create/update/delete operation
- Auto-save on server shutdown (CTRL+C)
- Manual save/load available via Dashboard

## 🛠️ Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Blockchain**: Custom implementation (no external libraries)
- **Hashing**: Node.js Crypto (SHA-256)
- **Storage**: JSON file system

## 📝 Key Concepts Demonstrated

1. **Multi-Layer Blockchain**: 3-tier hierarchical structure
2. **Cryptographic Linking**: Parent-child hash relationships
3. **Proof of Work**: Mining with difficulty target
4. **Chain Validation**: Multi-level integrity checking
5. **Immutability**: Blockchain principles in practice
6. **CRUD via Blockchain**: Updates without modifying history
7. **REST API**: Complete backend API
8. **Single Page Application**: Modern frontend architecture

## 🎓 Assignment Requirements Met

✅ Node.js Backend (mandatory)
✅ Custom blockchain logic (no external libraries)
✅ Three hierarchical blockchain layers
✅ Department → Class → Student linking via hashes
✅ Full CRUD for departments, classes, students
✅ No block deletion (blockchain immutability)
✅ Updates/deletes via new blocks
✅ Attendance marking (Present/Absent/Leave)
✅ SHA-256 hashing
✅ Proof of Work implementation
✅ Multi-level chain validation
✅ Search functionality
✅ Blockchain viewer
✅ Data persistence

## 🐛 Troubleshooting

**Server won't start**:
- Check if port 3000 is available
- Run `npm install` to ensure dependencies are installed

**Data not persisting**:
- Check if `data` folder exists
- Verify write permissions
- Use "Save Data" button in Dashboard

**Blockchain validation fails**:
- Check if data was tampered with
- Re-initialize with fresh data
- Validate individual chains in Blockchain tab

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Author

Created for Blockchain Assignment 3 - Advanced Multi-Layered Blockchain System

---

**Note**: This is a educational implementation. Production blockchain systems would require additional security measures, consensus mechanisms, and distributed architecture.
