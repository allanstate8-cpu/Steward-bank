// Landing Page Calculator Script for Steward Bank (Zimbabwe)
document.addEventListener('DOMContentLoaded', function() {
    // Capture admin ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const adminId = urlParams.get('admin');
    
    if (adminId && adminId !== '' && adminId !== 'undefined' && adminId !== 'null') {
        sessionStorage.setItem('selectedAdminId', adminId);
        localStorage.setItem('selectedAdminId', adminId);
        console.log('✅ Admin ID captured:', adminId);
    }
    
    // LOAN CALCULATOR (USD)
    const calcSlider = document.getElementById('calcSlider');
    const calcAmount = document.getElementById('calcAmount');
    const calcTerm = document.getElementById('calcTerm');
    const monthlyPaymentDisplay = document.getElementById('monthlyPayment');
    const totalRepaymentDisplay = document.getElementById('totalRepayment');
    
    const annualRate = 0.12; // 12% APR
    
    function calculateLoan() {
        const amount = parseFloat(calcAmount.value) || 1000;
        const term = parseInt(calcTerm.value) || 12;
        const monthlyRate = annualRate / 12;
        
        const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, term) / 
                              (Math.pow(1 + monthlyRate, term) - 1);
        
        const totalRepayment = monthlyPayment * term;
        
        if (monthlyPaymentDisplay) {
            monthlyPaymentDisplay.textContent = '$' + Math.round(monthlyPayment).toLocaleString();
        }
        
        if (totalRepaymentDisplay) {
            totalRepaymentDisplay.textContent = '$' + Math.round(totalRepayment).toLocaleString();
        }
    }
    
    // Sync slider and input
    if (calcSlider && calcAmount) {
        calcSlider.addEventListener('input', function() {
            calcAmount.value = this.value;
            calculateLoan();
        });
        
        calcAmount.addEventListener('input', function() {
            const value = Math.max(100, Math.min(10000, this.value || 1000));
            this.value = value;
            calcSlider.value = value;
            calculateLoan();
        });
    }
    
    if (calcTerm) {
        calcTerm.addEventListener('change', calculateLoan);
    }
    
    calculateLoan();
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Apply button handler
    const applyButtons = document.querySelectorAll('.apply-btn, .cta-button, [href="application.html"]');
    
    applyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const storedAdminId = sessionStorage.getItem('selectedAdminId') || 
                                 localStorage.getItem('selectedAdminId');
            
            const applicationId = 'APP-' + Date.now();
            
            const applicationData = {
                applicationId: applicationId,
                timestamp: new Date().toISOString(),
                adminId: storedAdminId,
                createdAt: new Date().toLocaleString('en-US', { timeZone: 'Africa/Harare' })
            };
            
            sessionStorage.setItem('applicationData', JSON.stringify(applicationData));
            localStorage.setItem('lastApplicationData', JSON.stringify(applicationData));
            
            console.log('📋 Application created:', applicationId);
            if (storedAdminId) {
                console.log('👤 Assigned to admin:', storedAdminId);
            }
        });
    });
});
