const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Data file paths
const DATA_DIR = path.join(__dirname, '..', 'data');

// Helper function to read data from JSON file
const readData = (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Helper function to write data to JSON file
const writeData = (filename, data) => {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize data files if they don't exist
const initializeData = () => {
    const files = ['jobs.json', 'applications.json', 'users.json', 'documents.json', 'messages.json'];
    files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) {
            writeData(file, []);
        }
    });
};

initializeData();

// ================== JOBS ROUTES ==================

// Get all jobs
router.get('/jobs', (req, res) => {
    try {
        const jobs = readData('jobs.json');
        const { location, type, category, search } = req.query;
        
        let filteredJobs = jobs;
        
        if (location) {
            filteredJobs = filteredJobs.filter(job => job.location.toLowerCase() === location.toLowerCase());
        }
        if (type) {
            filteredJobs = filteredJobs.filter(job => job.type.toLowerCase() === type.toLowerCase());
        }
        if (category) {
            filteredJobs = filteredJobs.filter(job => job.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
            filteredJobs = filteredJobs.filter(job => 
                job.title.toLowerCase().includes(search.toLowerCase()) ||
                job.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        res.json({ success: true, data: filteredJobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single job
router.get('/jobs/:id', (req, res) => {
    try {
        const jobs = readData('jobs.json');
        const job = jobs.find(j => j.id === req.params.id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        res.json({ success: true, data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new job
router.post('/jobs', (req, res) => {
    try {
        const jobs = readData('jobs.json');
        const newJob = {
            id: uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        jobs.push(newJob);
        writeData('jobs.json', jobs);
        
        res.status(201).json({ success: true, data: newJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update job
router.put('/jobs/:id', (req, res) => {
    try {
        const jobs = readData('jobs.json');
        const index = jobs.findIndex(j => j.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        jobs[index] = { ...jobs[index], ...req.body, updatedAt: new Date().toISOString() };
        writeData('jobs.json', jobs);
        
        res.json({ success: true, data: jobs[index] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete job
router.delete('/jobs/:id', (req, res) => {
    try {
        const jobs = readData('jobs.json');
        const filteredJobs = jobs.filter(j => j.id !== req.params.id);
        
        if (jobs.length === filteredJobs.length) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        writeData('jobs.json', filteredJobs);
        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== APPLICATIONS ROUTES ==================

// Get all applications
router.get('/applications', (req, res) => {
    try {
        const applications = readData('applications.json');
        const { userId, status } = req.query;
        
        let filteredApps = applications;
        
        if (userId) {
            filteredApps = filteredApps.filter(app => app.userId === userId);
        }
        if (status) {
            filteredApps = filteredApps.filter(app => app.status === status);
        }
        
        res.json({ success: true, data: filteredApps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single application
router.get('/applications/:id', (req, res) => {
    try {
        const applications = readData('applications.json');
        const application = applications.find(a => a.id === req.params.id);
        
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        
        res.json({ success: true, data: application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new application
router.post('/applications', (req, res) => {
    try {
        const applications = readData('applications.json');
        const newApplication = {
            id: uuidv4(),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString(),
            timeline: [
                { stage: 'applied', completed: true, date: new Date().toISOString() },
                { stage: 'reviewed', completed: false, date: null },
                { stage: 'interview', completed: false, date: null },
                { stage: 'hired', completed: false, date: null }
            ]
        };
        
        applications.push(newApplication);
        writeData('applications.json', applications);
        
        res.status(201).json({ success: true, data: newApplication });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update application status
router.put('/applications/:id/status', (req, res) => {
    try {
        const applications = readData('applications.json');
        const index = applications.findIndex(a => a.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        
        const { status, stage } = req.body;
        applications[index].status = status;
        
        if (stage) {
            applications[index].timeline = applications[index].timeline.map(item => {
                if (item.stage === stage) {
                    return { ...item, completed: true, date: new Date().toISOString() };
                }
                return item;
            });
        }
        
        applications[index].updatedAt = new Date().toISOString();
        writeData('applications.json', applications);
        
        res.json({ success: true, data: applications[index] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== PROFILE ROUTES ==================

// Get user profile
router.get('/profile/:userId', (req, res) => {
    try {
        const users = readData('users.json');
        const user = users.find(u => u.id === req.params.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Remove password from response
        const { password, ...userProfile } = user;
        res.json({ success: true, data: userProfile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update profile
router.put('/profile/:userId', (req, res) => {
    try {
        const users = readData('users.json');
        const index = users.findIndex(u => u.id === req.params.userId);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        users[index] = { ...users[index], ...req.body, updatedAt: new Date().toISOString() };
        writeData('users.json', users);
        
        const { password, ...userProfile } = users[index];
        res.json({ success: true, data: userProfile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== DOCUMENTS ROUTES ==================

// Get user documents
router.get('/documents', (req, res) => {
    try {
        const documents = readData('documents.json');
        const { userId } = req.query;
        
        let userDocs = documents;
        if (userId) {
            userDocs = documents.filter(doc => doc.userId === userId);
        }
        
        res.json({ success: true, data: userDocs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload document
router.post('/documents', (req, res) => {
    try {
        const documents = readData('documents.json');
        const newDocument = {
            id: uuidv4(),
            ...req.body,
            uploadedAt: new Date().toISOString(),
            status: 'pending'
        };
        
        documents.push(newDocument);
        writeData('documents.json', documents);
        
        res.status(201).json({ success: true, data: newDocument });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete document
router.delete('/documents/:id', (req, res) => {
    try {
        const documents = readData('documents.json');
        const filteredDocs = documents.filter(d => d.id !== req.params.id);
        
        if (documents.length === filteredDocs.length) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        writeData('documents.json', filteredDocs);
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== MESSAGES ROUTES ==================

// Get messages
router.get('/messages', (req, res) => {
    try {
        const messages = readData('messages.json');
        const { userId, contactId } = req.query;
        
        let userMessages = messages;
        if (userId) {
            userMessages = messages.filter(msg => msg.userId === userId || msg.contactId === userId);
        }
        if (contactId) {
            userMessages = userMessages.filter(msg => 
                (msg.userId === contactId || msg.contactId === contactId)
            );
        }
        
        res.json({ success: true, data: userMessages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send message
router.post('/messages', (req, res) => {
    try {
        const messages = readData('messages.json');
        const newMessage = {
            id: uuidv4(),
            ...req.body,
            sentAt: new Date().toISOString(),
            read: false
        };
        
        messages.push(newMessage);
        writeData('messages.json', messages);
        
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark message as read
router.put('/messages/:id/read', (req, res) => {
    try {
        const messages = readData('messages.json');
        const index = messages.findIndex(m => m.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        messages[index].read = true;
        messages[index].readAt = new Date().toISOString();
        writeData('messages.json', messages);
        
        res.json({ success: true, data: messages[index] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== SERVICES ROUTES ==================

// Get all services
router.get('/services', (req, res) => {
    try {
        const services = [
            {
                id: '1',
                name: 'Passport Renewal',
                description: 'Assistance with DFA passport renewal applications',
                icon: 'fa-passport',
                status: 'available'
            },
            {
                id: '2',
                name: 'Flight Booking',
                description: 'Affordable flight bookings to Middle East destinations',
                icon: 'fa-plane-departure',
                status: 'available'
            },
            {
                id: '3',
                name: 'Remittance',
                description: 'Fast and secure money transfer services',
                icon: 'fa-hand-holding-usd',
                status: 'available'
            },
            {
                id: '4',
                name: 'Insurance',
                description: 'OFW insurance and HMO coverage packages',
                icon: 'fa-shield-alt',
                status: 'available'
            },
            {
                id: '5',
                name: '24/7 Assistance',
                description: 'Emergency hotline for OFW concerns',
                icon: 'fa-phone-alt',
                status: 'available'
            },
            {
                id: '6',
                name: 'Training Programs',
                description: 'Skills enhancement and certification training',
                icon: 'fa-graduation-cap',
                status: 'available'
            }
        ];
        
        res.json({ success: true, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Inquire about service
router.post('/services/inquire', (req, res) => {
    try {
        const { serviceId, userId, message } = req.body;
        
        const inquiry = {
            id: uuidv4(),
            serviceId,
            userId,
            message,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        res.status(201).json({ success: true, data: inquiry, message: 'Inquiry sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== STATISTICS ROUTES ==================

// Get dashboard stats
router.get('/stats/:userId', (req, res) => {
    try {
        const applications = readData('applications.json');
        const userApps = applications.filter(app => app.userId === req.params.userId);
        
        const stats = {
            totalApplications: userApps.length,
            pending: userApps.filter(app => app.status === 'pending').length,
            interview: userApps.filter(app => app.status === 'interview').length,
            approved: userApps.filter(app => app.status === 'approved').length,
            rejected: userApps.filter(app => app.status === 'rejected').length
        };
        
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== AUTH ROUTES ==================

// Login
router.post('/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const users = readData('users.json');
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const { password: _, ...userData } = user;
        res.json({ success: true, data: userData, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Register
router.post('/auth/register', (req, res) => {
    try {
        const users = readData('users.json');
        const { email } = req.body;
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        
        const newUser = {
            id: uuidv4(),
            ...req.body,
            role: 'user',
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        users.push(newUser);
        writeData('users.json', users);
        
        const { password, ...userData } = newUser;
        res.status(201).json({ success: true, data: userData, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;