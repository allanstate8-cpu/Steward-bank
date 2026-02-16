// Database Module for Steward Bank Loan System
require('dotenv').config();

// In-memory admin storage (replace with MongoDB in production)
const admins = [
    {
        id: 'admin_zw_001',
        name: 'Tendai Moyo',
        email: 'tendai.moyo@stewardbank.co.zw',
        telegramChatId: process.env.SUPER_ADMIN_CHAT_ID || '',
        status: 'active',
        createdAt: new Date()
    }
];

// Get all active admins
function getAdmins() {
    return admins.filter(admin => admin.status === 'active');
}

// Get admin by ID
function getAdminById(adminId) {
    return admins.find(admin => admin.id === adminId);
}

// Add new admin
function addAdmin(adminData) {
    const newAdmin = {
        id: `admin_zw_${Date.now()}`,
        ...adminData,
        status: 'active',
        createdAt: new Date()
    };
    admins.push(newAdmin);
    return newAdmin;
}

// Update admin
function updateAdmin(adminId, updates) {
    const index = admins.findIndex(admin => admin.id === adminId);
    if (index !== -1) {
        admins[index] = { ...admins[index], ...updates };
        return admins[index];
    }
    return null;
}

// Delete admin (soft delete)
function deleteAdmin(adminId) {
    const index = admins.findIndex(admin => admin.id === adminId);
    if (index !== -1) {
        admins[index].status = 'inactive';
        return true;
    }
    return false;
}

module.exports = {
    getAdmins,
    getAdminById,
    addAdmin,
    updateAdmin,
    deleteAdmin
};
