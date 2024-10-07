document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;

    // Show the first step
    steps[currentStep].classList.add('active');

    // Move to the next step when the current one is completed
    function goToNextStep() {
        if (validateStep(currentStep)) {
            steps[currentStep].classList.remove('active');
            currentStep++;
            if (currentStep < steps.length) {
                steps[currentStep].classList.add('active');
            }
        }
    }

    // Listen for Enter key press to move to the next step
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            goToNextStep();
        }
    });

    function validateStep(stepIndex) {
        const inputs = steps[stepIndex].querySelectorAll('input, select');
        for (let input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }

        // Additional password verification check
        if (stepIndex === 2) { // Verify Password step
            const password = document.getElementById('password').value;
            const verifyPassword = document.getElementById('verify-password').value;
            if (password !== verifyPassword) {
                alert("Les mots de passe ne correspondent pas.");
                return false;
            }
        }
        return true;
    }
});

// Select all icons and the Joker image
const icons = document.querySelectorAll('.icon');

// Add event listeners to each icon
icons.forEach(icon => {
    icon.addEventListener('click', () => {
        // Remove 'selected' class from all icons
        icons.forEach(i => i.classList.remove('selected'));
        
        // Add 'selected' class to the clicked icon
        icon.classList.add('selected');
    });
});
document.querySelectorAll('.icon').forEach(icon => {
    icon.addEventListener('click', function() {
        // Remove 'selected' class from all icons
        document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
        // Add 'selected' class to the clicked icon
        this.classList.add('selected');
    });
});
