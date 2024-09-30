const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

function redirectInscription(event) {
    event.preventDefault(); // Prevent form submission to add custom validation

    // Custom validation
    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;
    const confirmPassword = document.querySelectorAll('input[type="password"]')[1].value;

    if (!email || !password || !confirmPassword) {
        alert("All fields are required!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Redirect or proceed with submission
    window.location.href = "/event/inscription";
}

function redirectAccueil(event) {
    event.preventDefault();
    window.location.href = "/";
    console.log("Rediriction finie");
}