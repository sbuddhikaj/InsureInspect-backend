// InsureInspect - Admin Dashboard Logic (Updated with Auth & User Management)

document.addEventListener('DOMContentLoaded', () => {
    // State Store
    let allJobs = [];
    let allUsers = [];
    let selectedJob = null;
    let selectedUser = null;

    // DOM Elements
    const authOverlay = document.getElementById('auth-overlay');
    const adminLoginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');
    
    const appContainer = document.querySelector('.app-container');
    const adminDisplayName = document.getElementById('admin-display-name');
    const btnLogout = document.getElementById('btn-logout');
    
    // View Panels & Navigation
    const navDashboard = document.getElementById('nav-dashboard');
    const navUsers = document.getElementById('nav-users');
    const navCalendar = document.getElementById('nav-calendar');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewUsers = document.getElementById('view-users');
    const viewCalendar = document.getElementById('view-calendar');
    
    // Dashboard Elements
    const claimsTableBody = document.getElementById('claims-list-body');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterInvestigator = document.getElementById('filter-investigator');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statProgress = document.getElementById('stat-progress');
    const statCompleted = document.getElementById('stat-completed');
    
    // Dispatch Modal Elements
    const dispatchModal = document.getElementById('dispatch-modal');
    const btnOpenDispatch = document.getElementById('btn-open-dispatch');
    const btnCloseDispatch = document.getElementById('btn-close-dispatch');
    const btnCancelDispatch = document.getElementById('btn-cancel-dispatch');
    const dispatchForm = document.getElementById('dispatch-form');
    const investigatorIdSelect = document.getElementById('investigatorId');
    
    // User Modal Elements
    const userModal = document.getElementById('user-modal');
    const userModalTitle = document.getElementById('user-modal-title');
    const btnOpenUserModal = document.getElementById('btn-open-user-modal');
    const btnCloseUser = document.getElementById('btn-close-user');
    const btnCancelUser = document.getElementById('btn-cancel-user');
    const userForm = document.getElementById('user-form');
    const userIdField = document.getElementById('user-id-field');
    const userUsernameInput = document.getElementById('user-username');
    const userPasswordInput = document.getElementById('user-password');
    const userFullnameInput = document.getElementById('user-fullname');
    const userRoleSelect = document.getElementById('user-role');
    const userStatusSelect = document.getElementById('user-status');
    const userStatusGroup = document.getElementById('user-status-group');
    const passwordHelp = document.getElementById('password-help');
    
    // Users List Body
    const usersListBody = document.getElementById('users-list-body');
    
    // Details Drawer Elements
    const detailsDrawer = document.getElementById('details-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const btnCloseDrawerBottom = document.getElementById('btn-close-drawer-bottom');
    const btnDeleteJob = document.getElementById('btn-delete-job');
    const btnExportPdf = document.getElementById('btn-export-pdf');
    const btnExportExcel = document.getElementById('btn-export-excel');
    
    // Detail Data Elements
    const detailTitle = document.getElementById('detail-title');
    const detailStatusBadge = document.getElementById('detail-status-badge');
    const detailClientName = document.getElementById('detail-client-name');
    const detailPolicy = document.getElementById('detail-policy');
    const detailPhone = document.getElementById('detail-phone');
    const detailUpdated = document.getElementById('detail-updated');
    const detailAddress = document.getElementById('detail-address');
    const detailClaimDetails = document.getElementById('detail-claim-details');
    
    // Reassignment Form Elements
    const reassignForm = document.getElementById('reassign-form');
    const reassignJobId = document.getElementById('reassign-job-id');
    const reassignInvestigator = document.getElementById('reassign-investigator');
    const reassignDate = document.getElementById('reassign-date');
    
    // Findings & Checklist Elements
    const findingsSection = document.getElementById('findings-section');
    const detailSeverity = document.getElementById('detail-severity');
    const checkStructural = document.getElementById('check-structural');
    const checkRoof = document.getElementById('check-roof');
    const checkWater = document.getElementById('check-water');
    const detailNotes = document.getElementById('detail-notes');
    
    // Gallery Elements
    const gallerySection = document.getElementById('gallery-section');
    const photoCount = document.getElementById('photo-count');
    const photoNotesList = document.getElementById('photo-notes-list');
    
    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const btnCloseLightbox = document.getElementById('btn-close-lightbox');
    
    // Refresh Nav Button
    const btnRefreshNav = document.getElementById('btn-refresh-nav');
    const navAnalytics = document.getElementById('nav-analytics');
    const viewAnalytics = document.getElementById('view-analytics');
    const btnRefreshAnalytics = document.getElementById('btn-refresh-analytics');

    // Chart instances (destroy before recreating)
    let chartStatus = null, chartInvestigator = null, chartMonthly = null, chartVisits = null, chartDamage = null;

    // -------------------------------------------------------------
    // Session / Auth Validation
    // -------------------------------------------------------------
    
    function checkAuth() {
        const storedUser = sessionStorage.getItem('admin_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            adminDisplayName.textContent = user.fullName;
            authOverlay.classList.remove('active');
            appContainer.style.display = 'flex';
            
            // Fetch database contents
            fetchUsers().then(() => {
                fetchClaims();
            });
        } else {
            appContainer.style.display = 'none';
            authOverlay.classList.add('active');
        }
    }

    // Admin Login submission
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        
        const credentials = {
            username: document.getElementById('login-username').value.trim(),
            password: document.getElementById('login-password').value
        };

        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        })
        .then(res => {
            if (res.status === 401 || res.status === 403) {
                throw new Error('Invalid username or password');
            }
            if (!res.ok) throw new Error('Authentication failed');
            return res.json();
        })
        .then(user => {
            if (user.role !== 'ADMIN') {
                throw new Error('Access denied. Administrator role required.');
            }
            sessionStorage.setItem('admin_user', JSON.stringify(user));
            checkAuth();
        })
        .catch(err => {
            console.error(err);
            loginError.textContent = err.message || 'Authentication error';
            loginError.style.display = 'block';
        });
    });

    // Admin Logout
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.clear();
        window.location.reload();
    });

    // Initial check
    checkAuth();

    // -------------------------------------------------------------
    // View Swapping Panel controls
    // -------------------------------------------------------------
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        navDashboard.classList.add('active');
        navUsers.classList.remove('active');
        navCalendar.classList.remove('active');
        navAnalytics.classList.remove('active');
        viewDashboard.style.display = 'block';
        viewUsers.style.display = 'none';
        viewCalendar.style.display = 'none';
        viewAnalytics.style.display = 'none';
        fetchClaims();
    });

    navUsers.addEventListener('click', (e) => {
        e.preventDefault();
        navUsers.classList.add('active');
        navDashboard.classList.remove('active');
        navCalendar.classList.remove('active');
        navAnalytics.classList.remove('active');
        viewUsers.style.display = 'block';
        viewDashboard.style.display = 'none';
        viewCalendar.style.display = 'none';
        viewAnalytics.style.display = 'none';
        fetchUsers();
    });

    navCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        navCalendar.classList.add('active');
        navDashboard.classList.remove('active');
        navUsers.classList.remove('active');
        navAnalytics.classList.remove('active');
        viewCalendar.style.display = 'block';
        viewDashboard.style.display = 'none';
        viewUsers.style.display = 'none';
        viewAnalytics.style.display = 'none';
        renderCalendar();
    });

    navAnalytics.addEventListener('click', (e) => {
        e.preventDefault();
        navAnalytics.classList.add('active');
        navDashboard.classList.remove('active');
        navUsers.classList.remove('active');
        navCalendar.classList.remove('active');
        viewAnalytics.style.display = 'block';
        viewDashboard.style.display = 'none';
        viewUsers.style.display = 'none';
        viewCalendar.style.display = 'none';
        renderAnalytics();
    });

    btnRefreshAnalytics && btnRefreshAnalytics.addEventListener('click', () => {
        renderAnalytics();
    });

    // -------------------------------------------------------------
    // REST API calls
    // -------------------------------------------------------------
    
    // Fetch all claims from backend
    function fetchClaims() {
        renderClaimsLoading();
        fetch('/api/jobs')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch jobs');
                return res.json();
            })
            .then(data => {
                allJobs = data;
                updateStats(data);
                renderClaimsTable(data);
            })
            .catch(err => {
                console.error(err);
                renderClaimsError('Could not load inspection claims from server. Make sure the backend is running.');
            });
    }

    // Fetch details of a single claim
    function fetchClaimDetails(id) {
        fetch(`/api/jobs/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch job details');
                return res.json();
            })
            .then(job => {
                selectedJob = job;
                populateDetailsDrawer(job);
            })
            .catch(err => {
                console.error(err);
                alert('Could not load full claim details.');
            });
    }

    // Fetch all users
    function fetchUsers() {
        renderUsersLoading();
        return fetch('/api/users')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch users');
                return res.json();
            })
            .then(data => {
                allUsers = data;
                populateDropdowns(data);
                renderUsersTable(data);
            })
            .catch(err => {
                console.error(err);
                renderUsersError('Could not load users list from server.');
            });
    }

    // Submit Dispatch (Create new job)
    dispatchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newJob = {
            title: document.getElementById('title').value.trim(),
            clientName: document.getElementById('clientName').value.trim(),
            address: document.getElementById('address').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            policyNumber: document.getElementById('policyNumber').value.trim(),
            claimDetails: document.getElementById('claimDetails').value.trim(),
            scheduledDate: document.getElementById('scheduledDate').value,
            investigatorId: investigatorIdSelect.value,
        };

        fetch('/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newJob)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to dispatch job');
            return res.json();
        })
        .then(data => {
            closeDispatchModal();
            fetchClaims();
            alert(`Claim successfully dispatched to ${newJob.investigatorId}!`);
        })
        .catch(err => {
            console.error(err);
            alert('Failed to dispatch job. Try again.');
        });
    });

    // Reassign Investigator / Change Date
    reassignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const jobId = reassignJobId.value;
        const investigatorId = reassignInvestigator.value;
        const scheduledDate = reassignDate.value;

        if (!jobId || !investigatorId || !scheduledDate) return;

        fetch(`/api/jobs/${jobId}/assign?investigatorId=${investigatorId}&scheduledDate=${scheduledDate}`, {
            method: 'PUT'
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to update assignment');
            return res.json();
        })
        .then(updatedJob => {
            fetchClaims(); 
            fetchClaimDetails(jobId);
            alert(`Assignment updated successfully.`);
        })
        .catch(err => {
            console.error(err);
            alert('Failed to update assignment.');
        });
    });

    // Delete inspection claim
    btnDeleteJob.addEventListener('click', () => {
        if (!selectedJob) return;
        if (!confirm(`Are you sure you want to permanently delete the claim for ${selectedJob.clientName}?`)) {
            return;
        }

        fetch(`/api/jobs/${selectedJob.id}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete job');
            closeDrawer();
            fetchClaims();
            alert('Claim deleted successfully.');
        })
        .catch(err => {
            console.error(err);
            alert('Failed to delete claim.');
        });
    });

    // Create or Update User
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userId = userIdField.value;
        const isEditing = userId !== '';
        
        const userData = {
            username: userUsernameInput.value.trim(),
            fullName: userFullnameInput.value.trim(),
            role: userRoleSelect.value,
        };

        if (userPasswordInput.value.trim() !== '') {
            userData.password = userPasswordInput.value;
        } else if (!isEditing) {
            alert('Password is required for new users.');
            return;
        }

        if (isEditing) {
            userData.active = userStatusSelect.value === 'true';
        }

        const url = isEditing ? `/api/users/${userId}` : '/api/users';
        const method = isEditing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Operation failed');
            }
            return res.json();
        })
        .then(savedUser => {
            closeUserModal();
            fetchUsers();
            alert(`User account ${isEditing ? 'updated' : 'created'} successfully.`);
        })
        .catch(err => {
            console.error(err);
            alert(`Failed: ${err.message}`);
        });
    });

    // Delete User
    function deleteUser(id, username) {
        if (!confirm(`Are you sure you want to permanently delete user "${username}"?`)) {
            return;
        }

        fetch(`/api/users/${id}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete user');
            fetchUsers();
            alert('User account deleted.');
        })
        .catch(err => {
            console.error(err);
            alert('Failed to delete user.');
        });
    }

    // -------------------------------------------------------------
    // UI Rendering
    // -------------------------------------------------------------

    // Populate Dynamic dropdowns with loaded users
    function populateDropdowns(users) {
        const investigators = users.filter(u => u.role === 'INVESTIGATOR' && u.active);
        
        // 1. Dispatch Modal Investigator Dropdown
        investigatorIdSelect.innerHTML = investigators.map(u => 
            `<option value="${u.username}">${escapeHtml(u.fullName)} (${escapeHtml(u.username)})</option>`
        ).join('');
        
        // 2. Drawer Reassignment Dropdown
        reassignInvestigator.innerHTML = investigators.map(u => 
            `<option value="${u.username}">${escapeHtml(u.fullName)}</option>`
        ).join('');
        
        // 3. Claims Filter Investigator Dropdown
        const selectedFilterVal = filterInvestigator.value;
        filterInvestigator.innerHTML = '<option value="All">All Investigators</option>' + investigators.map(u => 
            `<option value="${u.username}">${escapeHtml(u.fullName)}</option>`
        ).join('');
        filterInvestigator.value = selectedFilterVal;
    }

    // Update Top Stat Metrics
    function updateStats(jobs) {
        statTotal.textContent = jobs.length;
        statPending.textContent = jobs.filter(j => j.status === 'Pending').length;
        statProgress.textContent = jobs.filter(j => j.status === 'In_Progress' || j.status === 'In Progress').length;
        statCompleted.textContent = jobs.filter(j => j.status === 'Completed').length;
    }

    // Render Table Body
    function renderClaimsTable(jobs) {
        claimsTableBody.innerHTML = '';
        
        const filteredJobs = jobs.filter(job => {
            // Status Filter
            const matchesStatus = filterStatus.value === 'All' || job.status.toLowerCase() === filterStatus.value.toLowerCase();
            
            // Investigator Filter
            const matchesInvestigator = filterInvestigator.value === 'All' || job.investigatorId === filterInvestigator.value;
            
            // Search Input Filter
            const searchLower = searchInput.value.toLowerCase().trim();
            const matchesSearch = searchLower === '' ||
                job.clientName.toLowerCase().includes(searchLower) ||
                job.title.toLowerCase().includes(searchLower) ||
                job.address.toLowerCase().includes(searchLower) ||
                (job.policyNumber && job.policyNumber.toLowerCase().includes(searchLower));
                
            return matchesStatus && matchesInvestigator && matchesSearch;
        });

        if (filteredJobs.length === 0) {
            claimsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fa-solid fa-folder-open" style="font-size: 24px; display: block; margin-bottom: 10px; color: var(--text-muted);"></i>
                        No claims match your current filters.
                    </td>
                </tr>
            `;
            return;
        }

        filteredJobs.forEach(job => {
            const tr = document.createElement('tr');
            
            // Resolve investigator name from list
            const user = allUsers.find(u => u.username === job.investigatorId);
            const investigatorDisplay = user ? user.fullName : job.investigatorId;
            
            const statusClass = job.status.toLowerCase();
            const statusDisplay = job.status.replace('_', ' ');

            tr.innerHTML = `
                <td><strong>#${job.id}</strong></td>
                <td>${escapeHtml(job.clientName)}</td>
                <td>${escapeHtml(job.title)}</td>
                <td><i class="fa-regular fa-calendar-days"></i> ${job.scheduledDate}</td>
                <td>${escapeHtml(investigatorDisplay)}</td>
                <td><span class="badge ${statusClass}">${statusDisplay}</span></td>
                <td><button class="btn btn-secondary btn-icon-only view-details-row-btn" data-id="${job.id}"><i class="fa-solid fa-eye"></i> View</button></td>
            `;

            tr.addEventListener('click', (e) => {
                if (e.target.closest('.btn')) return;
                openDetailsDrawer(job.id);
            });

            claimsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.view-details-row-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openDetailsDrawer(btn.getAttribute('data-id'));
            });
        });
    }

    // Populate Details View sliding drawer
    function populateDetailsDrawer(job) {
        detailTitle.textContent = job.title;
        detailClientName.textContent = job.clientName;
        detailPolicy.textContent = job.policyNumber || 'N/A';
        detailPhone.textContent = job.phone || 'N/A';
        detailUpdated.textContent = formatDateTime(job.updatedAt);
        detailAddress.textContent = job.address;
        detailClaimDetails.textContent = job.claimDetails;
        
        detailStatusBadge.className = `badge ${job.status.toLowerCase()}`;
        detailStatusBadge.textContent = job.status.replace('_', ' ');
        
        reassignJobId.value = job.id;
        reassignInvestigator.value = job.investigatorId;
        reassignDate.value = job.scheduledDate;
        
        if (job.status === 'Completed' || job.status === 'In_Progress' || job.status === 'In Progress') {
            btnExportPdf.style.display = 'inline-flex';
            btnExportExcel.style.display = 'inline-flex';
        } else {
            btnExportPdf.style.display = 'none';
            btnExportExcel.style.display = 'none';
        }
        
        const isNotPending = job.status !== 'Pending';
        
        // Dynamic fetch of new DOM elements
        const siteVisitsSection = document.getElementById('site-visits-section');
        const visitCount = document.getElementById('visit-count');
        const siteVisitsList = document.getElementById('site-visits-list');

        function normalizePhotoUrl(url) {
            if (!url) return '';
            let cleanUrl = url;
            if (cleanUrl.includes('://')) {
                const proto = cleanUrl.split('://')[0];
                const rest = cleanUrl.split('://')[1];
                cleanUrl = proto + '://' + rest.replace(/\/+/g, '/');
            } else {
                cleanUrl = cleanUrl.replace(/\/+/g, '/');
            }
            return cleanUrl;
        }

        if (isNotPending && job.siteVisits && job.siteVisits.length > 0) {
            // New multi-visit model
            siteVisitsSection.style.display = 'block';
            findingsSection.style.display = 'none';
            gallerySection.style.display = 'none'; // hide legacy sections
            
            visitCount.textContent = job.siteVisits.length;
            siteVisitsList.innerHTML = '';

            job.siteVisits.forEach((sv, idx) => {
                const svCard = document.createElement('div');
                svCard.className = 'visit-card-details';
                svCard.style.border = '1px solid var(--border)';
                svCard.style.borderRadius = '10px';
                svCard.style.padding = '15px';
                svCard.style.marginBottom = '15px';
                svCard.style.background = 'var(--bg-card)';

                let firstVisitInfoHtml = '';
                if (sv.siteRoomType) {
                    let sitePhotoHtml = '';
                    if (sv.sitePhotoUrl) {
                        const cleanPhoto = normalizePhotoUrl(sv.sitePhotoUrl);
                        sitePhotoHtml = `
                            <div class="site-photo-container mt-2 mb-2" style="max-width: 150px; cursor: pointer;" data-src="${cleanPhoto}" data-caption="Site Photo: ${escapeHtml(sv.siteRoomType)}">
                                <img src="${cleanPhoto}" alt="Site Photo" style="max-width: 150px; border-radius: 8px; border: 1px solid var(--border);" class="site-photo-thumbnail">
                            </div>
                        `;
                    }
                    firstVisitInfoHtml = `
                        <div class="first-visit-info-box mt-2 mb-3" style="padding: 10px; background: rgba(0, 0, 0, 0.02); border-radius: 6px;">
                            <span class="info-label" style="font-weight:600; color:var(--primary); font-size:12px;"><i class="fa-solid fa-house-laptop"></i> First Visit Details</span>
                            <div style="font-size: 13px; margin-top: 5px;">
                                <strong>Room Type:</strong> ${escapeHtml(sv.siteRoomType)}<br/>
                                <strong>Other Areas:</strong> ${escapeHtml(sv.otherLocationsData || 'N/A')}
                            </div>
                            ${sitePhotoHtml}
                        </div>
                    `;
                }

                // Checklists HTML
                const structIcon = sv.structuralDamage ? '<i class="fa-solid fa-circle-check icon-yes"></i>' : '<i class="fa-solid fa-circle-xmark icon-no"></i>';
                const roofIcon = sv.roofDamage ? '<i class="fa-solid fa-circle-check icon-yes"></i>' : '<i class="fa-solid fa-circle-xmark icon-no"></i>';
                const waterIcon = sv.waterDamage ? '<i class="fa-solid fa-circle-check icon-yes"></i>' : '<i class="fa-solid fa-circle-xmark icon-no"></i>';
                
                const sev = sv.damageSeverity || 'Low';

                // Control Readings HTML
                let readingsHtml = '';
                if (sv.moisture !== null || sv.temperature !== null || sv.humidity !== null) {
                    readingsHtml = `
                        <div class="readings-box mt-2 mb-2" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            ${sv.moisture !== null ? `<span class="badge" style="background-color: var(--primary); color: #fff; font-size:11px; font-weight: normal; padding: 3px 8px; border-radius: 4px;">Moisture: ${sv.moisture}%</span>` : ''}
                            ${sv.temperature !== null ? `<span class="badge" style="background-color: var(--primary); color: #fff; font-size:11px; font-weight: normal; padding: 3px 8px; border-radius: 4px;">Temp: ${sv.temperature}°F</span>` : ''}
                            ${sv.humidity !== null ? `<span class="badge" style="background-color: var(--primary); color: #fff; font-size:11px; font-weight: normal; padding: 3px 8px; border-radius: 4px;">Humidity: ${sv.humidity}%</span>` : ''}
                        </div>
                    `;
                }

                // Inspected Rooms/Locations HTML
                let roomsListHtml = '';
                if (sv.roomLocations && sv.roomLocations.length > 0) {
                    let roomsHtml = '';
                    sv.roomLocations.forEach((rl, rlIdx) => {
                        // Equipments HTML
                        let equipmentsHtml = '';
                        if (rl.equipments && rl.equipments.length > 0) {
                            let eqListHtml = '';
                            rl.equipments.forEach(eq => {
                                eqListHtml += `
                                    <li style="font-size: 12px; margin-bottom: 4px; list-style-type: disc;">
                                        <strong>${escapeHtml(eq.name)}</strong> 
                                        ${eq.serialNumber ? `(S/N: ${escapeHtml(eq.serialNumber)})` : ''} 
                                        - <span style="font-weight: bold; color: ${eq.status?.toUpperCase() === 'RUNNING' ? 'green' : 'red'};"><strong>${escapeHtml(eq.status)}</strong></span>
                                        ${eq.notes ? `<div style="color: var(--text-muted); font-size: 11px; margin-left: 10px;">${escapeHtml(eq.notes)}</div>` : ''}
                                    </li>
                                `;
                            });
                            equipmentsHtml = `
                                <div class="room-equipments mt-2">
                                    <strong style="font-size: 12px; color: var(--primary);"><i class="fa-solid fa-tools"></i> Deployed Equipment:</strong>
                                    <ul style="margin: 4px 0 0 16px; padding: 0;">
                                        ${eqListHtml}
                                    </ul>
                                </div>
                            `;
                        }

                        // Inventory Items for this room
                        let inventoryHtml = '';
                        if (rl.inventoryItems && rl.inventoryItems.length > 0) {
                            let invRowsHtml = '';
                            rl.inventoryItems.forEach(item => {
                                const lossClass = item.lossType && item.lossType.toLowerCase().includes('non') ? 'non-salvageable' : 'salvageable';
                                invRowsHtml += `
                                    <div class="inventory-item-row">
                                        <span class="inv-item-name">${escapeHtml(item.name)}</span>
                                        <div class="inv-item-meta">
                                            ${item.category ? `<span class="inv-badge category">${escapeHtml(item.category)}</span>` : ''}
                                            <span class="inv-badge qty">x${item.quantity || 1}</span>
                                            ${item.lossType ? `<span class="inv-badge ${lossClass}">${escapeHtml(item.lossType)}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            });
                            inventoryHtml = `
                                <div class="inventory-summary-box mt-2">
                                    <span class="inv-label"><i class="fa-solid fa-boxes-stacked"></i> Cataloged Inventory (${rl.inventoryItems.length} items)</span>
                                    <div class="inventory-items-list">${invRowsHtml}</div>
                                </div>
                            `;
                        }

                        // Photo Notes for this room
                        let roomPhotosHtml = '';
                        if (rl.photoNotes && rl.photoNotes.length > 0) {
                            let photosListHtml = '';
                            rl.photoNotes.forEach(note => {
                                if (note.photos) {
                                    note.photos.forEach(p => {
                                        const cleanP = normalizePhotoUrl(p.downloadUrl);
                                        photosListHtml += `
                                            <div class="photo-note-item mt-2" style="display: flex; gap: 12px; border: 1px solid var(--border); padding: 8px; border-radius: 8px; margin-bottom: 8px; background: rgba(0,0,0,0.01);">
                                                <div class="photo-thumbnail-container" data-src="${cleanP}" data-caption="${escapeHtml(note.caption)}" style="cursor: pointer; width: 60px; height: 60px; flex-shrink: 0; overflow: hidden; border-radius: 6px; border: 1px solid var(--border);">
                                                    <img src="${cleanP}" alt="${escapeHtml(note.caption)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
                                                </div>
                                                <div class="photo-note-info">
                                                    <h4 style="font-size: 13px; font-weight: 600; margin: 0 0 3px 0;">
                                                        ${escapeHtml(note.caption)}
                                                        ${(note.location || note.subLocation) ? `
                                                            <span style="font-size: 10px; margin-left: 6px; padding: 2px 6px; background: var(--color-completed-glow); color: var(--color-completed); border-radius: 4px; font-weight: 600; display: inline-block; border: 1px solid rgba(16, 185, 129, 0.2);">
                                                                <i class="fa-solid fa-location-crosshairs" style="font-size: 9px;"></i> 
                                                                ${escapeHtml(note.location || '')} ${note.location && note.subLocation ? '•' : ''} ${escapeHtml(note.subLocation || '')}
                                                            </span>` : ''}
                                                    </h4>
                                                    <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${escapeHtml(note.note || 'No additional note description.')}</p>
                                                </div>
                                            </div>
                                        `;
                                    });
                                }
                            });
                            roomPhotosHtml = `
                                <div class="room-photos mt-2">
                                    <strong style="font-size: 12px; color: var(--primary);"><i class="fa-solid fa-images"></i> Room Photo Notes:</strong>
                                    <div style="margin-top: 6px; display: flex; flex-direction: column;">
                                        ${photosListHtml}
                                    </div>
                                </div>
                            `;
                        }

                        roomsHtml += `
                            <div class="room-card mt-2 mb-3" style="padding: 12px; border: 1px dashed var(--border); border-radius: 8px; background: #fff;">
                                <div style="font-weight: 600; font-size: 13px; color: var(--primary); display: flex; justify-content: space-between;">
                                    <span><i class="fa-solid fa-door-open"></i> ${escapeHtml(rl.roomType)}</span>
                                    <span style="color: var(--text-muted); font-size: 12px;">${escapeHtml(rl.dimensions || 'Dimensions: N/A')}</span>
                                </div>
                                ${rl.details ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;"><strong>Notes:</strong> ${escapeHtml(rl.details)}</div>` : ''}
                                ${equipmentsHtml}
                                ${inventoryHtml}
                                ${roomPhotosHtml}
                            </div>
                        `;
                    });
                    roomsListHtml = `
                        <div class="visit-rooms mt-3">
                            <span class="info-label" style="font-weight:600; color:var(--primary); font-size:12px;"><i class="fa-solid fa-door-closed"></i> Inspected Rooms & Areas</span>
                            ${roomsHtml}
                        </div>
                    `;
                }

                // General Photo Notes for this visit (legacy fallback)
                let svGalleryHtml = '';
                if (sv.photoNotes && sv.photoNotes.length > 0) {
                    let visitPhotosListHtml = '';
                    sv.photoNotes.forEach(note => {
                        if (note.photos) {
                            note.photos.forEach(p => {
                                const cleanP = normalizePhotoUrl(p.downloadUrl);
                                visitPhotosListHtml += `
                                    <div class="photo-note-item mt-2" style="display: flex; gap: 12px; border: 1px solid var(--border); padding: 8px; border-radius: 8px; margin-bottom: 8px; background: rgba(0,0,0,0.01);">
                                        <div class="photo-thumbnail-container" data-src="${cleanP}" data-caption="${escapeHtml(note.caption)}" style="cursor: pointer; width: 60px; height: 60px; flex-shrink: 0; overflow: hidden; border-radius: 6px; border: 1px solid var(--border);">
                                            <img src="${cleanP}" alt="${escapeHtml(note.caption)}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
                                        </div>
                                        <div class="photo-note-info">
                                            <h4 style="font-size: 13px; font-weight: 600; margin: 0 0 3px 0;">
                                                ${escapeHtml(note.caption)}
                                                ${(note.location || note.subLocation) ? `
                                                    <span style="font-size: 10px; margin-left: 6px; padding: 2px 6px; background: var(--color-completed-glow); color: var(--color-completed); border-radius: 4px; font-weight: 600; display: inline-block; border: 1px solid rgba(16, 185, 129, 0.2);">
                                                        <i class="fa-solid fa-location-crosshairs" style="font-size: 9px;"></i> 
                                                        ${escapeHtml(note.location || '')} ${note.location && note.subLocation ? '•' : ''} ${escapeHtml(note.subLocation || '')}
                                                    </span>` : ''}
                                            </h4>
                                            <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${escapeHtml(note.note || 'No additional note description.')}</p>
                                        </div>
                                    </div>
                                `;
                            });
                        }
                    });
                    if (visitPhotosListHtml !== '') {
                        svGalleryHtml = `
                            <div class="visit-photos-gallery mt-3">
                                <span class="info-label" style="font-weight:600; color:var(--primary); font-size:12px;"><i class="fa-solid fa-images"></i> Visit Photos</span>
                                <div class="photo-notes-list" style="margin-top: 8px; display: flex; flex-direction: column;">
                                    ${visitPhotosListHtml}
                                </div>
                            </div>
                        `;
                    }
                }

                const gpsHtml = (sv.latitude && sv.longitude) ? 
                    `<span style="font-size: 11px; color: var(--text-muted); float: right;"><i class="fa-solid fa-location-dot"></i> GPS: ${sv.latitude.toFixed(6)}, ${sv.longitude.toFixed(6)}</span>` : 
                    `<span style="font-size: 11px; color: var(--text-muted); float: right;"><i class="fa-solid fa-location-dot"></i> No GPS</span>`;

                svCard.innerHTML = `
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: var(--primary);">
                        Visit #${idx + 1}
                        <span class="badge severity-${sev.toLowerCase()}" style="margin-left: 8px; font-size: 10px; padding: 2px 6px;">${sev.toUpperCase()}</span>
                        ${gpsHtml}
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                        <i class="fa-regular fa-calendar-days"></i> Checked: ${sv.visitDate}
                    </div>
                    
                    ${readingsHtml}
                    ${firstVisitInfoHtml}

                    <div class="checklist-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; margin-top: 10px; border: 1px solid var(--border); padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.01);">
                        <div>${structIcon} Structural</div>
                        <div>${roofIcon} Roof</div>
                        <div>${waterIcon} Water</div>
                    </div>

                    <div class="info-full mt-3" style="font-size: 13px;">
                        <span class="info-label" style="font-weight:600; color:var(--primary); font-size:12px;">Field Notes</span>
                        <div class="details-box notes-box" style="padding: 8px; font-size: 13px; min-height: auto; margin-top: 4px; background: rgba(0,0,0,0.01);">
                            ${escapeHtml(sv.notes || 'No notes submitted for this visit.')}
                        </div>
                    </div>

                    ${(() => {
                        // Compliance Forms HTML
                        if (!sv.complianceForms || sv.complianceForms.length === 0) return '';
                        let compItemsHtml = '';
                        sv.complianceForms.forEach(cf => {
                            compItemsHtml += `
                                <div class="compliance-form-item">
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 12px;">${escapeHtml(cf.formType || 'Compliance Form')}</div>
                                    <div class="compliance-chips">
                                        <span class="comp-chip ${cf.preExistingDamage ? 'yes' : 'no'}"><i class="fa-solid ${cf.preExistingDamage ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> Pre-existing Damage: ${cf.preExistingDamage ? 'Yes' : 'No'}</span>
                                        <span class="comp-chip ${cf.safetyCheckPassed ? 'yes' : 'no'}"><i class="fa-solid ${cf.safetyCheckPassed ? 'fa-shield-check' : 'fa-shield-xmark'}"></i> Safety Check: ${cf.safetyCheckPassed ? 'Passed' : 'Failed'}</span>
                                        <span class="comp-chip ${cf.customerAuthorized ? 'yes' : 'no'}"><i class="fa-solid ${cf.customerAuthorized ? 'fa-signature' : 'fa-circle-xmark'}"></i> Authorized: ${cf.customerAuthorized ? escapeHtml(cf.authorizedSignatureName || 'Yes') : 'Not Authorized'}</span>
                                        ${cf.notes ? `<span class="comp-chip neutral"><i class="fa-solid fa-note-sticky"></i> ${escapeHtml(cf.notes)}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        });
                        return `
                            <div class="compliance-summary-box mt-3">
                                <span class="comp-label"><i class="fa-solid fa-clipboard-list"></i> Mitigation Compliance (${sv.complianceForms.length} form${sv.complianceForms.length > 1 ? 's' : ''})</span>
                                ${compItemsHtml}
                            </div>
                        `;
                    })()} 

                    ${roomsListHtml}
                    ${svGalleryHtml}
                `;

                // Hook up click to expand zoom lightboxes inside this card
                svCard.querySelectorAll('[data-src]').forEach(el => {
                    el.addEventListener('click', function() {
                        openLightbox(this.getAttribute('data-src'), this.getAttribute('data-caption'));
                    });
                });

                siteVisitsList.appendChild(svCard);
            });
        } else {
            // Hide visits history
            siteVisitsSection.style.display = 'none';

            // Show findings (Legacy model)
            if (isNotPending) {
                findingsSection.style.display = 'block';
                
                const sev = job.damageSeverity || 'None';
                detailSeverity.textContent = sev;
                detailSeverity.className = `badge severity-${sev.toLowerCase()}`;
                
                updateChecklistIcon(checkStructural, job.structuralDamage);
                updateChecklistIcon(checkRoof, job.roofDamage);
                updateChecklistIcon(checkWater, job.waterDamage);
                
                detailNotes.textContent = job.notes && job.notes.trim() !== '' ? job.notes : 'No notes submitted.';
            } else {
                findingsSection.style.display = 'none';
            }

            // Show gallery (Legacy model)
            if (isNotPending && job.photoNotes && job.photoNotes.length > 0) {
                gallerySection.style.display = 'block';
                photoNotesList.innerHTML = '';
                
                let totalPhotos = 0;

                job.photoNotes.forEach(note => {
                    if (note.photos) {
                        note.photos.forEach(photo => {
                            totalPhotos++;
                            
                            let cleanUrl = normalizePhotoUrl(photo.downloadUrl);

                            const item = document.createElement('div');
                            item.className = 'photo-note-item';
                            item.innerHTML = `
                                <div class="photo-thumbnail-container" data-src="${cleanUrl}" data-caption="${escapeHtml(note.caption)}">
                                    <img src="${cleanUrl}" alt="${escapeHtml(note.caption)}" loading="lazy">
                                </div>
                                <div class="photo-note-info">
                                    <h4>
                                        ${escapeHtml(note.caption)}
                                        ${(note.location || note.subLocation) ? `
                                            <span style="font-size: 10px; margin-left: 6px; padding: 2px 6px; background: var(--color-completed-glow); color: var(--color-completed); border-radius: 4px; font-weight: 600; display: inline-block; border: 1px solid rgba(16, 185, 129, 0.2);">
                                                <i class="fa-solid fa-location-crosshairs" style="font-size: 9px;"></i> 
                                                ${escapeHtml(note.location || '')} ${note.location && note.subLocation ? '•' : ''} ${escapeHtml(note.subLocation || '')}
                                            </span>` : ''}
                                    </h4>
                                    <p>${escapeHtml(note.note || 'No additional note description.')}</p>
                                </div>
                            `;
                            
                            item.querySelector('.photo-thumbnail-container').addEventListener('click', function() {
                                openLightbox(this.getAttribute('data-src'), this.getAttribute('data-caption'));
                            });
                            
                            photoNotesList.appendChild(item);
                        });
                    }
                });
                
                photoCount.textContent = totalPhotos;
                if (totalPhotos === 0) {
                    photoNotesList.innerHTML = '<p class="text-secondary" style="font-size: 13px; text-align: center; padding: 10px;">Checklist started but no photo attachments uploaded yet.</p>';
                }
            } else {
                gallerySection.style.display = 'none';
                photoCount.textContent = '0';
            }
        }
    }

    // Helper: Update checklist item icon
    function updateChecklistIcon(element, checked) {
        if (checked) {
            element.innerHTML = '<i class="fa-solid fa-circle-check icon-yes"></i> ' + element.textContent.trim();
        } else {
            element.innerHTML = '<i class="fa-solid fa-circle-xmark icon-no"></i> ' + element.textContent.trim();
        }
    }

    // Render Users Table
    function renderUsersTable(users) {
        usersListBody.innerHTML = '';
        
        if (users.length === 0) {
            usersListBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fa-solid fa-users" style="font-size: 24px; display: block; margin-bottom: 10px; color: var(--text-muted);"></i>
                        No users configured.
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            
            const roleClass = user.role.toLowerCase() === 'admin' ? 'role-admin' : 'role-investigator';
            const roleText = user.role.replace('_', ' ');

            const statusClass = user.active ? 'status-active' : 'status-suspended';
            const statusText = user.active ? 'Active' : 'Suspended';

            tr.innerHTML = `
                <td><strong>#${user.id}</strong></td>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(user.fullName)}</td>
                <td><span class="badge ${roleClass}">${roleText}</span></td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td class="actions-cell">
                    <button class="btn btn-secondary btn-icon-only edit-user-btn" data-id="${user.id}"><i class="fa-solid fa-user-pen"></i> Edit</button>
                    <button class="btn btn-danger btn-icon-only delete-user-btn" data-id="${user.id}" data-username="${escapeHtml(user.username)}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;

            usersListBody.appendChild(tr);
        });

        // Add action button listeners for users
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                openEditUserModal(btn.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteUser(btn.getAttribute('data-id'), btn.getAttribute('data-username'));
            });
        });
    }

    // Loading/Error utilities
    function renderClaimsLoading() {
        claimsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Fetching active inspection claims...
                </td>
            </tr>
        `;
    }

    function renderClaimsError(message) {
        claimsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state" style="color: var(--color-danger);">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 26px; display: block; margin-bottom: 10px;"></i>
                    ${message}
                </td>
            </tr>
        `;
    }

    function renderUsersLoading() {
        usersListBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Loading users list...
                </td>
            </tr>
        `;
    }

    function renderUsersError(message) {
        usersListBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state" style="color: var(--color-danger);">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 26px; display: block; margin-bottom: 10px;"></i>
                    ${message}
                </td>
            </tr>
        `;
    }

    // -------------------------------------------------------------
    // Event Triggers & Overlay Controls
    // -------------------------------------------------------------

    // Dispatch Modal Control
    btnOpenDispatch.addEventListener('click', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('scheduledDate').value = tomorrow.toISOString().split('T')[0];
        dispatchModal.classList.add('active');
    });

    btnCloseDispatch.addEventListener('click', closeDispatchModal);
    btnCancelDispatch.addEventListener('click', closeDispatchModal);
    
    function closeDispatchModal() {
        dispatchModal.classList.remove('active');
        dispatchForm.reset();
    }

    // User Modal Control
    btnOpenUserModal.addEventListener('click', () => {
        userIdField.value = '';
        userForm.reset();
        userModalTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> Add New User';
        userUsernameInput.removeAttribute('disabled');
        userPasswordInput.setAttribute('required', 'true');
        passwordHelp.textContent = 'Password must be at least 4 characters.';
        userStatusGroup.style.display = 'none';
        userModal.classList.add('active');
    });

    function openEditUserModal(id) {
        const user = allUsers.find(u => u.id == id);
        if (!user) return;
        
        selectedUser = user;
        userIdField.value = user.id;
        userUsernameInput.value = user.username;
        userUsernameInput.setAttribute('disabled', 'true');
        userFullnameInput.value = user.fullName;
        userRoleSelect.value = user.role;
        userStatusSelect.value = String(user.active);
        
        userPasswordInput.removeAttribute('required');
        userPasswordInput.value = '';
        passwordHelp.textContent = 'Leave password blank if you do not want to change it.';
        userStatusGroup.style.display = 'block';
        
        userModalTitle.innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit User Settings';
        userModal.classList.add('active');
    }

    btnCloseUser.addEventListener('click', closeUserModal);
    btnCancelUser.addEventListener('click', closeUserModal);

    function closeUserModal() {
        userModal.classList.remove('active');
        userForm.reset();
        selectedUser = null;
    }

    // Drawer Control
    function openDetailsDrawer(id) {
        detailsDrawer.classList.add('active');
        detailTitle.textContent = "Loading claim details...";
        detailClientName.textContent = "Loading...";
        detailPolicy.textContent = "Loading...";
        detailPhone.textContent = "Loading...";
        detailUpdated.textContent = "Loading...";
        detailAddress.textContent = "Loading...";
        detailClaimDetails.textContent = "Loading...";
        findingsSection.style.display = 'none';
        gallerySection.style.display = 'none';

        fetchClaimDetails(id);
    }

    btnCloseDrawer.addEventListener('click', closeDrawer);
    btnCloseDrawerBottom.addEventListener('click', closeDrawer);
    
    function closeDrawer() {
        detailsDrawer.classList.remove('active');
        selectedJob = null;
    }

    // Lightbox Control
    function openLightbox(src, caption) {
        lightboxImg.src = src;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('active');
    }

    btnCloseLightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
        lightboxImg.src = '';
    });

    // Refresh Button Sync
    btnRefreshNav.addEventListener('click', (e) => {
        e.preventDefault();
        if (viewUsers.style.display === 'block') {
            fetchUsers();
        } else {
            fetchClaims();
        }
    });

    // Filter changes trigger table redraw
    filterStatus.addEventListener('change', () => renderClaimsTable(allJobs));
    filterInvestigator.addEventListener('change', () => renderClaimsTable(allJobs));
    searchInput.addEventListener('input', () => renderClaimsTable(allJobs));

    // -------------------------------------------------------------
    // Helper Formatters
    // -------------------------------------------------------------

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'N/A';
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString();
        } catch (e) {
            return dateTimeString;
        }
    }

    function escapeHtml(string) {
        if (!string) return '';
        return String(string)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Export button events
    btnExportPdf.addEventListener('click', () => {
        if (!selectedJob) return;
        window.open(`/api/reports/jobs/${selectedJob.id}/pdf`, '_blank');
    });

    btnExportExcel.addEventListener('click', () => {
        if (!selectedJob) return;
        window.open(`/api/reports/jobs/${selectedJob.id}/excel`, '_blank');
    });

    let calendar = null;

    function renderCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        if (calendar) {
            calendar.destroy();
        }

        const events = allJobs.map(job => {
            let color = '#f0ad4e';
            if (job.status === 'Completed') {
                color = '#5cb85c';
            } else if (job.status === 'In_Progress' || job.status === 'In Progress') {
                color = '#0275d8';
            }

            const investigatorUser = allUsers.find(u => u.username === job.investigatorId);
            const investigatorName = investigatorUser ? investigatorUser.fullName : job.investigatorId;

            return {
                id: job.id,
                title: `${job.clientName} - ${job.title} (${investigatorName})`,
                start: job.scheduledDate,
                allDay: true,
                backgroundColor: color,
                borderColor: color,
                extendedProps: {
                    job: job
                }
            };
        });

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            editable: true,
            events: events,
            eventClick: function(info) {
                openDetailsDrawer(info.event.id);
            },
            eventDrop: function(info) {
                const jobId = info.event.id;
                const newDate = info.event.startStr;
                const job = info.event.extendedProps.job;

                if (!confirm(`Do you want to reschedule ${job.clientName}'s inspection to ${newDate}?`)) {
                    info.revert();
                    return;
                }

                fetch(`/api/jobs/${jobId}/assign?investigatorId=${job.investigatorId}&scheduledDate=${newDate}`, {
                    method: 'PUT'
                })
                .then(res => {
                    if (!res.ok) throw new Error('Reschedule failed');
                    return res.json();
                })
                .then(updatedJob => {
                    fetchClaims();
                })
                .catch(err => {
                    console.error(err);
                    alert('Failed to reschedule job.');
                    info.revert();
                });
            }
        });

        calendar.render();
    }

    // -------------------------------------------------------------
    // Analytics / Reports View
    // -------------------------------------------------------------

    function renderAnalytics() {
        if (allJobs.length === 0) {
            // Fetch jobs first if not loaded
            fetch('/api/jobs')
                .then(res => res.json())
                .then(data => {
                    allJobs = data;
                    buildAnalyticsCharts();
                })
                .catch(err => console.error(err));
        } else {
            buildAnalyticsCharts();
        }
    }

    function buildAnalyticsCharts() {
        const jobs = allJobs;
        const users = allUsers;

        // --- KPI Values ---
        const total = jobs.length;
        const completed = jobs.filter(j => j.status === 'Completed').length;
        const totalVisits = jobs.reduce((acc, j) => acc + (j.siteVisits ? j.siteVisits.length : 0), 0);
        const activeInvestigators = new Set(jobs.filter(j => j.investigatorId).map(j => j.investigatorId)).size;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('an-total').textContent = total;
        document.getElementById('an-visits').textContent = totalVisits;
        document.getElementById('an-investigators').textContent = activeInvestigators;
        document.getElementById('an-completion-rate').textContent = completionRate + '%';

        // --- Status Donut Chart ---
        const pending = jobs.filter(j => j.status === 'Pending').length;
        const inProgress = jobs.filter(j => j.status === 'In_Progress' || j.status === 'In Progress').length;

        if (chartStatus) chartStatus.destroy();
        const ctxStatus = document.getElementById('chart-status');
        if (ctxStatus) {
            chartStatus = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'In Progress', 'Completed'],
                    datasets: [{
                        data: [pending, inProgress, completed],
                        backgroundColor: ['rgba(245,158,11,0.85)', 'rgba(59,130,246,0.85)', 'rgba(16,185,129,0.85)'],
                        borderColor: ['#f59e0b', '#3b82f6', '#10b981'],
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#9ca3af', font: { family: 'Outfit', size: 12 }, padding: 15 } }
                    },
                    cutout: '65%'
                }
            });
        }

        // --- Investigator Workload Bar Chart ---
        const investMap = {};
        jobs.forEach(j => {
            if (!j.investigatorId) return;
            const user = users.find(u => u.username === j.investigatorId);
            const label = user ? user.fullName : j.investigatorId;
            investMap[label] = (investMap[label] || 0) + 1;
        });
        const investLabels = Object.keys(investMap);
        const investData = Object.values(investMap);

        if (chartInvestigator) chartInvestigator.destroy();
        const ctxInv = document.getElementById('chart-investigator');
        if (ctxInv) {
            chartInvestigator = new Chart(ctxInv, {
                type: 'bar',
                data: {
                    labels: investLabels,
                    datasets: [{
                        label: 'Assigned Claims',
                        data: investData,
                        backgroundColor: 'rgba(99,102,241,0.75)',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { beginAtZero: true, ticks: { color: '#9ca3af', font: { family: 'Outfit' }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } }
                    }
                }
            });
        }

        // --- Monthly Claims Trend Line ---
        const monthMap = {};
        jobs.forEach(j => {
            if (!j.scheduledDate) return;
            const monthKey = j.scheduledDate.substring(0, 7); // YYYY-MM
            monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
        });
        const sortedMonths = Object.keys(monthMap).sort();
        const monthlyData = sortedMonths.map(m => monthMap[m]);
        const monthLabels = sortedMonths.map(m => {
            const [yr, mo] = m.split('-');
            return new Date(+yr, +mo - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
        });

        if (chartMonthly) chartMonthly.destroy();
        const ctxMonthly = document.getElementById('chart-monthly');
        if (ctxMonthly) {
            chartMonthly = new Chart(ctxMonthly, {
                type: 'line',
                data: {
                    labels: monthLabels.length > 0 ? monthLabels : ['No Data'],
                    datasets: [{
                        label: 'Claims Scheduled',
                        data: monthlyData.length > 0 ? monthlyData : [0],
                        fill: true,
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        borderColor: '#6366f1',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#6366f1',
                        pointRadius: 5,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { beginAtZero: true, ticks: { color: '#9ca3af', font: { family: 'Outfit' }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } }
                    }
                }
            });
        }

        // --- Site Visits per Investigator Polar/Bar ---
        const visitInvestMap = {};
        jobs.forEach(j => {
            if (!j.investigatorId) return;
            const user = users.find(u => u.username === j.investigatorId);
            const label = user ? user.fullName : j.investigatorId;
            visitInvestMap[label] = (visitInvestMap[label] || 0) + (j.siteVisits ? j.siteVisits.length : 0);
        });
        const visitLabels = Object.keys(visitInvestMap);
        const visitData = Object.values(visitInvestMap);

        if (chartVisits) chartVisits.destroy();
        const ctxVisits = document.getElementById('chart-visits');
        if (ctxVisits) {
            chartVisits = new Chart(ctxVisits, {
                type: 'bar',
                data: {
                    labels: visitLabels,
                    datasets: [{
                        label: 'Site Visits',
                        data: visitData,
                        backgroundColor: 'rgba(16,185,129,0.75)',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#9ca3af', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                        y: { beginAtZero: true, ticks: { color: '#9ca3af', font: { family: 'Outfit' }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } }
                    }
                }
            });
        }

        // --- Damage Type Distribution Radar/Doughnut ---
        let structCount = 0, roofCount = 0, waterCount = 0, noneCount = 0;
        jobs.forEach(j => {
            if (j.structuralDamage) structCount++;
            if (j.roofDamage) roofCount++;
            if (j.waterDamage) waterCount++;
            if (!j.structuralDamage && !j.roofDamage && !j.waterDamage) noneCount++;
        });

        if (chartDamage) chartDamage.destroy();
        const ctxDamage = document.getElementById('chart-damage');
        if (ctxDamage) {
            chartDamage = new Chart(ctxDamage, {
                type: 'doughnut',
                data: {
                    labels: ['Structural', 'Roof', 'Water', 'No Damage Flagged'],
                    datasets: [{
                        data: [structCount, roofCount, waterCount, noneCount],
                        backgroundColor: [
                            'rgba(239,68,68,0.8)',
                            'rgba(245,158,11,0.8)',
                            'rgba(59,130,246,0.8)',
                            'rgba(107,114,128,0.5)'
                        ],
                        borderColor: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280'],
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#9ca3af', font: { family: 'Outfit', size: 11 }, padding: 12 } }
                    },
                    cutout: '60%'
                }
            });
        }

        // --- Completed Claims Table ---
        const completedBody = document.getElementById('analytics-completed-body');
        if (completedBody) {
            const completedJobs = jobs
                .filter(j => j.status === 'Completed')
                .sort((a, b) => (b.id - a.id))
                .slice(0, 10);

            if (completedJobs.length === 0) {
                completedBody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-folder-open" style="font-size: 22px; display: block; margin-bottom: 8px; color: var(--text-muted);"></i>No completed claims yet.</td></tr>`;
            } else {
                completedBody.innerHTML = completedJobs.map(j => {
                    const user = users.find(u => u.username === j.investigatorId);
                    const investigatorName = user ? user.fullName : (j.investigatorId || 'Unassigned');
                    const visitCount = j.siteVisits ? j.siteVisits.length : 0;
                    return `
                        <tr>
                            <td><strong>#${j.id}</strong></td>
                            <td>${escapeHtml(j.clientName)}</td>
                            <td>${escapeHtml(j.title)}</td>
                            <td>${escapeHtml(investigatorName)}</td>
                            <td><span class="badge" style="background:rgba(139,92,246,0.15);color:#a78bfa;border:1px solid rgba(139,92,246,0.25);">${visitCount}</span></td>
                            <td><i class="fa-regular fa-calendar-days"></i> ${j.scheduledDate || 'N/A'}</td>
                            <td style="display:flex; gap:6px;">
                                <button onclick="window.open('/api/reports/jobs/${j.id}/pdf','_blank')" class="btn btn-secondary btn-icon-only" style="font-size:11px;padding:4px 8px;"><i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> PDF</button>
                                <button onclick="window.open('/api/reports/jobs/${j.id}/excel','_blank')" class="btn btn-secondary btn-icon-only" style="font-size:11px;padding:4px 8px;"><i class="fa-solid fa-file-excel" style="color:#22c55e;"></i> Excel</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }
});
