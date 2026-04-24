// Joe Employment Services LTE - API Integration
// Connects frontend to Express.js backend

const API_BASE = '/api';

// API Helper Functions
const api = {
    async get(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            return data.data;
        } catch (error) {
            console.error(`API Error (GET ${endpoint}):`, error);
            return null;
        }
    },

    async post(endpoint, body) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            return data;
        } catch (error) {
            console.error(`API Error (POST ${endpoint}):`, error);
            return { success: false, message: error.message };
        }
    },

    async put(endpoint, body) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            return data;
        } catch (error) {
            console.error(`API Error (PUT ${endpoint}):`, error);
            return { success: false, message: error.message };
        }
    },

    async delete(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            return data;
        } catch (error) {
            console.error(`API Error (DELETE ${endpoint}):`, error);
            return { success: false, message: error.message };
        }
    }
};

// App State
const appState = {
    currentUser: {
        id: 'user-001',
        email: 'juan.cruz@email.com',
        firstName: 'Juan',
        lastName: 'Dela Cruz'
    },
    jobs: [],
    applications: [],
    profile: null,
    documents: [],
    messages: []
};

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Initialize App
class JoeEmploymentApp {
    constructor() {
        this.initSidebar();
        this.initNavigation();
        this.initUserDropdown();
        this.initApplyModal();
        this.initFileUpload();
        this.initLogout();
        this.initNotifications();
        this.loadInitialData();
    }

    async loadInitialData() {
        await this.loadJobs();
        await this.loadApplications();
        await this.loadProfile();
        await this.loadDocuments();
        await this.loadStats();
    }

    async loadJobs() {
        const jobs = await api.get('/jobs');
        if (jobs) {
            appState.jobs = jobs;
            this.renderFeaturedJobs(jobs.slice(0, 3));
            this.renderJobsGrid(jobs);
        }
    }

    async loadApplications() {
        const apps = await api.get(`/applications?userId=${appState.currentUser.id}`);
        if (apps) {
            appState.applications = apps;
            this.renderApplications(apps);
        }
    }

    async loadProfile() {
        const profile = await api.get(`/profile/${appState.currentUser.id}`);
        if (profile) {
            appState.profile = profile;
            this.fillProfileForm(profile);
        }
    }

    async loadDocuments() {
        const docs = await api.get(`/documents?userId=${appState.currentUser.id}`);
        if (docs) {
            appState.documents = docs;
            this.renderDocuments(docs);
        }
    }

    async loadStats() {
        const stats = await api.get(`/stats/${appState.currentUser.id}`);
        if (stats) {
            this.updateStats(stats);
        }
    }

    // Render Functions
    renderFeaturedJobs(jobs) {
        const container = document.querySelector('.featured-jobs .card-body');
        if (!container) return;

        container.innerHTML = jobs.map(job => `
            <div class="job-item">
                <div class="job-logo"><i class="fas fa-briefcase"></i></div>
                <div class="job-details">
                    <h4>${job.title}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${job.locationName}</p>
                    <span class="salary">${job.salary}</span>
                </div>
                <button class="btn-apply" data-job-id="${job.id}">Apply Now</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-apply').forEach(btn => {
            btn.addEventListener('click', () => this.openApplyModal(btn.dataset.jobId));
        });
    }

    renderJobsGrid(jobs) {
        const container = document.getElementById('jobsGrid');
        if (!container) return;

        container.innerHTML = jobs.map(job => `
            <div class="job-card" data-location="${job.location}" data-type="${job.type}" data-category="${job.category}">
                <div class="job-card-header">
                    <div class="job-category">${job.category}</div>
                    <span class="job-type ${job.type}">${job.type}</span>
                </div>
                <h3>${job.title}</h3>
                <p class="company"><i class="fas fa-building"></i> ${job.company}</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> ${job.locationName}</p>
                <div class="job-salary">${job.salary}</div>
                <ul class="job-requirements">
                    ${job.requirements.map(req => `<li><i class="fas fa-check"></i> ${req}</li>`).join('')}
                </ul>
                <div class="job-card-footer">
                    <small>Posted ${this.formatDate(job.createdAt)}</small>
                    <button class="btn-primary apply-btn" data-job-id="${job.id}">Apply Now</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.apply-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openApplyModal(btn.dataset.jobId));
        });
    }

    renderApplications(applications) {
        const container = document.getElementById('applicationsList');
        if (!container) return;

        container.innerHTML = applications.map(app => `
            <div class="application-card" data-status="${app.status}">
                <div class="application-header">
                    <div class="app-job-info">
                        <h4>${app.jobTitle}</h4>
                        <p>${app.company} - ${app.location}</p>
                    </div>
                    <span class="status-badge ${app.status}">${this.capitalizeFirst(app.status)}</span>
                </div>
                <div class="application-body">
                    <div class="timeline">
                        ${app.timeline.map(item => `
                            <div class="timeline-item ${item.completed ? 'completed' : ''} ${item.stage === 'interview' && !item.completed ? 'active' : ''}">
                                <i class="fas ${item.completed ? 'fa-check' : item.stage === 'interview' && !item.completed ? 'fa-clock' : 'fa-circle'}"></i>
                                <span>${this.capitalizeFirst(item.stage)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="application-footer">
                    <small>Applied: ${this.formatDate(app.createdAt)}</small>
                    <button class="btn-outline">View Details</button>
                </div>
            </div>
        `).join('');
    }

    renderDocuments(documents) {
        const container = document.querySelector('.documents-grid');
        if (!container) return;

        container.innerHTML = documents.map(doc => `
            <div class="document-card">
                <div class="document-icon"><i class="fas fa-file-pdf"></i></div>
                <div class="document-info">
                    <h4>${doc.name}</h4>
                    <p>Uploaded: ${this.formatDate(doc.uploadedAt)}</p>
                    <span class="document-status ${doc.status}">${this.capitalizeFirst(doc.status)}</span>
                </div>
                <div class="document-actions">
                    <button><i class="fas fa-eye"></i></button>
                    <button><i class="fas fa-download"></i></button>
                </div>
            </div>
        `).join('');
    }

    updateStats(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-info h3').textContent = stats.totalApplications;
            statCards[1].querySelector('.stat-info h3').textContent = stats.pending;
            statCards[2].querySelector('.stat-info h3').textContent = stats.interview;
            statCards[3].querySelector('.stat-info h3').textContent = stats.approved;
        }
    }

    fillProfileForm(profile) {
        const form = document.querySelector('.profile-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            const name = input.name || input.id || input.closest('.form-group')?.querySelector('label')?.textContent?.toLowerCase();
            if (name && profile[name]) {
                input.value = profile[name];
            }
        });
    }

    // Event Handlers
    initSidebar() {
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('open');
        });
        document.getElementById('closeSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('open');
        });
    }

    initNavigation() {
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.dataset.section;
                
                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                
                document.getElementById(sectionId)?.classList.add('active');
                item.classList.add('active');
            });
        });
    }

    initUserDropdown() {
        document.getElementById('userBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('dropdownMenu')?.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            document.getElementById('dropdownMenu')?.classList.remove('show');
        });
    }

    initApplyModal() {
        const closeModal = () => document.getElementById('applyModal')?.classList.remove('show');
        
        document.getElementById('closeModal')?.addEventListener('click', closeModal);
        document.getElementById('cancelApply')?.addEventListener('click', closeModal);
        document.getElementById('confirmApply')?.addEventListener('click', () => this.submitApplication());
        document.getElementById('applyModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'applyModal') closeModal();
        });
    }

    async openApplyModal(jobId) {
        const job = appState.jobs.find(j => j.id === jobId);
        if (job) {
            appState.selectedJob = job;
            const modal = document.getElementById('applyModal');
            modal.querySelector('.job-title-modal').textContent = job.title;
            modal.classList.add('show');
        }
    }

    async submitApplication() {
        if (!appState.selectedJob) return;

        const result = await api.post('/applications', {
            userId: appState.currentUser.id,
            jobId: appState.selectedJob.id,
            jobTitle: appState.selectedJob.title,
            company: appState.selectedJob.company,
            location: appState.selectedJob.locationName
        });

        if (result.success) {
            showToast('Application submitted successfully!');
            document.getElementById('applyModal')?.classList.remove('show');
            await this.loadApplications();
            await this.loadStats();
        } else {
            showToast(result.message || 'Failed to submit application', 'error');
        }
    }

    initFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#2E7D32';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#E0E0E0';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#E0E0E0';
            if (e.dataTransfer.files[0]) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) {
                this.handleFileUpload(fileInput.files[0]);
            }
        });
    }

    async handleFileUpload(file) {
        const result = await api.post('/documents', {
            userId: appState.currentUser.id,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'pending'
        });

        if (result.success) {
            showToast(`File "${file.name}" uploaded successfully!`);
            await this.loadDocuments();
        } else {
            showToast('Failed to upload file', 'error');
        }
    }

    initLogout() {
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                showToast('Logged out successfully!');
                setTimeout(() => location.reload(), 1500);
            }
        });
    }

    initNotifications() {
        document.getElementById('notificationBtn')?.addEventListener('click', () => {
            showToast('You have 3 new notifications');
        });
    }

    // Job Filters
    initJobFilters() {
        const locationFilter = document.getElementById('locationFilter');
        const jobTypeFilter = document.getElementById('jobTypeFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const jobSearch = document.getElementById('jobSearch');

        const filterJobs = () => {
            const location = locationFilter?.value || '';
            const jobType = jobTypeFilter?.value || '';
            const category = categoryFilter?.value || '';
            const searchTerm = jobSearch?.value.toLowerCase() || '';

            document.querySelectorAll('.job-card').forEach(card => {
                const matchesLocation = !location || card.dataset.location === location;
                const matchesType = !jobType || card.dataset.type === jobType;
                const matchesCategory = !category || card.dataset.category === category;
                const title = card.querySelector('h3').textContent.toLowerCase();
                const matchesSearch = !searchTerm || title.includes(searchTerm);

                card.style.display = (matchesLocation && matchesType && matchesCategory && matchesSearch) ? 'block' : 'none';
            });
        };

        locationFilter?.addEventListener('change', filterJobs);
        jobTypeFilter?.addEventListener('change', filterJobs);
        categoryFilter?.addEventListener('change', filterJobs);
        jobSearch?.addEventListener('input', filterJobs);
    }

    // Application Filters
    initApplicationFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                document.querySelectorAll('.application-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.status === filter) ? 'block' : 'none';
                });
            });
        });
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JoeEmploymentApp();
    window.app.initJobFilters();
    window.app.initApplicationFilters();

    // Service buttons
    document.querySelectorAll('.service-card .btn-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceName = btn.closest('.service-card').querySelector('h3').textContent;
            showToast(`Inquiry for "${serviceName}" sent!`);
        });
    });

    // Message input
    document.querySelector('.send-btn')?.addEventListener('click', () => {
        const input = document.querySelector('.messages-input input');
        if (input?.value.trim()) {
            showToast('Message sent successfully!');
            input.value = '';
        }
    });

    // Profile form
    document.querySelector('.form-actions .btn-primary')?.addEventListener('click', () => {
        showToast('Profile saved successfully!');
    });

    document.querySelector('.form-actions .btn-outline')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Discard all changes?')) location.reload();
    });
});