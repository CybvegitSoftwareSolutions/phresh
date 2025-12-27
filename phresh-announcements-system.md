# 📢 Complete Announcements System for Phresh Backend

## OVERVIEW
This file contains all the instructions for implementing a comprehensive announcements/notifications system for the Phresh fresh juices e-commerce platform.

## DATABASE MODEL (src/models/Announcement.js)
```javascript
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'promotion'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: false
  },
  targetAudience: {
    type: String,
    enum: ['all', 'registered', 'admin', 'specific'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDismissible: {
    type: Boolean,
    default: true
  },
  showOnHomepage: {
    type: Boolean,
    default: true
  },
  showInHeader: {
    type: Boolean,
    default: false
  },
  actionButton: {
    text: String,
    url: String,
    action: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
announcementSchema.index({ targetAudience: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
```

## CONTROLLER (src/controllers/announcementController.js)
```javascript
const Announcement = require('../models/Announcement');
const User = require('../models/User');

// Get active announcements for user
const getActiveAnnouncements = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const now = new Date();
    let query = {
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: now } }
      ]
    };

    // Filter by target audience
    if (userRole === 'admin') {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: 'admin' },
        { targetAudience: 'specific', targetUsers: userId }
      ];
    } else if (userId) {
      query.$or = [
        { targetAudience: 'all' },
        { targetAudience: 'registered' },
        { targetAudience: 'specific', targetUsers: userId }
      ];
    } else {
      query.targetAudience = 'all';
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

// Create announcement (admin only)
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      startDate,
      endDate,
      targetAudience,
      targetUsers,
      isDismissible,
      showOnHomepage,
      showInHeader,
      actionButton
    } = req.body;

    const announcement = new Announcement({
      title,
      message,
      type,
      priority,
      startDate: startDate || new Date(),
      endDate,
      targetAudience,
      targetUsers,
      isDismissible,
      showOnHomepage,
      showInHeader,
      actionButton,
      createdBy: req.user.id
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating announcement',
      error: error.message
    });
  }
};

// Update announcement (admin only)
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating announcement',
      error: error.message
    });
  }
};

// Delete announcement (admin only)
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting announcement',
      error: error.message
    });
  }
};

// Get all announcements (admin only)
const getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, priority } = req.query;

    let query = {};
    if (status) query.isActive = status === 'active';
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .populate('targetUsers', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Announcement.countDocuments(query);

    res.json({
      success: true,
      data: announcements,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

// Toggle announcement status (admin only)
const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
      data: announcement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling announcement status',
      error: error.message
    });
  }
};

// Get announcement statistics (admin only)
const getAnnouncementStats = async (req, res) => {
  try {
    const totalAnnouncements = await Announcement.countDocuments();
    const activeAnnouncements = await Announcement.countDocuments({ isActive: true });
    const expiredAnnouncements = await Announcement.countDocuments({
      endDate: { $lt: new Date() }
    });

    const announcementsByType = await Announcement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const announcementsByPriority = await Announcement.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalAnnouncements,
        active: activeAnnouncements,
        expired: expiredAnnouncements,
        byType: announcementsByType,
        byPriority: announcementsByPriority
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching announcement statistics',
      error: error.message
    });
  }
};

module.exports = {
  getActiveAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  toggleAnnouncementStatus,
  getAnnouncementStats
};
```

## ROUTES (src/routes/announcements.js)
```javascript
const express = require('express');
const router = express.Router();
const {
  getActiveAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  toggleAnnouncementStatus,
  getAnnouncementStats
} = require('../controllers/announcementController');
const { auth, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/active', getActiveAnnouncements);

// Admin routes
router.get('/admin', auth, adminAuth, getAllAnnouncements);
router.get('/admin/stats', auth, adminAuth, getAnnouncementStats);
router.post('/', auth, adminAuth, createAnnouncement);
router.put('/:id', auth, adminAuth, updateAnnouncement);
router.delete('/:id', auth, adminAuth, deleteAnnouncement);
router.patch('/:id/toggle', auth, adminAuth, toggleAnnouncementStatus);

module.exports = router;
```

## ADD TO MAIN INDEX.JS
```javascript
// Add this to your main index.js file
const announcementRoutes = require('./routes/announcements');
app.use('/api/announcements', announcementRoutes);
```

## API ENDPOINTS
- `GET /api/announcements/active` - Get active announcements for current user
- `GET /api/announcements/admin` - Get all announcements (admin only)
- `GET /api/announcements/admin/stats` - Get announcement statistics (admin only)
- `POST /api/announcements` - Create announcement (admin only)
- `PUT /api/announcements/:id` - Update announcement (admin only)
- `DELETE /api/announcements/:id` - Delete announcement (admin only)
- `PATCH /api/announcements/:id/toggle` - Toggle announcement status (admin only)

## FRONTEND INTEGRATION EXAMPLES

### Homepage Banner Component
```javascript
import React, { useState, useEffect } from 'react';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);

  useEffect(() => {
    fetch('/api/announcements/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnnouncements(data.data.filter(ann => ann.showOnHomepage));
        }
      });
  }, []);

  const dismissAnnouncement = (id) => {
    setDismissedAnnouncements([...dismissedAnnouncements, id]);
  };

  const handleAction = (actionButton) => {
    if (actionButton.url) {
      window.open(actionButton.url, '_blank');
    } else if (actionButton.action) {
      // Handle custom action
      console.log('Custom action:', actionButton.action);
    }
  };

  return (
    <div className="announcement-container">
      {announcements
        .filter(ann => !dismissedAnnouncements.includes(ann._id))
        .map(announcement => (
          <div key={announcement._id} className={`announcement-banner ${announcement.type} ${announcement.priority}`}>
            <div className="announcement-content">
              <h3>{announcement.title}</h3>
              <p>{announcement.message}</p>
              {announcement.actionButton && (
                <button 
                  className="announcement-action-btn"
                  onClick={() => handleAction(announcement.actionButton)}
                >
                  {announcement.actionButton.text}
                </button>
              )}
            </div>
            {announcement.isDismissible && (
              <button 
                className="announcement-dismiss"
                onClick={() => dismissAnnouncement(announcement._id)}
              >
                ×
              </button>
            )}
          </div>
        ))}
    </div>
  );
};

export default AnnouncementBanner;
```

### Header Notification Component
```javascript
import React, { useState, useEffect } from 'react';

const HeaderNotifications = () => {
  const [headerAnnouncements, setHeaderAnnouncements] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/announcements/active')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHeaderAnnouncements(data.data.filter(ann => ann.showInHeader));
        }
      });
  }, []);

  return (
    <div className="notification-container">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {headerAnnouncements.length > 0 && (
          <span className="notification-count">{headerAnnouncements.length}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="notification-list">
            {headerAnnouncements.map(announcement => (
              <div key={announcement._id} className={`notification-item ${announcement.type}`}>
                <div className="notification-content">
                  <h5>{announcement.title}</h5>
                  <p>{announcement.message}</p>
                  {announcement.actionButton && (
                    <button 
                      className="notification-action"
                      onClick={() => handleAction(announcement.actionButton)}
                    >
                      {announcement.actionButton.text}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {headerAnnouncements.length === 0 && (
              <p className="no-notifications">No new notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderNotifications;
```

### Admin Announcement Management
```javascript
import React, { useState, useEffect } from 'react';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements/admin', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const createAnnouncement = async (announcementData) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(announcementData)
      });
      const data = await response.json();
      if (data.success) {
        fetchAnnouncements();
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const toggleAnnouncementStatus = async (id) => {
    try {
      const response = await fetch(`/api/announcements/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const response = await fetch(`/api/announcements/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          fetchAnnouncements();
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  return (
    <div className="admin-announcements">
      <div className="announcements-header">
        <h2>Announcements Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Announcement
        </button>
      </div>

      {showCreateForm && (
        <CreateAnnouncementForm 
          onSubmit={createAnnouncement}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="announcements-list">
        {announcements.map(announcement => (
          <div key={announcement._id} className={`announcement-card ${announcement.isActive ? 'active' : 'inactive'}`}>
            <div className="announcement-header">
              <h3>{announcement.title}</h3>
              <div className="announcement-actions">
                <button 
                  className={`btn btn-sm ${announcement.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => toggleAnnouncementStatus(announcement._id)}
                >
                  {announcement.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditingAnnouncement(announcement)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteAnnouncement(announcement._id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="announcement-content">
              <p>{announcement.message}</p>
              <div className="announcement-meta">
                <span className={`badge badge-${announcement.type}`}>{announcement.type}</span>
                <span className={`badge badge-${announcement.priority}`}>{announcement.priority}</span>
                <span className="badge badge-info">{announcement.targetAudience}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
```

## CSS STYLES
```css
/* Announcement Banner Styles */
.announcement-container {
  position: relative;
  z-index: 1000;
}

.announcement-banner {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.announcement-banner.info {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-left: 4px solid #2196f3;
}

.announcement-banner.success {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border-left: 4px solid #4caf50;
}

.announcement-banner.warning {
  background: linear-gradient(135deg, #fff3e0, #ffcc02);
  border-left: 4px solid #ff9800;
}

.announcement-banner.error {
  background: linear-gradient(135deg, #ffebee, #ffcdd2);
  border-left: 4px solid #f44336;
}

.announcement-banner.promotion {
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  border-left: 4px solid #9c27b0;
}

.announcement-content {
  flex: 1;
}

.announcement-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.announcement-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.announcement-action-btn {
  background: #97ad58;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.announcement-action-btn:hover {
  background: #7a8f47;
}

.announcement-dismiss {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
}

.announcement-dismiss:hover {
  color: #333;
}

/* Priority Styles */
.announcement-banner.urgent {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Notification Bell Styles */
.notification-container {
  position: relative;
}

.notification-bell {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  position: relative;
  padding: 0.5rem;
}

.notification-count {
  position: absolute;
  top: 0;
  right: 0;
  background: #f44336;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  min-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.notification-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-content h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.notification-content p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.notification-action {
  background: #97ad58;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.no-notifications {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

/* Admin Styles */
.admin-announcements {
  padding: 2rem;
}

.announcements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.announcement-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.announcement-card.inactive {
  opacity: 0.6;
  background: #f5f5f5;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.announcement-actions {
  display: flex;
  gap: 0.5rem;
}

.announcement-meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-info { background: #e3f2fd; color: #1976d2; }
.badge-success { background: #e8f5e8; color: #388e3c; }
.badge-warning { background: #fff3e0; color: #f57c00; }
.badge-error { background: #ffebee; color: #d32f2f; }
.badge-promotion { background: #f3e5f5; color: #7b1fa2; }

.badge-low { background: #f5f5f5; color: #666; }
.badge-medium { background: #e3f2fd; color: #1976d2; }
.badge-high { background: #fff3e0; color: #f57c00; }
.badge-urgent { background: #ffebee; color: #d32f2f; }
```

## FEATURES INCLUDED
✅ **Multiple announcement types** (info, success, warning, error, promotion)  
✅ **Priority levels** (low, medium, high, urgent)  
✅ **Target audience control** (all, registered, admin, specific users)  
✅ **Scheduling** (start/end dates)  
✅ **Display options** (homepage, header, dismissible)  
✅ **Action buttons** with custom URLs or actions  
✅ **Admin management** (CRUD operations)  
✅ **Statistics and analytics**  
✅ **Responsive design**  
✅ **Real-time updates**  
✅ **User-friendly interface**  

This announcements system gives you complete control over user notifications, promotional messages, and important updates for your Phresh fresh juices platform!
