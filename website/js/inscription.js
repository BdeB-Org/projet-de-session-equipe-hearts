const phoneInput = document.getElementById('phone');
const firstNameInput = document.getElementById('firstName');
const form = document.getElementById('myForm');

phoneInput.addEventListener('input', function() {
    if (phoneInput.validity.patternMismatch) {
        phoneInput.setCustomValidity("Le numéro de téléphone doit être au format 514-232-4223.");
    } else {
        phoneInput.setCustomValidity(""); // Clear the error if the input is valid
    }
});

firstNameInput.addEventListener('input', function() {
    if (firstNameInput.validity.valueMissing) {
        firstNameInput.setCustomValidity("Veuillez entrer votre prénom.");
    } else {
        firstNameInput.setCustomValidity(""); // Clear the error if the input is valid
    }
});

form.addEventListener('submit', function(event) {
    // Show error messages next to inputs
    if (!phoneInput.checkValidity()) {
        document.getElementById('phoneError').textContent = phoneInput.validationMessage;
    } else {
        document.getElementById('phoneError').textContent = "";
    }

    if (!firstNameInput.checkValidity()) {
        document.getElementById('firstNameError').textContent = firstNameInput.validationMessage;
    } else {
        document.getElementById('firstNameError').textContent = "";
    }

    if (!form.checkValidity()) {
        event.preventDefault(); // Prevent form submission if invalid
    }
});