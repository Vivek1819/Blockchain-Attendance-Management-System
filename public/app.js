// =============================================
// CLERK AUTHENTICATION SETUP
// =============================================

let clerk = null;
let currentUser = null;
let authToken = null;

// Wait for Clerk to load
window.addEventListener('load', async () => {
    // Wait for Clerk script to be available
    const waitForClerk = setInterval(async () => {
        if (window.Clerk) {
            clearInterval(waitForClerk);
            await initializeClerk();
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(waitForClerk);
        if (!window.Clerk) {
            document.getElementById('auth-loading').textContent = 'Auth failed to load';
        }
    }, 10000);
});

async function initializeClerk() {
    try {
        console.log('Initializing Clerk...');
        if (!window.Clerk) {
            throw new Error('window.Clerk is undefined');
        }
        clerk = window.Clerk;
        console.log('Clerk object found, calling load()...');
        await clerk.load();
        console.log('Clerk loaded successfully');
        
        // Check current auth state
        await updateAuthUI();
        
        // Listen for auth changes
        clerk.addListener(async () => {
            await updateAuthUI();
        });
        
        // Load initial data
        loadStats();
        loadDepartments();
        loadClasses();
        loadStudents();
        
    } catch (error) {
        console.error('Failed to initialize Clerk:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.innerHTML = `
                <div style="color: #ff6b6b; font-size: 0.85em; display: flex; align-items: center; gap: 10px;">
                    <span>Auth Error (Check Console)</span>
                    <button onclick="location.reload()" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 4px 8px; font-size: 0.8em; border: 1px solid rgba(255,255,255,0.3);">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}


let currentUserDetails = null;

async function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    
    if (clerk.user) {
        // User is signed in
        currentUser = clerk.user;
        authToken = await clerk.session.getToken();
        
        // Check if user has completed onboarding
        const userInfo = await fetchUserInfo();
        currentUserDetails = userInfo;
        
        if (userInfo && !userInfo.onboarded) {
            // Show onboarding modal
            showOnboardingModal();
        }
        
        // Update UI with user info
        authContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="text-align: right;">
                    <div style="font-weight: bold; color: white;">${currentUser.firstName || currentUser.emailAddresses[0].emailAddress}</div>
                    <div style="font-size: 0.8em; color: rgba(255,255,255,0.8);">${userInfo?.role || 'Loading...'} ${userInfo?.departmentName ? '- ' + userInfo.departmentName : ''}</div>
                </div>
                <button onclick="signOut()" class="btn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 16px;">
                    Sign Out
                </button>
            </div>
        `;
        
        // Show protected tabs
        updateProtectedTabs(true, userInfo);
        
        // Apply teacher-specific UI constraints
        if (userInfo && userInfo.role === 'teacher') {
            applyTeacherConstraints(userInfo);
        }
        
    } else {
        // User is signed out
        currentUser = null;
        authToken = null;
        currentUserDetails = null;
        
        authContainer.innerHTML = `
            <button onclick="signIn()" class="btn" style="background: white; color: #667eea; padding: 10px 20px; font-weight: bold;">
                Sign In
            </button>
        `;
        
        // Hide protected tabs (but keep Blockchain visible)
        updateProtectedTabs(false, null);
    }
}

function applyTeacherConstraints(userInfo) {
    if (!userInfo || !userInfo.departmentId) return;
    
    // Auto-fill and hide department dropdowns
    const deptDropdowns = ['class-dept', 'student-dept'];
    
    deptDropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            // Set value (even if options aren't loaded yet, we'll try)
            // Note: We might need to ensure options are loaded first, or force the value
            // We'll also hide the parent form group
            const formGroup = dropdown.closest('.form-group');
            if (formGroup) {
                formGroup.style.display = 'none';
            }
        }
    });

    // We also need to ensure that when we try to create a class or student, the value is set
    // Since dropdown options might load later, we should intercept the create functions or ensure 
    // updateDepartmentDropdowns respects this
}

async function fetchUserInfo() {
    if (!authToken) return null;
    
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        return data.success ? data.data : null;
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        return null;
    }
}

function signIn() {
    clerk.openSignIn();
}

function signOut() {
    clerk.signOut();
}

// =============================================
// ONBOARDING
// =============================================

async function showOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    const departmentSelect = document.getElementById('onboard-department');
    
    // Load departments for dropdown
    try {
        const response = await fetch('/api/auth/departments');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            departmentSelect.innerHTML = '<option value="">-- Select Department --</option>';
            data.data.forEach(dept => {
                departmentSelect.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
            });
        } else {
            departmentSelect.innerHTML = '<option value="">No departments available</option>';
        }
    } catch (error) {
        console.error('Failed to load departments:', error);
    }
    
    // Pre-fill name if available
    if (currentUser && currentUser.firstName) {
        document.getElementById('onboard-name').value = 
            `${currentUser.firstName} ${currentUser.lastName || ''}`.trim();
    }
    
    modal.style.display = 'flex';
}

async function completeOnboarding() {
    const name = document.getElementById('onboard-name').value.trim();
    const departmentId = document.getElementById('onboard-department').value;
    
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    if (!departmentId) {
        alert('Please select a department');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/onboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, departmentId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('onboarding-modal').style.display = 'none';
            await updateAuthUI();
            showMessage('dashboard-message', 'Welcome! You are now set up as a teacher.', 'success');
        } else {
            alert(data.message || 'Onboarding failed');
        }
    } catch (error) {
        console.error('Onboarding error:', error);
        alert('Failed to complete onboarding');
    }
}

// =============================================
// PROTECTED UI
// =============================================

function updateProtectedTabs(isAuthenticated, userInfo) {
    const protectedTabs = ['dashboard', 'departments', 'classes', 'students', 'attendance'];
    const publicTabs = ['blockchain', 'validation'];
    
    protectedTabs.forEach(tabId => {
        const tab = document.querySelector(`[onclick="showTab('${tabId}')"]`);
        const content = document.getElementById(tabId);
        
        if (tab && content) {
            if (!isAuthenticated) {
                tab.style.opacity = '0.5';
                tab.style.pointerEvents = 'none';
            } else {
                tab.style.opacity = '1';
                tab.style.pointerEvents = 'auto';
                
                // Hide departments tab completely for teachers
                if (tabId === 'departments' && userInfo && userInfo.role === 'teacher') {
                    tab.style.display = 'none';
                } else if (tabId === 'departments') {
                    tab.style.display = 'block'; // Ensure it's shown for others
                    
                    // Only admin can see create form
                    if (userInfo && userInfo.role !== 'admin') {
                        const createForm = content.querySelector('div[style*="margin-bottom: 30px"]');
                        if (createForm && createForm.querySelector('h3')?.textContent === 'Create Department') {
                            createForm.style.display = 'none';
                        }
                    }
                }
            }
        }
    });
    
    // Public tabs always accessible
    publicTabs.forEach(tabId => {
        const tab = document.querySelector(`[onclick="showTab('${tabId}')"]`);
        if (tab) {
            tab.style.opacity = '1';
            tab.style.pointerEvents = 'auto';
        }
    });
    
    // If not authenticated and on protected tab, switch to blockchain
    if (!isAuthenticated) {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && protectedTabs.includes(activeTab.id)) {
            showTab('blockchain');
        }
    }
}

// =============================================
// API HELPER - ADD AUTH HEADER
// =============================================

async function authenticatedFetch(url, options = {}) {
    if (authToken) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`
        };
    }
    return fetch(url, options);
}

// =============================================
// TAB NAVIGATION
// =============================================

function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabId).classList.add('active');
    
    // Activate selected tab button
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
    
    // Load data for specific tabs
    if (tabId === 'dashboard') loadStats();
    if (tabId === 'departments') loadDepartmentsList();
    if (tabId === 'classes') loadClassesList();
    if (tabId === 'students') loadStudentsList();
}

// =============================================
// MESSAGE DISPLAY
// =============================================

function showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type} show`;
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

// =============================================
// DASHBOARD & STATS
// =============================================

async function loadStats() {
    try {
        const response = await fetch('/api/system/stats');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('stat-departments').textContent = data.data.totalDepartments || 0;
            document.getElementById('stat-classes').textContent = data.data.totalClasses || 0;
            document.getElementById('stat-students').textContent = data.data.totalStudents || 0;
            document.getElementById('stat-attendance').textContent = data.data.totalAttendanceRecords || 0;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function initializeSystem() {
    try {
        const response = await authenticatedFetch('/api/system/initialize', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showMessage('dashboard-message', 'System initialized with sample data!', 'success');
            loadStats();
            loadDepartments();
        } else {
            showMessage('dashboard-message', data.message || 'Initialization failed', 'error');
        }
    } catch (error) {
        showMessage('dashboard-message', 'Error initializing system', 'error');
    }
}

async function saveData() {
    try {
        const response = await authenticatedFetch('/api/system/save', { method: 'POST' });
        const data = await response.json();
        showMessage('dashboard-message', data.success ? 'Data saved successfully!' : 'Save failed', data.success ? 'success' : 'error');
    } catch (error) {
        showMessage('dashboard-message', 'Error saving data', 'error');
    }
}

async function loadData() {
    try {
        const response = await authenticatedFetch('/api/system/load', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            showMessage('dashboard-message', 'Data loaded successfully!', 'success');
            loadStats();
        }
    } catch (error) {
        showMessage('dashboard-message', 'Error loading data', 'error');
    }
}

// =============================================
// DEPARTMENTS
// =============================================

let allDepartments = [];

async function loadDepartments() {
    try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        
        if (data.success) {
            allDepartments = data.data || [];
            updateDepartmentDropdowns();
        }
    } catch (error) {
        console.error('Failed to load departments:', error);
    }
}

function updateDepartmentDropdowns() {
    const dropdowns = ['class-dept', 'student-dept', 'dept-update-select'];
    
    dropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            // Check if user is a teacher
            if (currentUserDetails && currentUserDetails.role === 'teacher') {
                // Teacher: Only show their department
                const deptId = currentUserDetails.departmentId;
                const deptName = currentUserDetails.departmentName || 'My Department';
                
                // Only update if not already set (prevents loop)
                if (dropdown.value !== deptId) {
                    dropdown.innerHTML = `<option value="${deptId}" selected>${deptName} (${deptId})</option>`;
                    dropdown.value = deptId;
                    
                    // Trigger change event
                    dropdown.dispatchEvent(new Event('change'));
                    
                    // Explicitly load classes if this is the student department dropdown
                    if (id === 'student-dept') {
                        loadClassesForDept();
                    }
                }
                
                // Hide the dropdown container
                const formGroup = dropdown.closest('.form-group');
                if (formGroup) {
                    formGroup.style.display = 'none';
                }
            } else {
                // Admin/Other: Show all departments
                const currentValue = dropdown.value;
                let newHtml = '<option value="">-- Select Department --</option>';
                allDepartments.forEach(dept => {
                    newHtml += `<option value="${dept.id}">${dept.name} (${dept.id})</option>`;
                });
                
                if (dropdown.innerHTML !== newHtml) {
                    dropdown.innerHTML = newHtml;
                    dropdown.value = currentValue;
                }
                
                // Ensure visible
                const formGroup = dropdown.closest('.form-group');
                if (formGroup) {
                    formGroup.style.display = 'block';
                }
            }
        }
    });
}

async function loadDepartmentsList() {
    const listEl = document.getElementById('dept-list');
    listEl.innerHTML = '<div class="loading">Loading departments...</div>';
    
    try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            
            data.data.forEach(dept => {
                html += `
                    <tr>
                        <td>${dept.id}</td>
                        <td>${dept.name}</td>
                        <td>${dept.status || 'active'}</td>
                        <td>
                            <button class="btn btn-primary" onclick="viewDepartmentBlockchain('${dept.id}')" style="padding: 5px 10px; font-size: 0.85em;">View Chain</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            listEl.innerHTML = html;
        } else {
            listEl.innerHTML = '<p style="text-align: center; color: #666;">No departments found</p>';
        }
    } catch (error) {
        listEl.innerHTML = '<p style="color: red;">Error loading departments</p>';
    }
}

async function createDepartment() {
    const id = document.getElementById('dept-id').value.trim();
    const name = document.getElementById('dept-name').value.trim();
    
    if (!id || !name) {
        showMessage('dept-message', 'Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await authenticatedFetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departmentId: id, departmentName: name })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('dept-message', 'Department created successfully!', 'success');
            document.getElementById('dept-id').value = '';
            document.getElementById('dept-name').value = '';
            loadDepartments();
            loadDepartmentsList();
            loadStats();
        } else {
            showMessage('dept-message', data.message || 'Failed to create department', 'error');
        }
    } catch (error) {
        showMessage('dept-message', 'Error creating department', 'error');
    }
}

async function loadDepartmentForUpdate() {
    const deptId = document.getElementById('dept-update-select').value;
    if (deptId) {
        const dept = allDepartments.find(d => d.id === deptId);
        if (dept) {
            document.getElementById('dept-update-name').value = dept.name;
        }
    }
}

async function updateDepartment() {
    const deptId = document.getElementById('dept-update-select').value;
    const newName = document.getElementById('dept-update-name').value.trim();
    
    if (!deptId || !newName) {
        showMessage('dept-message', 'Please select a department and enter a new name', 'error');
        return;
    }
    
    try {
        const response = await authenticatedFetch(`/api/departments/${deptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('dept-message', 'Department updated successfully!', 'success');
            loadDepartments();
            loadDepartmentsList();
        } else {
            showMessage('dept-message', data.message || 'Failed to update department', 'error');
        }
    } catch (error) {
        showMessage('dept-message', 'Error updating department', 'error');
    }
}

function searchDepartments() {
    const searchTerm = document.getElementById('dept-search').value.toLowerCase();
    const rows = document.querySelectorAll('#dept-list tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function viewDepartmentBlockchain(deptId) {
    showTab('blockchain');
    document.getElementById('blockchain-type').value = 'department';
    await updateEntitySelect();
    document.getElementById('blockchain-entity').value = deptId;
    viewBlockchain();
}

// =============================================
// CLASSES
// =============================================

let allClasses = [];

async function loadClasses() {
    try {
        let url = '/api/classes';
        if (currentUserDetails && currentUserDetails.role === 'teacher') {
            url = `/api/classes/department/${currentUserDetails.departmentId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            allClasses = data.data || [];
            updateClassDropdowns();
        }
    } catch (error) {
        console.error('Failed to load classes:', error);
    }
}

function updateClassDropdowns() {
    const dropdowns = ['attendance-class', 'class-update-select'];
    
    dropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) {
            const currentValue = dropdown.value;
            let newHtml = '<option value="">-- Select Class --</option>';
            allClasses.forEach(cls => {
                newHtml += `<option value="${cls.id}">${cls.name} (${cls.departmentId})</option>`;
            });
            
            // Only update DOM if content changed to prevent flickering
            if (dropdown.innerHTML !== newHtml) {
                dropdown.innerHTML = newHtml;
                dropdown.value = currentValue;
            }
        }
    });
}

async function loadClassesList() {
    const listEl = document.getElementById('class-list');
    listEl.innerHTML = '<div class="loading">Loading classes...</div>';
    
    try {
        let url = '/api/classes';
        if (currentUserDetails && currentUserDetails.role === 'teacher') {
            url = `/api/classes/department/${currentUserDetails.departmentId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            
            data.data.forEach(cls => {
                html += `
                    <tr>
                        <td>${cls.id}</td>
                        <td>${cls.name}</td>
                        <td>${cls.departmentId}</td>
                        <td>${cls.status || 'active'}</td>
                        <td>
                            <button class="btn btn-primary" onclick="viewClassBlockchain('${cls.id}')" style="padding: 5px 10px; font-size: 0.85em;">View Chain</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            listEl.innerHTML = html;
        } else {
            listEl.innerHTML = '<p style="text-align: center; color: #666;">No classes found</p>';
        }
    } catch (error) {
        listEl.innerHTML = '<p style="color: red;">Error loading classes</p>';
    }
}

async function createClass() {
    const id = document.getElementById('class-id').value.trim();
    const name = document.getElementById('class-name').value.trim();
    const deptId = document.getElementById('class-dept').value;
    
    if (!id || !name || !deptId) {
        showMessage('class-message', 'Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await authenticatedFetch('/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId: id, className: name, departmentId: deptId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('class-message', 'Class created successfully!', 'success');
            document.getElementById('class-id').value = '';
            document.getElementById('class-name').value = '';
            loadClasses();
            loadClassesList();
            loadStats();
        } else {
            showMessage('class-message', data.message || 'Failed to create class', 'error');
        }
    } catch (error) {
        showMessage('class-message', 'Error creating class', 'error');
    }
}

async function loadClassForUpdate() {
    const classId = document.getElementById('class-update-select').value;
    if (classId) {
        const cls = allClasses.find(c => c.id === classId);
        if (cls) {
            document.getElementById('class-update-name').value = cls.name;
        }
    }
}

async function updateClass() {
    const classId = document.getElementById('class-update-select').value;
    const newName = document.getElementById('class-update-name').value.trim();
    
    if (!classId || !newName) {
        showMessage('class-message', 'Please select a class and enter a new name', 'error');
        return;
    }
    
    try {
        const response = await authenticatedFetch(`/api/classes/${classId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('class-message', 'Class updated successfully!', 'success');
            loadClasses();
            loadClassesList();
        } else {
            showMessage('class-message', data.message || 'Failed to update class', 'error');
        }
    } catch (error) {
        showMessage('class-message', 'Error updating class', 'error');
    }
}

function searchClasses() {
    const searchTerm = document.getElementById('class-search').value.toLowerCase();
    const rows = document.querySelectorAll('#class-list tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function loadClassesForDept() {
    const deptId = document.getElementById('student-dept').value;
    const classDropdown = document.getElementById('student-class');
    
    // Safety check
    if (!classDropdown) return;
    
    // Store current value to restore if still valid
    const currentValue = classDropdown.value;
    let newHtml = '<option value="">-- Select Class --</option>';
    
    if (deptId) {
        try {
            const response = await fetch(`/api/classes/department/${deptId}`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                data.data.forEach(cls => {
                    newHtml += `<option value="${cls.id}">${cls.name}</option>`;
                });
            }
        } catch (error) {
            console.error('Failed to load classes for department:', error);
        }
    }
    
    // Only update DOM if content changed
    if (classDropdown.innerHTML !== newHtml) {
        classDropdown.innerHTML = newHtml;
        // Restore value if it exists in new options
        if (currentValue && newHtml.includes(`value="${currentValue}"`)) {
            classDropdown.value = currentValue;
        }
    }
}

async function viewClassBlockchain(classId) {
    showTab('blockchain');
    document.getElementById('blockchain-type').value = 'class';
    await updateEntitySelect();
    document.getElementById('blockchain-entity').value = classId;
    viewBlockchain();
}

// =============================================
// STUDENTS
// =============================================

let allStudents = [];

async function loadStudents() {
    try {
        let url = '/api/students';
        if (currentUserDetails && currentUserDetails.role === 'teacher') {
            url = `/api/students/department/${currentUserDetails.departmentId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            allStudents = data.data || [];
            updateStudentDropdowns();
        }
    } catch (error) {
        console.error('Failed to load students:', error);
    }
}

function updateStudentDropdowns() {
    const dropdown = document.getElementById('student-update-select');
    if (dropdown) {
        const currentValue = dropdown.value;
        let newHtml = '<option value="">-- Select Student --</option>';
        allStudents.forEach(student => {
            newHtml += `<option value="${student.id}">${student.name} (${student.rollNumber})</option>`;
        });
        
        if (dropdown.innerHTML !== newHtml) {
            dropdown.innerHTML = newHtml;
            dropdown.value = currentValue;
        }
    }
}

async function loadStudentsList() {
    const listEl = document.getElementById('student-list');
    listEl.innerHTML = '<div class="loading">Loading students...</div>';
    
    try {
        let url = '/api/students';
        if (currentUserDetails && currentUserDetails.role === 'teacher') {
            url = `/api/students/department/${currentUserDetails.departmentId}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let html = '<table><thead><tr><th>ID</th><th>Name</th><th>Roll No</th><th>Class</th><th>Department</th><th>Actions</th></tr></thead><tbody>';
            
            data.data.forEach(student => {
                html += `
                    <tr>
                        <td>${student.id}</td>
                        <td>${student.name}</td>
                        <td>${student.rollNumber}</td>
                        <td>${student.classId}</td>
                        <td>${student.departmentId}</td>
                        <td>
                            <button class="btn btn-primary" onclick="viewStudentBlockchain('${student.id}')" style="padding: 5px 10px; font-size: 0.85em;">View Chain</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            listEl.innerHTML = html;
        } else {
            listEl.innerHTML = '<p style="text-align: center; color: #666;">No students found</p>';
        }
    } catch (error) {
        listEl.innerHTML = '<p style="color: red;">Error loading students</p>';
    }
}

async function createStudent() {
    const id = document.getElementById('student-id').value.trim();
    const name = document.getElementById('student-name').value.trim();
    const roll = document.getElementById('student-roll').value.trim();
    const deptId = document.getElementById('student-dept').value;
    const classId = document.getElementById('student-class').value;
    
    if (!id || !name || !roll || !deptId || !classId) {
        showMessage('student-message', 'Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await authenticatedFetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                studentId: id, 
                studentName: name, 
                rollNumber: roll,
                departmentId: deptId,
                classId: classId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('student-message', 'Student created successfully!', 'success');
            document.getElementById('student-id').value = '';
            document.getElementById('student-name').value = '';
            document.getElementById('student-roll').value = '';
            loadStudents();
            loadStudentsList();
            loadStats();
        } else {
            showMessage('student-message', data.message || 'Failed to create student', 'error');
        }
    } catch (error) {
        showMessage('student-message', 'Error creating student', 'error');
    }
}

async function loadStudentForUpdate() {
    const studentId = document.getElementById('student-update-select').value;
    if (studentId) {
        const student = allStudents.find(s => s.id === studentId);
        if (student) {
            document.getElementById('student-update-name').value = student.name;
            document.getElementById('student-update-roll').value = student.rollNumber;
        }
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
    
    try {
        const response = await authenticatedFetch(`/api/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, rollNumber: newRoll })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('student-message', 'Student updated successfully!', 'success');
            loadStudents();
            loadStudentsList();
        } else {
            showMessage('student-message', data.message || 'Failed to update student', 'error');
        }
    } catch (error) {
        showMessage('student-message', 'Error updating student', 'error');
    }
}

function searchStudents() {
    const searchTerm = document.getElementById('student-search').value.toLowerCase();
    const rows = document.querySelectorAll('#student-list tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function viewStudentBlockchain(studentId) {
    showTab('blockchain');
    document.getElementById('blockchain-type').value = 'student';
    await updateEntitySelect();
    document.getElementById('blockchain-entity').value = studentId;
    viewBlockchain();
}

// =============================================
// ATTENDANCE
// =============================================

async function loadStudentsForAttendance() {
    const classId = document.getElementById('attendance-class').value;
    const dateInput = document.getElementById('attendance-date');
    const date = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    const listEl = document.getElementById('attendance-list');
    
    if (!classId) {
        listEl.innerHTML = '<p style="text-align: center; color: #666;">Select a class to mark attendance</p>';
        return;
    }
    
    listEl.innerHTML = '<div class="loading">Loading students and checking blockchain...</div>';
    
    try {
        // Parallel fetch: Students in class AND Existing attendance for the date
        const [studentsRes, attendanceRes] = await Promise.all([
            fetch(`/api/students/class/${classId}`),
            fetch(`/api/attendance/class/${classId}/date/${date}`)
        ]);

        const studentsData = await studentsRes.json();
        const attendanceData = await attendanceRes.json();
        
        // Create map of existing attendance: studentId -> status
        const attendanceMap = {};
        if (attendanceData.success && attendanceData.data) {
            attendanceData.data.forEach(record => {
                attendanceMap[record.studentId] = record.status;
            });
        }
        
        if (studentsData.success && studentsData.data.length > 0) {
            let html = '<div class="attendance-grid">';
            
            studentsData.data.forEach(student => {
                const existingStatus = attendanceMap[student.id];
                // Only consider it marked if status exists and is not "Not Marked"
                const isMarked = !!existingStatus && existingStatus !== 'Not Marked';
                
                // Status badge HTML with new CSS classes
                let statusBadge = '';
                if (isMarked) {
                    let icon = '🔒';
                    if (existingStatus === 'Present') icon = '✅';
                    else if (existingStatus === 'Absent') icon = '❌';
                    else if (existingStatus === 'Leave') icon = '📝';
                    
                    statusBadge = `<div class="status-badge ${existingStatus}">
                        <span>${icon}</span>
                        <span>${existingStatus}</span>
                    </div>`;
                }

                html += `
                    <div class="student-attendance ${isMarked ? 'marked' : ''}" id="attendance-${student.id}">
                        <div class="student-info">
                            <h4>${student.name}</h4>
                            <p>Roll: ${student.rollNumber} | ID: ${student.id}</p>
                        </div>
                        ${isMarked ? statusBadge : `
                        <div class="attendance-buttons">
                            <button class="btn-present" onclick="markAttendance('${student.id}', 'Present')">Present</button>
                            <button class="btn-absent" onclick="markAttendance('${student.id}', 'Absent')">Absent</button>
                            <button class="btn-leave" onclick="markAttendance('${student.id}', 'Leave')">Leave</button>
                        </div>
                        `}
                    </div>
                `;
            });
            
            html += '</div>';
            listEl.innerHTML = html;
        } else {
            listEl.innerHTML = '<p style="text-align: center; color: #666;">No students found in this class</p>';
        }
    } catch (error) {
        console.error(error);
        listEl.innerHTML = '<p style="color: red;">Error loading data</p>';
    }
}

async function markAttendance(studentId, status) {
    const date = document.getElementById('attendance-date').value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await authenticatedFetch('/api/attendance/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, status, date })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const studentEl = document.getElementById(`attendance-${studentId}`);
            if (studentEl) {
                // Remove buttons
                const buttons = studentEl.querySelector('.attendance-buttons');
                if (buttons) buttons.remove();
                
                // Add marked class
                studentEl.classList.add('marked');
                
                // Add status badge
                let icon = '🔒';
                if (status === 'Present') icon = '✅';
                else if (status === 'Absent') icon = '❌';
                else if (status === 'Leave') icon = '📝';
                
                const badge = document.createElement('div');
                badge.className = `status-badge ${status}`;
                badge.innerHTML = `<span>${icon}</span><span>${status}</span>`;
                
                studentEl.appendChild(badge);
            }
            showMessage('attendance-message', `Marked ${status} for student (by ${data.data.markedBy})`, 'success');
        } else {
            showMessage('attendance-message', data.message || 'Failed to mark attendance', 'error');
        }
    } catch (error) {
        showMessage('attendance-message', 'Error marking attendance', 'error');
    }
}

// Set default date for attendance
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('attendance-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        // Reload students/status when date changes
        dateInput.addEventListener('change', loadStudentsForAttendance);
    }
});

// =============================================
// BLOCKCHAIN VIEWER
// =============================================

async function updateEntitySelect() {
    const type = document.getElementById('blockchain-type').value;
    const entitySelect = document.getElementById('blockchain-entity');
    
    entitySelect.innerHTML = '<option value="">-- Select --</option>';
    
    if (!type) return;
    
    try {
        let response;
        if (type === 'department') {
            response = await fetch('/api/departments');
        } else if (type === 'class') {
            response = await fetch('/api/classes');
        } else if (type === 'student') {
            response = await fetch('/api/students');
        }
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(item => {
                const label = item.name + (item.rollNumber ? ` (${item.rollNumber})` : ` (${item.id})`);
                entitySelect.innerHTML += `<option value="${item.id}">${label}</option>`;
            });
        }
    } catch (error) {
        console.error('Failed to load entities:', error);
    }
}

async function viewBlockchain() {
    const type = document.getElementById('blockchain-type').value;
    const entityId = document.getElementById('blockchain-entity').value;
    const viewer = document.getElementById('blockchain-viewer');
    
    if (!type || !entityId) {
        viewer.innerHTML = '<p style="color: #666;">Please select type and entity</p>';
        return;
    }
    
    viewer.innerHTML = '<div class="loading">Loading blockchain...</div>';
    
    try {
        let url;
        if (type === 'department') {
            url = `/api/departments/${entityId}/blockchain`;
        } else if (type === 'class') {
            url = `/api/classes/${entityId}/blockchain`;
        } else if (type === 'student') {
            url = `/api/students/${entityId}/blockchain`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            displayBlockchain(data.data, type);
        } else {
            viewer.innerHTML = `<p style="color: red;">${data.message || 'Failed to load blockchain'}</p>`;
        }
    } catch (error) {
        viewer.innerHTML = '<p style="color: red;">Error loading blockchain</p>';
    }
}

function displayBlockchain(data, type) {
    const viewer = document.getElementById('blockchain-viewer');
    
    // Get the correct entity object based on type
    const entity = data.department || data.class || data.student;
    
    // Get the chain array
    const chain = entity.chain || [];
    
    let html = '<div class="blockchain-viewer">';
    html += `<h3 style="margin-bottom: 20px; color: #4a5568;">Blockchain for: <span style="color: #667eea;">${entity.name || 'Unknown'}</span></h3>`;
    
    // Show entity details
    if (type === 'student' && data.student) {
        html += `
            <div style="margin-bottom: 25px; padding: 15px; background: #ebf8ff; border-left: 4px solid #4299e1; border-radius: 4px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    <div><strong>Student:</strong> ${data.student.name}</div>
                    <div><strong>Roll:</strong> ${data.student.rollNumber}</div>
                    <div><strong>Class ID:</strong> ${data.student.classId}</div>
                    <div><strong>Dept ID:</strong> ${data.student.departmentId}</div>
                    <div><strong>Total Present:</strong> ${data.student.metadata?.totalPresent || 0}</div>
                </div>
            </div>
        `;
    }
    
    html += '<div class="chain-container" style="display: flex; flex-direction: column; gap: 20px; position: relative;">';
    
    if (chain.length === 0) {
        html += '<div class="no-data">No blocks found in this chain</div>';
    } else {
        chain.forEach((block, index) => {
            const isGenesis = index === 0;
            const shortHash = block.hash.substring(0, 15) + '...';
            const shortPrevHash = block.prev_hash.substring(0, 15) + '...';
            
            html += `
                <div class="block-card" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; z-index: 2;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #edf2f7; padding-bottom: 10px;">
                        <div>
                            <span style="background: ${isGenesis ? '#48bb78' : '#667eea'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">
                                ${isGenesis ? 'Genesis Block' : 'Block #' + block.index}
                            </span>
                            <div style="font-size: 0.8em; color: #a0aec0; margin-top: 5px;">
                                ${new Date(block.timestamp).toLocaleString()}
                            </div>
                        </div>
                        <div style="text-align: right; font-family: monospace; font-size: 0.85em; color: #718096;">
                            <div>Hash: <span style="color: #2d3748; font-weight: bold;">${shortHash}</span></div>
                            <div style="font-size: 0.9em;">Prev: ${shortPrevHash}</div>
                            <div style="font-size: 0.9em;">Nonce: ${block.nonce}</div>
                        </div>
                    </div>
                    
                    <div class="block-data">
                        <h4 style="font-size: 0.9em; text-transform: uppercase; color: #a0aec0; margin-bottom: 8px;">Transactions</h4>
                        <div style="background: #f7fafc; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9em; overflow-x: auto;">
                            ${renderBlockData(block.transactions)}
                        </div>
                    </div>
                </div>
                
                ${index < chain.length - 1 ? `
                    <div style="height: 30px; width: 2px; background: #cbd5e0; margin: 0 auto; position: relative; z-index: 1;"></div>
                    <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #cbd5e0; margin: -5px auto 0;"></div>
                ` : ''}
            `;
        });
    }
    
    html += '</div></div>';
    
    viewer.innerHTML = html;
}

function renderBlockData(data) {
    if (!data) return 'No data';
    
    // Format common transaction fields
    let formattedHtml = '';
    
    if (data.type) {
        let typeColor = '#4299e1'; // Default blue
        if (data.type.includes('created')) typeColor = '#48bb78'; // Green
        else if (data.type.includes('deleted')) typeColor = '#f56565'; // Red
        else if (data.type === 'attendance') typeColor = '#ed8936'; // Orange
        
        formattedHtml += `<div style="color: ${typeColor}; font-weight: bold; margin-bottom: 5px;">Type: ${data.type}</div>`;
    }
    
    if (data.action) formattedHtml += `<div>Action: ${data.action}</div>`;
    if (data.status) formattedHtml += `<div>Status: <strong>${data.status}</strong></div>`;
    
    // Attendance specific
    if (data.type === 'attendance') {
        formattedHtml += `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px dashed #cbd5e0;">`;
        formattedHtml += `<div>Date: ${data.date}</div>`;
        formattedHtml += `<div>Marked By: ${data.markedBy || 'Unknown'}</div>`;
        formattedHtml += `</div>`;
    }
    
    // Exclude redundant fields for cleaner display
    const exclude = ['type', 'action', 'status', 'timestamp', 'studentId', 'studentName', 'rollNumber', 'classId', 'departmentId'];
    
    const otherKeys = Object.keys(data).filter(k => !exclude.includes(k));
    
    if (otherKeys.length > 0) {
        formattedHtml += `<div style="margin-top: 5px; font-size: 0.85em; color: #718096;">`;
        otherKeys.forEach(key => {
            if (typeof data[key] === 'object') {
                formattedHtml += `<div>${key}: ${JSON.stringify(data[key]).substring(0, 50)}${JSON.stringify(data[key]).length > 50 ? '...' : ''}</div>`;
            } else {
                formattedHtml += `<div>${key}: ${data[key]}</div>`;
            }
        });
        formattedHtml += `</div>`;
    }
    
    return formattedHtml || JSON.stringify(data, null, 2);
}

// =============================================
// VALIDATION
// =============================================

async function validateBlockchain() {
    const resultEl = document.getElementById('validation-result');
    resultEl.innerHTML = '<div class="loading">Validating blockchain...</div>';
    
    try {
        const response = await fetch('/api/system/validate');
        const data = await response.json();
        
        if (data.success) {
            const isValid = data.validation.isValid;
            const errorMsg = data.validation.errors && data.validation.errors.length > 0 
                ? data.validation.errors.join('<br>') 
                : 'Validation failed.';
                
            resultEl.innerHTML = `
                <div class="validation-result ${isValid ? 'valid' : 'invalid'}">
                    <h3>${isValid ? '✅ Blockchain Valid' : '❌ Blockchain Invalid'}</h3>
                    <p>${isValid ? 'All chains are properly linked and verified.' : errorMsg}</p>
                </div>
            `;
        } else {
            resultEl.innerHTML = `<p style="color: red;">${data.message}</p>`;
        }
    } catch (error) {
        resultEl.innerHTML = '<p style="color: red;">Error validating blockchain</p>';
    }
}

// =============================================
// TREE VISUALIZATION (placeholder)
// =============================================

async function visualizeBlockchainTree() {
    const container = document.getElementById('blockchain-tree');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Generating complete blockchain tree...</div>';
    
    try {
        // Ensure we have all data
        if (allDepartments.length === 0) await loadDepartments();
        if (allClasses.length === 0) await loadClasses();
        if (allStudents.length === 0) await loadStudents();
        
        // Build hierarchy
        const tree = allDepartments.map(dept => {
            const deptClasses = allClasses.filter(c => c.departmentId === dept.id);
            return {
                ...dept,
                classes: deptClasses.map(cls => {
                    const classStudents = allStudents.filter(s => s.classId === cls.id);
                    return {
                        ...cls,
                        students: classStudents
                    };
                })
            };
        });
        
        // Generate HTML
        let html = `
            <div class="tree-stats">
                <div class="tree-stat-item">
                    <div class="tree-stat-number">${allDepartments.length}</div>
                    <div class="tree-stat-label">Departments</div>
                </div>
                <div class="tree-stat-item">
                    <div class="tree-stat-number">${allClasses.length}</div>
                    <div class="tree-stat-label">Classes</div>
                </div>
                <div class="tree-stat-item">
                    <div class="tree-stat-number">${allStudents.length}</div>
                    <div class="tree-stat-label">Students</div>
                </div>
            </div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-color layer-1"></div>
                    <span>Department Chain</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color layer-2"></div>
                    <span>Class Chain</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color layer-3"></div>
                    <span>Student Chain</span>
                </div>
            </div>
            
            <div class="tree-container">
                <div class="tree-diagram">
        `;
        
        if (tree.length === 0) {
            html += '<p style="text-align: center; color: #666; padding: 20px;">No blockchain data available to visualize.</p>';
        } else {
            // Level 1: Departments
            html += '<div class="tree-level">';
            
            tree.forEach(dept => {
                html += `
                    <div class="tree-branch">
                        <div class="tree-node layer-1" onclick="viewDepartmentBlockchain('${dept.id}')" style="cursor: pointer;">
                            <div class="tree-node-title">${dept.name}</div>
                            <div class="tree-node-id">${dept.id}</div>
                            <div class="tree-node-info">${dept.classes.length} Classes</div>
                        </div>
                        
                        ${dept.classes.length > 0 ? `
                            <div class="tree-children">
                                ${dept.classes.map(cls => `
                                    <div class="tree-child-group">
                                        <div class="tree-node layer-2" onclick="viewClassBlockchain('${cls.id}')" style="cursor: pointer;">
                                            <div class="tree-node-title">${cls.name}</div>
                                            <div class="tree-node-id">${cls.id}</div>
                                            <div class="tree-node-info">${cls.students.length} Students</div>
                                        </div>
                                        
                                        ${cls.students.length > 0 ? `
                                            <div class="tree-children">
                                                ${cls.students.map(student => `
                                                    <div class="tree-child-group">
                                                        <div class="tree-node layer-3" onclick="viewStudentBlockchain('${student.id}')" style="cursor: pointer;">
                                                            <div class="tree-node-title">${student.name}</div>
                                                            <div class="tree-node-id">${student.rollNumber}</div>
                                                            <div class="tree-node-info">ID: ${student.id}</div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            
            html += '</div>'; // End tree-level
        }
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Tree generation error:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Error generating tree view. Please try reloading data.</p>';
    }
}