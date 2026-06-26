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
    const viewDashboard = document.getElementById('view-dashboard');
    const viewUsers = document.getElementById('view-users');
    
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
        viewDashboard.style.display = 'block';
        viewUsers.style.display = 'none';
        fetchClaims();
    });

    navUsers.addEventListener('click', (e) => {
        e.preventDefault();
        navUsers.classList.add('active');
        navDashboard.classList.remove('active');
        viewUsers.style.display = 'block';
        viewDashboard.style.display = 'none';
        fetchUsers();
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

                // Photo Notes for this visit
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
                    svGalleryHtml = `
                        <div class="visit-photos-gallery mt-3">
                            <span class="info-label" style="font-weight:600; color:var(--primary); font-size:12px;"><i class="fa-solid fa-images"></i> Visit Photos</span>
                            <div class="photo-notes-list" style="margin-top: 8px; display: flex; flex-direction: column;">
                                ${visitPhotosListHtml}
                            </div>
                        </div>
                    `;
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
});
