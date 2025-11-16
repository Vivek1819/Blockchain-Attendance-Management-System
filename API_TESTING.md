# 🧪 API Testing Guide

This document provides examples for testing all API endpoints using curl, Postman, or your browser.

## Base URL
```
http://localhost:3000/api
```

## 🏢 Department Endpoints

### 1. Create Department
```bash
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "DEPT003",
    "departmentName": "School of Engineering",
    "additionalData": {
      "description": "Engineering programs",
      "head": "Dr. Smith"
    }
  }'
```

### 2. Get All Departments
```bash
curl http://localhost:3000/api/departments
```

### 3. Get Department by ID
```bash
curl http://localhost:3000/api/departments/DEPT001
```

### 4. Update Department
```bash
curl -X PUT http://localhost:3000/api/departments/DEPT001 \
  -H "Content-Type: application/json" \
  -d '{
    "updatedData": {
      "name": "School of Advanced Computing",
      "description": "Updated description"
    }
  }'
```

### 5. Delete Department
```bash
curl -X DELETE http://localhost:3000/api/departments/DEPT003 \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Department merged with another"
  }'
```

### 6. Search Departments
```bash
curl http://localhost:3000/api/departments/search/Computing
```

### 7. View Department Blockchain
```bash
curl http://localhost:3000/api/departments/DEPT001/blockchain
```

## 📚 Class Endpoints

### 1. Create Class
```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "CS-102",
    "className": "Computer Science Year 2",
    "departmentId": "DEPT001",
    "additionalData": {
      "year": 2,
      "semester": "Fall"
    }
  }'
```

### 2. Get All Classes
```bash
curl http://localhost:3000/api/classes
```

### 3. Get Class by ID
```bash
curl http://localhost:3000/api/classes/CS-101
```

### 4. Get Classes by Department
```bash
curl http://localhost:3000/api/classes/department/DEPT001
```

### 5. Update Class
```bash
curl -X PUT http://localhost:3000/api/classes/CS-101 \
  -H "Content-Type: application/json" \
  -d '{
    "updatedData": {
      "name": "CS Year 1 - Updated",
      "semester": "Spring"
    }
  }'
```

### 6. Delete Class
```bash
curl -X DELETE http://localhost:3000/api/classes/CS-102 \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Class cancelled"
  }'
```

### 7. Search Classes
```bash
curl http://localhost:3000/api/classes/search/Computer
```

### 8. View Class Blockchain
```bash
curl http://localhost:3000/api/classes/CS-101/blockchain
```

## 👥 Student Endpoints

### 1. Create Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU003",
    "studentName": "Charlie Brown",
    "rollNumber": "CS-003",
    "classId": "CS-101",
    "departmentId": "DEPT001",
    "additionalData": {
      "email": "charlie@university.edu",
      "phone": "123-456-7890"
    }
  }'
```

### 2. Get All Students
```bash
curl http://localhost:3000/api/students
```

### 3. Get Student by ID
```bash
curl http://localhost:3000/api/students/STU001
```

### 4. Get Students by Class
```bash
curl http://localhost:3000/api/students/class/CS-101
```

### 5. Get Students by Department
```bash
curl http://localhost:3000/api/students/department/DEPT001
```

### 6. Update Student
```bash
curl -X PUT http://localhost:3000/api/students/STU001 \
  -H "Content-Type: application/json" \
  -d '{
    "updatedData": {
      "name": "Alice J. Johnson",
      "email": "alice.johnson@university.edu"
    }
  }'
```

### 7. Delete Student
```bash
curl -X DELETE http://localhost:3000/api/students/STU003 \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Student transferred"
  }'
```

### 8. Search Students
```bash
curl http://localhost:3000/api/students/search/Alice
```

### 9. View Student Blockchain
```bash
curl http://localhost:3000/api/students/STU001/blockchain
```

### 10. Get Student Attendance Summary
```bash
curl http://localhost:3000/api/students/STU001/attendance/summary
```

## ✅ Attendance Endpoints

### 1. Mark Single Attendance
```bash
curl -X POST http://localhost:3000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STU001",
    "status": "Present",
    "date": "2025-11-16",
    "markedBy": "Professor Smith"
  }'
```

### 2. Mark Bulk Attendance
```bash
curl -X POST http://localhost:3000/api/attendance/mark/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-11-16",
    "markedBy": "admin",
    "attendanceRecords": [
      {"studentId": "STU001", "status": "Present"},
      {"studentId": "STU002", "status": "Absent"}
    ]
  }'
```

### 3. Get Student Attendance History
```bash
curl http://localhost:3000/api/attendance/student/STU001
```

### 4. Get Class Attendance for Date
```bash
curl http://localhost:3000/api/attendance/class/CS-101/date/2025-11-16
```

### 5. Get Department Attendance for Date
```bash
curl http://localhost:3000/api/attendance/department/DEPT001/date/2025-11-16
```

### 6. Get Today's Class Attendance
```bash
curl http://localhost:3000/api/attendance/class/CS-101/today
```

### 7. Get Today's Department Attendance
```bash
curl http://localhost:3000/api/attendance/department/DEPT001/today
```

## 🔧 System Endpoints

### 1. Validate All Blockchains
```bash
curl http://localhost:3000/api/system/validate
```

### 2. Get System Statistics
```bash
curl http://localhost:3000/api/system/stats
```

### 3. Save Data
```bash
curl -X POST http://localhost:3000/api/system/save
```

### 4. Load Data
```bash
curl -X POST http://localhost:3000/api/system/load
```

### 5. Initialize Sample Data
```bash
curl -X POST http://localhost:3000/api/system/initialize
```

## 📋 PowerShell Examples

If you're using PowerShell (Windows), use these commands instead:

### Create Department (PowerShell)
```powershell
$body = @{
    departmentId = "DEPT003"
    departmentName = "School of Engineering"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/departments" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### Get All Departments (PowerShell)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/departments"
```

### Mark Attendance (PowerShell)
```powershell
$body = @{
    studentId = "STU001"
    status = "Present"
    date = "2025-11-16"
    markedBy = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/attendance/mark" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## 🌐 Using the Web Interface

Simply open your browser and navigate to:
```
http://localhost:3000
```

The web interface provides a user-friendly way to:
- 📊 View system dashboard and statistics
- 🏢 Manage departments (create, view, search, delete)
- 📚 Manage classes (create, view, search, delete)
- 👥 Manage students (create, view, search, delete)
- ✅ Mark attendance (single or bulk)
- ⛓️ View blockchain structures
- 🔍 Validate all chains

## 📝 Response Examples

### Successful Create Response
```json
{
  "success": true,
  "departmentId": "DEPT003",
  "departmentName": "School of Engineering",
  "latestHash": "0000fb07c431a5c35c47cca910f6e173e81331f44b426318..."
}
```

### Error Response
```json
{
  "success": false,
  "message": "Department with ID DEPT003 already exists"
}
```

### Validation Response
```json
{
  "success": true,
  "validation": {
    "isValid": true,
    "departments": {
      "DEPT001": true,
      "DEPT002": true
    },
    "classes": {
      "CS-101": true,
      "SE-101": true
    },
    "students": {
      "STU001": true,
      "STU002": true
    },
    "errors": []
  }
}
```

## 🧪 Testing Workflow

### Complete Test Sequence

1. **Initialize System**
   ```bash
   curl -X POST http://localhost:3000/api/system/initialize
   ```

2. **View Statistics**
   ```bash
   curl http://localhost:3000/api/system/stats
   ```

3. **Get a Class**
   ```bash
   curl http://localhost:3000/api/classes/CS-CLASS-1
   ```

4. **Get Students in Class**
   ```bash
   curl http://localhost:3000/api/students/class/CS-CLASS-1
   ```

5. **Mark Attendance for a Student**
   ```bash
   curl -X POST http://localhost:3000/api/attendance/mark \
     -H "Content-Type: application/json" \
     -d '{
       "studentId": "STUDENT-1",
       "status": "Present",
       "date": "2025-11-16"
     }'
   ```

6. **View Student's Attendance**
   ```bash
   curl http://localhost:3000/api/attendance/student/STUDENT-1
   ```

7. **View Student's Blockchain**
   ```bash
   curl http://localhost:3000/api/students/STUDENT-1/blockchain
   ```

8. **Validate Everything**
   ```bash
   curl http://localhost:3000/api/system/validate
   ```

## 🔍 Blockchain Verification

To verify the hierarchical blockchain structure:

1. **Get Department Chain**
   ```bash
   curl http://localhost:3000/api/departments/DEPT001/blockchain
   ```
   Note the `latestHash` from the last block.

2. **Get Class Chain**
   ```bash
   curl http://localhost:3000/api/classes/CS-CLASS-1/blockchain
   ```
   Verify that the genesis block's `prev_hash` matches the department's `latestHash`.

3. **Get Student Chain**
   ```bash
   curl http://localhost:3000/api/students/STUDENT-1/blockchain
   ```
   Verify that the genesis block's `prev_hash` matches the class's `latestHash`.

This confirms the hierarchical linking: Department → Class → Student

## 💡 Tips

- All hashes start with "0000" due to Proof of Work
- Attendance status must be: "Present", "Absent", or "Leave"
- Dates should be in ISO format: "YYYY-MM-DD"
- Updates and deletes create new blocks (no data is actually removed)
- The blockchain automatically saves after each operation
- Use the validation endpoint to check integrity

---

**Need help?** Check the full API documentation at `http://localhost:3000/api`
