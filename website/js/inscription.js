document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;

    // Show the first step
    steps[currentStep].classList.add('active');

    // Add event listeners to "Next" buttons
    document.querySelectorAll('.next-button').forEach((button, index) => {
        button.addEventListener('click', () => {
            if (validateStep(index)) {
                steps[currentStep].classList.remove('active');
                currentStep++;
                if (currentStep < steps.length) {
                    steps[currentStep].classList.add('active');
                }
            }
        });
    });

    function validateStep(stepIndex) {
        const inputs = steps[stepIndex].querySelectorAll('input, select');
        for (let input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }
        return true;
    }
});
