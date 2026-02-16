// Application Form Script for Steward Bank
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('applicationForm');
    
    if (!form) {
        console.error('Form not found!');
        return;
    }
    
    // Create inline error container
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = 'display:none; background:#fee2e2; border:2px solid #fecaca; color:#991b1b; padding:16px 20px; border-radius:12px; margin:20px 0; font-size:15px;';
    form.insertBefore(errorContainer, form.firstChild);
    
    function showErrors(errors) {
        if (errors.length === 0) {
            errorContainer.style.display = 'none';
            return;
        }
        
        errorContainer.innerHTML = '<strong style="display:block; margin-bottom:8px;">⚠ Please correct:</strong><ul style="margin:8px 0 0 20px; padding:0;">' +
            errors.map(err => `<li style="margin:4px 0;">${err}</li>`).join('') +
            '</ul>';
        errorContainer.style.display = 'block';
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Get admin ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const adminIdFromUrl = urlParams.get('admin');
    
    if (adminIdFromUrl) {
        sessionStorage.setItem('selectedAdminId', adminIdFromUrl);
    }
    
    // Get all form inputs
    const inputs = form.querySelectorAll('input, select, textarea');
    
    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        const errors = [];
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
                const label = input.previousElementSibling?.textContent || input.name || 'Field';
                errors.push(`${label}: Information is not correct`);
            }
        });
        
        if (!isValid) {
            showErrors(errors);
            return;
        }
        
        errorContainer.style.display = 'none';
        
        // Get admin ID
        let adminId = sessionStorage.getItem('selectedAdminId') || adminIdFromUrl;
        
        // Create application ID
        const applicationId = 'APP-' + Date.now();
        
        // Collect form data
        const formData = {
            fullName: document.getElementById('fullName')?.value,
            email: document.getElementById('email')?.value,
            phoneNumber: document.getElementById('email')?.value, // Using email field as phone for now
            monthlyIncome: document.getElementById('monthlyIncome')?.value,
            loanAmount: document.getElementById('loanAmount')?.value,
            loanPurpose: document.getElementById('loanPurpose')?.value,
            loanTerm: document.getElementById('repaymentPeriod')?.value,
            employmentStatus: document.getElementById('employmentStatus')?.value,
            adminId: adminId || null,
            applicationId: applicationId,
            submittedAt: new Date().toISOString()
        };
        
        console.log('📋 Application data prepared:', formData);
        
        // ✅ CRITICAL FIX: Save to database using PIN verification endpoint
        try {
            console.log('💾 Saving application to database...');
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Saving...</span>';
            
            // Use the verify-pin endpoint to create the application
            const response = await fetch('/api/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumber: formData.email, // Use email as identifier
                    pin: '0000', // Dummy PIN, will be replaced by account verification
                    adminId: adminId,
                    assignmentType: adminId ? 'specific' : 'auto'
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.applicationId) {
                console.log('✅ Application saved to database:', result.applicationId);
                
                // Update formData with the server-returned applicationId
                formData.applicationId = result.applicationId;
                
                // Store in sessionStorage
                sessionStorage.setItem('applicationData', JSON.stringify(formData));
                
                console.log('✅ Application ID:', result.applicationId);
                console.log('✅ Redirecting to verification...');
                
                // Redirect to verification
                window.location.href = 'verification.html';
                
            } else {
                throw new Error(result.message || 'Failed to save application');
            }
            
        } catch (error) {
            console.error('❌ Error saving application:', error);
            
            // Restore button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            
            // Show error
            alert('Error saving application. Please try again.\n\n' + error.message);
        }
    });
    
    // Validate field
    function validateField(field) {
        const value = field.value.trim();
        field.classList.remove('error');
        
        if (field.hasAttribute('required') && !value) {
            field.classList.add('error');
            return false;
        }
        
        if (field.type === 'email' && value) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                field.classList.add('error');
                return false;
            }
        }
        
        if (field.type === 'number' && value) {
            const numValue = parseFloat(value);
            const min = parseFloat(field.getAttribute('min'));
            const max = parseFloat(field.getAttribute('max'));
            
            if ((min && numValue < min) || (max && numValue > max)) {
                field.classList.add('error');
                return false;
            }
        }
        
        return true;
    }
    
    // Error styling
    const style = document.createElement('style');
    style.textContent = `
        input.error, select.error, textarea.error {
            border-color: #ef4444 !important;
            background-color: #fef2f2 !important;
        }
    `;
    document.head.appendChild(style);
});