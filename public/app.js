// API Base URL
// Version: 3.0 - Added UPDATE operations for Departments, Classes, and Students (CRUD complete)
const API_BASE = 'http://localhost:3000/api';

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Load data for the tab
    switch(tabName) {
        case 'dashboard':
            loadStats();
            break;
        case 'departments':
            loadDepartments();
            loadDepartmentsForUpdate();
            break;
        case 'classes':
            loadClasses();
            loadDepartmentsForSelect();
            loadClassesForUpdate();
            break;
        case 'students':
            loadStudents();
            loadDepartmentsForSelect();
            loadStudentsForUpdate();
            break;
        case 'attendance':
            loadClassesForAttendance();
            setTodayDate();
            break;
        case 'blockchain':
            // Blockchain viewer is loaded on demand
            break;
        case 'validation':
            // Validation is run on demand
            break;
    }
}

// Message display
function showMessage(elementId, message, type = 'success') {
    const msgElement = document.getElementById(elementId);
    msgElement.textContent = message;
    msgElement.className = `message ${type} show`;
    setTimeout(() => {
        msgElement.classList.remove('show');
    }, 5000);
}

// ==================== DASHBOARD ====================

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/system/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('stat-departments').textContent = data.stats.totalDepartments;
            document.getElementById('stat-classes').textContent = data.stats.totalClasses;
            document.getElementById('stat-students').textContent = data.stats.totalStudents;
            document.getElementById('stat-attendance').textContent = data.stats.totalAttendanceRecords;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function initializeSystem() {
    if (!confirm('This will create sample data (2 departments, 10 classes, 350 students). Continue?')) {
        return;
    }

    try {
        showMessage('dashboard-message', 'Initializing system... This may take a few moments.', 'success');
        const response = await fetch(`${API_BASE}/system/initialize`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('dashboard-message', data.message, 'success');
        } else {
            showMessage('dashboard-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('dashboard-message', 'Error: ' + error.message, 'error');
    }
}

async function saveData() {
    try {
        const response = await fetch(`${API_BASE}/system/save`, {
            method: 'POST'
        });
        const data = await response.json();
        showMessage('dashboard-message', data.message, data.success ? 'success' : 'error');
    } catch (error) {
        showMessage('dashboard-message', 'Error: ' + error.message, 'error');
    }
}

async function loadData() {
    try {
        const response = await fetch(`${API_BASE}/system/load`, {
            method: 'POST'
        });
        const data = await response.json();
        showMessage('dashboard-message', data.message, data.success ? 'success' : 'error');
    } catch (error) {
        showMessage('dashboard-message', 'Error: ' + error.message, 'error');
    }
}

// ==================== DEPARTMENTS ====================

async function createDepartment() {
    const departmentId = document.getElementById('dept-id').value;
    const departmentName = document.getElementById('dept-name').value;

    if (!departmentId || !departmentName) {
        showMessage('dept-message', 'Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departmentId, departmentName })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('dept-message', 'Department created successfully!', 'success');
            document.getElementById('dept-id').value = '';
            document.getElementById('dept-name').value = '';
            loadDepartments();
        } else {
            showMessage('dept-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('dept-message', 'Error: ' + error.message, 'error');
    }
}

async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        const data = await response.json();
        
        const container = document.getElementById('dept-list');
        if (data.success && data.departments.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            data.departments.forEach(dept => {
                html += `
                    <tr>
                        <td>${dept.departmentId}</td>
                        <td>${dept.departmentName}</td>
                        <td><span style="color: ${dept.status === 'active' ? 'green' : 'red'}">${dept.status}</span></td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteDepartment('${dept.departmentId}')" ${dept.status !== 'active' ? 'disabled' : ''}>Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No departments found</p>';
        }
    } catch (error) {
        document.getElementById('dept-list').innerHTML = '<p style="text-align: center; color: red;">Error loading departments</p>';
    }
}

async function deleteDepartment(departmentId) {
    if (!confirm('Are you sure? This will mark the department and all its classes/students as deleted.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/departments/${departmentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Deleted by admin' })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('dept-message', data.message, 'success');
            loadDepartments();
        } else {
            showMessage('dept-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('dept-message', 'Error: ' + error.message, 'error');
    }
}

async function loadDepartmentsForUpdate() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        const data = await response.json();
        
        const select = document.getElementById('dept-update-select');
        let html = '<option value="">-- Select Department --</option>';
        if (data.success && data.departments.length > 0) {
            data.departments.forEach(dept => {
                if (dept.status === 'active') {
                    html += `<option value="${dept.departmentId}">${dept.departmentName} (${dept.departmentId})</option>`;
                }
            });
        }
        select.innerHTML = html;
    } catch (error) {
        console.error('Error loading departments for update:', error);
    }
}

function loadDepartmentForUpdate() {
    const selectElem = document.getElementById('dept-update-select');
    const selectedText = selectElem.options[selectElem.selectedIndex].text;
    if (selectedText && selectedText !== '-- Select Department --') {
        const deptName = selectedText.split(' (')[0];
        document.getElementById('dept-update-name').value = deptName;
    }
}

async function updateDepartment() {
    const departmentId = document.getElementById('dept-update-select').value;
    const newName = document.getElementById('dept-update-name').value.trim();

    if (!departmentId) {
        showMessage('dept-message', 'Please select a department', 'error');
        return;
    }

    if (!newName) {
        showMessage('dept-message', 'Please enter a new name', 'error');
        return;
    }

    if (!confirm(`Update department ${departmentId} to "${newName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/departments/${departmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updatedData: { name: newName } })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('dept-message', 'Department updated successfully!', 'success');
            document.getElementById('dept-update-select').value = '';
            document.getElementById('dept-update-name').value = '';
            loadDepartments();
            loadDepartmentsForUpdate();
        } else {
            showMessage('dept-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('dept-message', 'Error: ' + error.message, 'error');
    }
}

async function searchDepartments() {
    const searchTerm = document.getElementById('dept-search').value;
    if (!searchTerm) {
        loadDepartments();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/departments/search/${searchTerm}`);
        const data = await response.json();
        
        const container = document.getElementById('dept-list');
        if (data.success && data.results.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            data.results.forEach(dept => {
                html += `
                    <tr>
                        <td>${dept.departmentId}</td>
                        <td>${dept.departmentName}</td>
                        <td><span style="color: ${dept.status === 'active' ? 'green' : 'red'}">${dept.status}</span></td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteDepartment('${dept.departmentId}')" ${dept.status !== 'active' ? 'disabled' : ''}>Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No results found</p>';
        }
    } catch (error) {
        console.error('Error searching departments:', error);
    }
}

// ==================== CLASSES ====================

async function loadDepartmentsForSelect() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        const data = await response.json();
        
        const select1 = document.getElementById('class-dept');
        const select2 = document.getElementById('student-dept');
        
        let html = '<option value="">-- Select Department --</option>';
        if (data.success) {
            data.departments.filter(d => d.status === 'active').forEach(dept => {
                html += `<option value="${dept.departmentId}">${dept.departmentName}</option>`;
            });
        }
        
        if (select1) select1.innerHTML = html;
        if (select2) select2.innerHTML = html;
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

async function createClass() {
    const classId = document.getElementById('class-id').value;
    const className = document.getElementById('class-name').value;
    const departmentId = document.getElementById('class-dept').value;

    if (!classId || !className || !departmentId) {
        showMessage('class-message', 'Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId, className, departmentId })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('class-message', 'Class created successfully!', 'success');
            document.getElementById('class-id').value = '';
            document.getElementById('class-name').value = '';
            loadClasses();
        } else {
            showMessage('class-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('class-message', 'Error: ' + error.message, 'error');
    }
}

async function loadClasses() {
    try {
        const response = await fetch(`${API_BASE}/classes`);
        const data = await response.json();
        
        const container = document.getElementById('class-list');
        if (data.success && data.classes.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            data.classes.forEach(cls => {
                html += `
                    <tr>
                        <td>${cls.classId}</td>
                        <td>${cls.className}</td>
                        <td>${cls.departmentId}</td>
                        <td><span style="color: ${cls.status === 'active' ? 'green' : 'red'}">${cls.status}</span></td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteClass('${cls.classId}')" ${cls.status !== 'active' ? 'disabled' : ''}>Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No classes found</p>';
        }
    } catch (error) {
        document.getElementById('class-list').innerHTML = '<p style="text-align: center; color: red;">Error loading classes</p>';
    }
}

async function deleteClass(classId) {
    if (!confirm('Are you sure? This will mark the class and all its students as deleted.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/classes/${classId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Deleted by admin' })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('class-message', data.message, 'success');
            loadClasses();
        } else {
            showMessage('class-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('class-message', 'Error: ' + error.message, 'error');
    }
}

async function loadClassesForUpdate() {
    try {
        const response = await fetch(`${API_BASE}/classes`);
        const data = await response.json();
        
        const select = document.getElementById('class-update-select');
        let html = '<option value="">-- Select Class --</option>';
        if (data.success && data.classes.length > 0) {
            data.classes.forEach(cls => {
                if (cls.status === 'active') {
                    html += `<option value="${cls.classId}">${cls.className} (${cls.classId})</option>`;
                }
            });
        }
        select.innerHTML = html;
    } catch (error) {
        console.error('Error loading classes for update:', error);
    }
}

function loadClassForUpdate() {
    const selectElem = document.getElementById('class-update-select');
    const selectedText = selectElem.options[selectElem.selectedIndex].text;
    if (selectedText && selectedText !== '-- Select Class --') {
        const className = selectedText.split(' (')[0];
        document.getElementById('class-update-name').value = className;
    }
}

async function updateClass() {
    const classId = document.getElementById('class-update-select').value;
    const newName = document.getElementById('class-update-name').value.trim();

    if (!classId) {
        showMessage('class-message', 'Please select a class', 'error');
        return;
    }

    if (!newName) {
        showMessage('class-message', 'Please enter a new name', 'error');
        return;
    }

    if (!confirm(`Update class ${classId} to "${newName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/classes/${classId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updatedData: { name: newName } })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('class-message', 'Class updated successfully!', 'success');
            document.getElementById('class-update-select').value = '';
            document.getElementById('class-update-name').value = '';
            loadClasses();
            loadClassesForUpdate();
        } else {
            showMessage('class-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('class-message', 'Error: ' + error.message, 'error');
    }
}

async function searchClasses() {
    const searchTerm = document.getElementById('class-search').value;
    if (!searchTerm) {
        loadClasses();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/classes/search/${searchTerm}`);
        const data = await response.json();
        
        const container = document.getElementById('class-list');
        if (data.success && data.results.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            data.results.forEach(cls => {
                html += `
                    <tr>
                        <td>${cls.classId}</td>
                        <td>${cls.className}</td>
                        <td>${cls.departmentId}</td>
                        <td><span style="color: ${cls.status === 'active' ? 'green' : 'red'}">${cls.status}</span></td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteClass('${cls.classId}')" ${cls.status !== 'active' ? 'disabled' : ''}>Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No results found</p>';
        }
    } catch (error) {
        console.error('Error searching classes:', error);
    }
}

// ==================== STUDENTS ====================

async function loadClassesForDept() {
    const departmentId = document.getElementById('student-dept').value;
    const classSelect = document.getElementById('student-class');
    
    if (!departmentId) {
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/classes/department/${departmentId}`);
        const data = await response.json();
        
        let html = '<option value="">-- Select Class --</option>';
        if (data.success) {
            data.classes.filter(c => c.status === 'active').forEach(cls => {
                html += `<option value="${cls.classId}">${cls.className}</option>`;
            });
        }
        classSelect.innerHTML = html;
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function createStudent() {
    const studentId = document.getElementById('student-id').value;
    const studentName = document.getElementById('student-name').value;
    const rollNumber = document.getElementById('student-roll').value;
    const departmentId = document.getElementById('student-dept').value;
    const classId = document.getElementById('student-class').value;

    if (!studentId || !studentName || !rollNumber || !departmentId || !classId) {
        showMessage('student-message', 'Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, studentName, rollNumber, classId, departmentId })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('student-message', 'Student created successfully!', 'success');
            document.getElementById('student-id').value = '';
            document.getElementById('student-name').value = '';
            document.getElementById('student-roll').value = '';
            loadStudents();
        } else {
            showMessage('student-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('student-message', 'Error: ' + error.message, 'error');
    }
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/students`);
        const data = await response.json();
        
        const container = document.getElementById('student-list');
        if (data.success && data.students.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Roll No</th><th>Class</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            data.students.forEach(student => {
                html += `
                    <tr>
                        <td>${student.studentId}</td>
                        <td>${student.studentName}</td>
                        <td>${student.rollNumber}</td>
                        <td>${student.classId}</td>
                        <td><span style="color: ${student.status === 'active' ? 'green' : 'red'}">${student.status}</span></td>
                        <td>
                            <button class="btn btn-warning" onclick="viewStudentAttendance('${student.studentId}')">View Attendance</button>
                            <button class="btn btn-danger" onclick="deleteStudent('${student.studentId}')" ${student.status !== 'active' ? 'disabled' : ''}>Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No students found</p>';
        }
    } catch (error) {
        document.getElementById('student-list').innerHTML = '<p style="text-align: center; color: red;">Error loading students</p>';
    }
}

async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Deleted by admin' })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('student-message', data.message, 'success');
            loadStudents();
        } else {
            showMessage('student-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('student-message', 'Error: ' + error.message, 'error');
    }
}

async function loadStudentsForUpdate() {
    try {
        const response = await fetch(`${API_BASE}/students`);
        const data = await response.json();
        
        const select = document.getElementById('student-update-select');
        let html = '<option value="">-- Select Student --</option>';
        if (data.success && data.students.length > 0) {
            data.students.forEach(student => {
                if (student.status === 'active') {
                    html += `<option value="${student.studentId}" data-name="${student.studentName}" data-roll="${student.rollNumber}">${student.studentName} (${student.studentId})</option>`;
                }
            });
        }
        select.innerHTML = html;
    } catch (error) {
        console.error('Error loading students for update:', error);
    }
}

function loadStudentForUpdate() {
    const selectElem = document.getElementById('student-update-select');
    const selectedOption = selectElem.options[selectElem.selectedIndex];
    if (selectedOption.value) {
        const studentName = selectedOption.getAttribute('data-name');
        const rollNumber = selectedOption.getAttribute('data-roll');
        document.getElementById('student-update-name').value = studentName;
        document.getElementById('student-update-roll').value = rollNumber;
    }
}

async function updateStudent() {
    const studentId = document.getElementById('student-update-select').value;
    const newName = document.getElementById('student-update-name').value.trim();
    const newRoll = document.getElementById('student-update-roll').value.trim();

    if (!studentId) {
        showMessage('student-message', 'Please select a student', 'error');
        return;
    }

    if (!newName && !newRoll) {
        showMessage('student-message', 'Please enter at least one field to update', 'error');
        return;
    }

    if (!confirm(`Update student ${studentId}?`)) {
        return;
    }

    try {
        const updatedData = {};
        if (newName) updatedData.name = newName;
        if (newRoll) updatedData.rollNumber = newRoll;

        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updatedData })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('student-message', 'Student updated successfully!', 'success');
            document.getElementById('student-update-select').value = '';
            document.getElementById('student-update-name').value = '';
            document.getElementById('student-update-roll').value = '';
            loadStudents();
            loadStudentsForUpdate();
        } else {
            showMessage('student-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('student-message', 'Error: ' + error.message, 'error');
    }
}

async function searchStudents() {
    const searchTerm = document.getElementById('student-search').value;
    if (!searchTerm) {
        loadStudents();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/students/search/${searchTerm}`);
        const data = await response.json();
        
        const container = document.getElementById('student-list');
        if (data.success && data.results.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Roll No</th><th>Class</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            data.results.forEach(student => {
                html += `
                    <tr>
                        <td>${student.studentId}</td>
                        <td>${student.studentName}</td>
                        <td>${student.rollNumber}</td>
                        <td>${student.classId}</td>
                        <td><span style="color: ${student.status === 'active' ? 'green' : 'red'}">${student.status}</span></td>
                        <td>
                            <button class="btn btn-warning" onclick="viewStudentAttendance('${student.studentId}')">View Attendance</button>
                            <button class="btn btn-danger" onclick="deleteStudent('${student.studentId}')" ${student.status !== 'active' ? 'disabled' : ''}>Delete</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No results found</p>';
        }
    } catch (error) {
        console.error('Error searching students:', error);
    }
}

async function viewStudentAttendance(studentId) {
    try {
        const response = await fetch(`${API_BASE}/attendance/student/${studentId}`);
        const data = await response.json();
        
        if (data.success) {
            const { student, summary, history } = data.attendance;
            let html = `
                <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <h3>${student.studentName} (${student.rollNumber})</h3>
                    <p><strong>Present:</strong> ${summary.totalPresent} | <strong>Absent:</strong> ${summary.totalAbsent} | <strong>Leave:</strong> ${summary.totalLeave}</p>
                    <p><strong>Attendance Percentage:</strong> ${summary.attendancePercentage}%</p>
                    <h4>Attendance History:</h4>
            `;
            
            if (history.length > 0) {
                html += '<table><thead><tr><th>Block</th><th>Date</th><th>Status</th><th>Marked By</th><th>Hash</th></tr></thead><tbody>';
                history.forEach(record => {
                    html += `
                        <tr>
                            <td>#${record.blockIndex}</td>
                            <td>${record.date}</td>
                            <td><span style="color: ${record.status === 'Present' ? 'green' : record.status === 'Absent' ? 'red' : 'orange'}">${record.status}</span></td>
                            <td>${record.markedBy}</td>
                            <td class="hash">${record.hash.substring(0, 16)}...</td>
                        </tr>
                    `;
                });
                html += '</tbody></table>';
            } else {
                html += '<p>No attendance records found.</p>';
            }
            
            html += '</div>';
            
            const container = document.getElementById('student-list');
            container.innerHTML = html + '<br><button class="btn btn-primary" onclick="loadStudents()">Back to Students</button>';
        }
    } catch (error) {
        console.error('Error viewing attendance:', error);
    }
}

// ==================== ATTENDANCE ====================

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = today;
}

async function loadClassesForAttendance() {
    try {
        const response = await fetch(`${API_BASE}/classes`);
        const data = await response.json();
        
        const select = document.getElementById('attendance-class');
        let html = '<option value="">-- Select Class --</option>';
        if (data.success) {
            data.classes.filter(c => c.status === 'active').forEach(cls => {
                html += `<option value="${cls.classId}">${cls.className} (${cls.departmentId})</option>`;
            });
        }
        select.innerHTML = html;
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadStudentsForAttendance() {
    const classId = document.getElementById('attendance-class').value;
    const container = document.getElementById('attendance-list');
    
    if (!classId) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Select a class to mark attendance</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/students/class/${classId}`);
        const data = await response.json();
        
        if (data.success && data.students.length > 0) {
            let html = '<div class="attendance-grid">';
            data.students.filter(s => s.status === 'active').forEach(student => {
                html += `
                    <div class="student-attendance">
                        <div class="student-info">
                            <h4>${student.studentName}</h4>
                            <p>Roll No: ${student.rollNumber} | ID: ${student.studentId}</p>
                        </div>
                        <div class="attendance-buttons">
                            <button class="btn-present" onclick="markAttendance('${student.studentId}', 'Present')">Present</button>
                            <button class="btn-absent" onclick="markAttendance('${student.studentId}', 'Absent')">Absent</button>
                            <button class="btn-leave" onclick="markAttendance('${student.studentId}', 'Leave')">Leave</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666;">No active students found in this class</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: red;">Error loading students</p>';
    }
}

async function markAttendance(studentId, status) {
    const date = document.getElementById('attendance-date').value;
    
    if (!date) {
        showMessage('attendance-message', 'Please select a date', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, status, date, markedBy: 'admin' })
        });
        const data = await response.json();
        
        if (data.success) {
            showMessage('attendance-message', `Marked ${status} for student ${studentId}`, 'success');
        } else {
            showMessage('attendance-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('attendance-message', 'Error: ' + error.message, 'error');
    }
}

// ==================== BLOCKCHAIN ====================

async function updateEntitySelect() {
    const type = document.getElementById('blockchain-type').value;
    const entitySelect = document.getElementById('blockchain-entity');
    
    if (!type) {
        entitySelect.innerHTML = '<option value="">-- Select Entity --</option>';
        return;
    }

    try {
        let endpoint = '';
        if (type === 'department') endpoint = '/departments';
        else if (type === 'class') endpoint = '/classes';
        else if (type === 'student') endpoint = '/students';

        console.log('Fetching entities from:', endpoint);
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        console.log('Entities data:', data);
        
        let html = '<option value="">-- Select Entity --</option>';
        if (data.success) {
            const items = data.departments || data.classes || data.students;
            console.log('Items to display:', items);
            items.forEach(item => {
                let id, name;
                // Get the correct ID and name based on entity type
                if (type === 'department') {
                    id = item.departmentId;
                    name = item.departmentName;
                } else if (type === 'class') {
                    id = item.classId;
                    name = item.className;
                } else if (type === 'student') {
                    id = item.studentId;
                    name = item.studentName;
                }
                console.log('Adding option:', id, name);
                html += `<option value="${id}">${name} (${id})</option>`;
            });
        }
        entitySelect.innerHTML = html;
    } catch (error) {
        console.error('Error loading entities:', error);
    }
}

async function viewBlockchain() {
    const type = document.getElementById('blockchain-type').value;
    const entityId = document.getElementById('blockchain-entity').value;
    const container = document.getElementById('blockchain-viewer');
    
    if (!type || !entityId) {
        showMessage('blockchain-message', 'Please select type and entity', 'error');
        return;
    }

    try {
        let endpoint = '';
        if (type === 'department') endpoint = `/departments/${entityId}/blockchain`;
        else if (type === 'class') endpoint = `/classes/${entityId}/blockchain`;
        else if (type === 'student') endpoint = `/students/${entityId}/blockchain`;

        console.log('Fetching blockchain for:', type, entityId, 'from endpoint:', endpoint);
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        console.log('Blockchain response:', data);
        
        if (data.success) {
            const blockchain = data.blockchain;
            let html = `
                <div class="blockchain-viewer">
                    <h3>${blockchain.name} Blockchain</h3>
                    <p><strong>Chain Length:</strong> ${blockchain.chainLength} blocks</p>
                    <p><strong>Valid:</strong> <span style="color: ${blockchain.isValid ? 'green' : 'red'}">${blockchain.isValid ? 'Yes' : 'No'}</span></p>
            `;
            
            if (blockchain.parentDepartmentHash) {
                html += `<p><strong>Parent Department Hash:</strong> <span class="hash">${blockchain.parentDepartmentHash}</span></p>`;
            }
            if (blockchain.parentClassHash) {
                html += `<p><strong>Parent Class Hash:</strong> <span class="hash">${blockchain.parentClassHash}</span></p>`;
            }
            
            html += '<h4>Blocks:</h4>';
            blockchain.blocks.forEach(block => {
                html += `
                    <div class="block">
                        <h4>Block #${block.index}</h4>
                        <div class="block-info">
                            <div><strong>Timestamp:</strong> ${new Date(block.timestamp).toLocaleString()}</div>
                            <div><strong>Nonce:</strong> ${block.nonce}</div>
                            <div><strong>Transaction Type:</strong> ${block.transactions.type || 'N/A'}</div>
                            <div><strong>Action:</strong> ${block.transactions.action || 'N/A'}</div>
                        </div>
                `;

                // Show transaction data based on type
                if (block.transactions.type === 'department_created' || 
                    block.transactions.type === 'class_created' || 
                    block.transactions.type === 'student_created') {
                    html += `
                        <div style="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
                            <strong>📝 Created Data:</strong>
                            <div style="margin-top: 5px;">
                                ${block.transactions.departmentName ? `<div>Name: ${block.transactions.departmentName}</div>` : ''}
                                ${block.transactions.className ? `<div>Name: ${block.transactions.className}</div>` : ''}
                                ${block.transactions.studentName ? `<div>Name: ${block.transactions.studentName}</div>` : ''}
                                ${block.transactions.rollNumber ? `<div>Roll Number: ${block.transactions.rollNumber}</div>` : ''}
                            </div>
                        </div>
                    `;
                }

                if (block.transactions.type === 'department_updated' || 
                    block.transactions.type === 'class_updated' || 
                    block.transactions.type === 'student_updated') {
                    html += `
                        <div style="margin-top: 10px; padding: 10px; background: #fff3e0; border-radius: 5px;">
                            <strong>📝 Updated Data:</strong>
                            ${block.transactions.previousData ? `
                                <div style="margin-top: 5px;">
                                    <strong>Previous:</strong>
                                    ${block.transactions.previousData.departmentName ? `<div>Name: ${block.transactions.previousData.departmentName}</div>` : ''}
                                    ${block.transactions.previousData.className ? `<div>Name: ${block.transactions.previousData.className}</div>` : ''}
                                    ${block.transactions.previousData.studentName ? `<div>Name: ${block.transactions.previousData.studentName}</div>` : ''}
                                    ${block.transactions.previousData.rollNumber ? `<div>Roll Number: ${block.transactions.previousData.rollNumber}</div>` : ''}
                                </div>
                            ` : ''}
                            ${block.transactions.updatedData ? `
                                <div style="margin-top: 5px;">
                                    <strong>New:</strong>
                                    ${block.transactions.updatedData.name ? `<div>Name: ${block.transactions.updatedData.name}</div>` : ''}
                                    ${block.transactions.updatedData.rollNumber ? `<div>Roll Number: ${block.transactions.updatedData.rollNumber}</div>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }

                if (block.transactions.type === 'attendance') {
                    html += `
                        <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius: 5px;">
                            <strong>📅 Attendance:</strong>
                            <div style="margin-top: 5px;">
                                <div>Student: ${block.transactions.studentName}</div>
                                <div>Status: <strong>${block.transactions.status}</strong></div>
                                <div>Date: ${block.transactions.date}</div>
                            </div>
                        </div>
                    `;
                }

                html += `
                        <div style="margin-top: 10px;">
                            <div><strong>Previous Hash:</strong> <span class="hash">${block.prev_hash}</span></div>
                            <div><strong>Current Hash:</strong> <span class="hash">${block.hash}</span></div>
                        </div>
                        ${block.transactions.status ? `<div style="margin-top: 10px;"><strong>Status:</strong> ${block.transactions.status}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
        } else {
            showMessage('blockchain-message', data.message, 'error');
        }
    } catch (error) {
        showMessage('blockchain-message', 'Error: ' + error.message, 'error');
    }
}

// ==================== TREE VISUALIZATION ====================

async function visualizeBlockchainTree() {
    const container = document.getElementById('blockchain-tree');
    container.innerHTML = '<div class="loading">Building blockchain tree...</div>';

    try {
        // Fetch all data
        const [deptRes, classRes, studentRes] = await Promise.all([
            fetch(`${API_BASE}/departments`),
            fetch(`${API_BASE}/classes`),
            fetch(`${API_BASE}/students`)
        ]);

        const [deptData, classData, studentData] = await Promise.all([
            deptRes.json(),
            classRes.json(),
            studentRes.json()
        ]);

        if (!deptData.success || !classData.success || !studentData.success) {
            throw new Error('Failed to fetch blockchain data');
        }

        const departments = deptData.departments;
        const classes = classData.classes;
        const students = studentData.students;

        // Calculate stats
        const stats = {
            departments: departments.length,
            classes: classes.length,
            students: students.length,
            activeStudents: students.filter(s => s.status === 'active').length
        };

        let html = `
            <div class="tree-container">
                <div class="tree-stats">
                    <div class="tree-stat-item">
                        <div class="tree-stat-number">${stats.departments}</div>
                        <div class="tree-stat-label">Departments</div>
                    </div>
                    <div class="tree-stat-item">
                        <div class="tree-stat-number">${stats.classes}</div>
                        <div class="tree-stat-label">Classes</div>
                    </div>
                    <div class="tree-stat-item">
                        <div class="tree-stat-number">${stats.students}</div>
                        <div class="tree-stat-label">Students</div>
                    </div>
                    <div class="tree-stat-item">
                        <div class="tree-stat-number">${stats.activeStudents}</div>
                        <div class="tree-stat-label">Active Students</div>
                    </div>
                </div>

                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color layer-1"></div>
                        <span>Layer 1: Departments</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color layer-2"></div>
                        <span>Layer 2: Classes</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color layer-3"></div>
                        <span>Layer 3: Students</span>
                    </div>
                </div>

                <div class="tree-diagram">
        `;

        // Build hierarchical tree
        departments.forEach((dept, deptIndex) => {
            const deptClasses = classes.filter(c => c.departmentId === dept.departmentId);
            
            html += `
                <div class="tree-branch" style="margin-bottom: 60px;">
                    <div class="tree-node layer-1">
                        <div class="tree-node-title">🏢 ${dept.departmentName}</div>
                        <div class="tree-node-id">${dept.departmentId}</div>
                        <div class="tree-node-info">
                            Status: ${dept.status} | ${deptClasses.length} Classes
                        </div>
                    </div>
            `;

            if (deptClasses.length > 0) {
                html += `<div class="tree-children">`;
                
                deptClasses.forEach((cls, clsIndex) => {
                    const classStudents = students.filter(s => s.classId === cls.classId);
                    
                    html += `
                        <div class="tree-child-group">
                            <div class="tree-node layer-2">
                                <div class="tree-node-title">📚 ${cls.className}</div>
                                <div class="tree-node-id">${cls.classId}</div>
                                <div class="tree-node-info">
                                    ${cls.departmentId} | ${classStudents.length} Students
                                </div>
                            </div>
                    `;

                    if (classStudents.length > 0) {
                        html += `<div class="tree-children">`;
                        
                        // Limit to first 3 students per class for readability
                        const displayStudents = classStudents.slice(0, 3);
                        displayStudents.forEach((student, stuIndex) => {
                            html += `
                                <div class="tree-child-group">
                                    <div class="tree-node layer-3">
                                        <div class="tree-node-title">👤 ${student.studentName}</div>
                                        <div class="tree-node-id">${student.studentId}</div>
                                        <div class="tree-node-info">
                                            ${student.rollNumber}
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        if (classStudents.length > 3) {
                            html += `
                                <div class="tree-child-group">
                                    <div class="tree-node layer-3" style="background: #f5f5f5; border-color: #999;">
                                        <div class="tree-node-title">...</div>
                                        <div class="tree-node-info">
                                            +${classStudents.length - 3} more students
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        
                        html += `</div>`; // Close tree-children for students
                    }

                    html += `</div>`; // Close tree-child-group for class
                });
                
                html += `</div>`; // Close tree-children for classes
            }

            html += `</div>`; // Close tree-branch for department
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        showMessage('blockchain-message', 'Tree visualization generated successfully', 'success');

    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: red;">Error generating tree visualization</p>';
        showMessage('blockchain-message', 'Error: ' + error.message, 'error');
    }
}

// ==================== VALIDATION ====================

async function validateBlockchain() {
    const container = document.getElementById('validation-result');
    container.innerHTML = '<div class="loading">Validating blockchain hierarchy...</div>';

    try {
        const response = await fetch(`${API_BASE}/system/validate`);
        const data = await response.json();
        
        if (data.success) {
            const validation = data.validation;
            let html = `
                <div class="validation-result ${validation.isValid ? 'valid' : 'invalid'}">
                    <h3>Validation Result: <span style="color: ${validation.isValid ? 'green' : 'red'}">${validation.isValid ? 'VALID ✓' : 'INVALID ✗'}</span></h3>
            `;
            
            // Department validation
            html += '<h4>Department Chains:</h4><ul>';
            for (const [id, isValid] of Object.entries(validation.departments)) {
                html += `<li>${id}: <span style="color: ${isValid ? 'green' : 'red'}">${isValid ? 'Valid' : 'Invalid'}</span></li>`;
            }
            html += '</ul>';
            
            // Class validation
            html += '<h4>Class Chains:</h4><ul>';
            for (const [id, isValid] of Object.entries(validation.classes)) {
                html += `<li>${id}: <span style="color: ${isValid ? 'green' : 'red'}">${isValid ? 'Valid' : 'Invalid'}</span></li>`;
            }
            html += '</ul>';
            
            // Student validation
            html += '<h4>Student Chains:</h4><ul>';
            const studentEntries = Object.entries(validation.students);
            if (studentEntries.length > 10) {
                // Show first 10 only if too many
                for (let i = 0; i < 10; i++) {
                    const [id, isValid] = studentEntries[i];
                    html += `<li>${id}: <span style="color: ${isValid ? 'green' : 'red'}">${isValid ? 'Valid' : 'Invalid'}</span></li>`;
                }
                html += `<li>... and ${studentEntries.length - 10} more students</li>`;
            } else {
                for (const [id, isValid] of studentEntries) {
                    html += `<li>${id}: <span style="color: ${isValid ? 'green' : 'red'}">${isValid ? 'Valid' : 'Invalid'}</span></li>`;
                }
            }
            html += '</ul>';
            
            // Errors
            if (validation.errors.length > 0) {
                html += '<h4>Errors:</h4><ul style="color: red;">';
                validation.errors.forEach(error => {
                    html += `<li>${error}</li>`;
                });
                html += '</ul>';
            }
            
            html += '</div>';
            container.innerHTML = html;
            
            showMessage('validation-message', 'Validation complete', validation.isValid ? 'success' : 'error');
        }
    } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: red;">Error during validation</p>';
        showMessage('validation-message', 'Error: ' + error.message, 'error');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
});
