// InsureInspect - Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // State Store
    let allJobs = [];
    let selectedJob = null;

    // DOM Elements
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

    // Init: Fetch Claims
    fetchClaims();

    // -------------------------------------------------------------
    // API Calls
    // -------------------------------------------------------------
    
    // Fetch all claims from backend
    function fetchClaims() {
        renderLoadingState();
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
                renderErrorState('Could not load inspection claims from server. Make sure the backend is running.');
            });
    }

    // Fetch details of a single claim (includes populated photo notes and photos)
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
            investigatorId: document.getElementById('investigatorId').value,
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
            fetchClaims(); // refresh main table
            // Refresh detail drawer
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
        if (!confirm(`Are you sure you want to permanently delete/cancel the claim for ${selectedJob.clientName}?`)) {
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

    // -------------------------------------------------------------
    // UI Rendering
    // -------------------------------------------------------------

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
        
        // Filter jobs based on filter values and search string
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
            
            // Format investigator ID for display
            const investigatorDisplay = job.investigatorId === 'investigator_1' ? 'John (Investigator 1)' :
                                       job.investigatorId === 'investigator_2' ? 'Alice (Investigator 2)' : job.investigatorId;
            
            // Class for status badge
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

            // Row click triggers Drawer details opening
            tr.addEventListener('click', (e) => {
                // Ignore if clicking action button directly (handled separately)
                if (e.target.closest('.btn')) return;
                openDetailsDrawer(job.id);
            });

            claimsTableBody.appendChild(tr);
        });

        // Add action button listeners
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
        
        // Status Badge class update
        detailStatusBadge.className = `badge ${job.status.toLowerCase()}`;
        detailStatusBadge.textContent = job.status.replace('_', ' ');
        
        // Setup reassignment fields
        reassignJobId.value = job.id;
        reassignInvestigator.value = job.investigatorId;
        reassignDate.value = job.scheduledDate;
        
        // Show/Hide Findings Checklist & Photo gallery based on status
        const isNotPending = job.status !== 'Pending';
        if (isNotPending) {
            findingsSection.style.display = 'block';
            
            // Severity Label
            const sev = job.damageSeverity || 'None';
            detailSeverity.textContent = sev;
            detailSeverity.className = `badge severity-${sev.toLowerCase()}`;
            
            // Checklist Checklist Icons
            updateChecklistIcon(checkStructural, job.structuralDamage);
            updateChecklistIcon(checkRoof, job.roofDamage);
            updateChecklistIcon(checkWater, job.waterDamage);
            
            // Field Notes
            detailNotes.textContent = job.notes && job.notes.trim() !== '' ? job.notes : 'No notes submitted.';
        } else {
            findingsSection.style.display = 'none';
        }

        // Photo Gallery notes populate
        if (isNotPending && job.photoNotes && job.photoNotes.length > 0) {
            gallerySection.style.display = 'block';
            photoNotesList.innerHTML = '';
            
            let totalPhotos = 0;

            job.photoNotes.forEach(note => {
                // It is possible a note has multiple photos or none
                note.photos.forEach(photo => {
                    totalPhotos++;
                    
                    const item = document.createElement('div');
                    item.className = 'photo-note-item';
                    item.innerHTML = `
                        <div class="photo-thumbnail-container" data-src="${photo.downloadUrl}" data-caption="${escapeHtml(note.caption)}">
                            <img src="${photo.downloadUrl}" alt="${escapeHtml(note.caption)}" loading="lazy">
                        </div>
                        <div class="photo-note-info">
                            <h4>${escapeHtml(note.caption)}</h4>
                            <p>${escapeHtml(note.note || 'No additional note description.')}</p>
                        </div>
                    `;
                    
                    // Lightbox image click trigger
                    item.querySelector('.photo-thumbnail-container').addEventListener('click', function() {
                        openLightbox(this.getAttribute('data-src'), this.getAttribute('data-caption'));
                    });
                    
                    photoNotesList.appendChild(item);
                });
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

    // Helper: Update checklist item icon
    function updateChecklistIcon(element, checked) {
        if (checked) {
            element.innerHTML = '<i class="fa-solid fa-circle-check icon-yes"></i> ' + element.textContent.trim();
        } else {
            element.innerHTML = '<i class="fa-solid fa-circle-xmark icon-no"></i> ' + element.textContent.trim();
        }
    }

    // Loading/Error utilities
    function renderLoadingState() {
        claimsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Fetching active inspection claims...
                </td>
            </tr>
        `;
    }

    function renderErrorState(message) {
        claimsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state" style="color: var(--color-danger);">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 26px; display: block; margin-bottom: 10px;"></i>
                    ${message}
                </td>
            </tr>
        `;
    }

    // -------------------------------------------------------------
    // Event Triggers & Overlay Controls
    // -------------------------------------------------------------

    // Modal Control
    btnOpenDispatch.addEventListener('click', () => {
        // Set default date to tomorrow
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

    // Drawer Control
    function openDetailsDrawer(id) {
        detailsDrawer.classList.add('active');
        // Clear old display values
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
        fetchClaims();
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
