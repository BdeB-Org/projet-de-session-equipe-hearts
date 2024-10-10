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
    event.preventDefault(); // Prevent the default form submission
    const email = document.getElementById('courriel_insc').value;
    const password = document.getElementById('mdp_insc').value;

    // Validate inputs here...

    // Store email and password in localStorage
    localStorage.setItem('email', email);
    localStorage.setItem('password', password);

    // Redirect to the inscription page
    window.location.href = '/event/inscription';
}



function redirectAccueil(event) {
    event.preventDefault();
    window.location.href = "/";
    console.log("Rediriction finie");
}