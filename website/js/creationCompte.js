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

    // Perform the AJAX request
    fetch('/event/creationCompte', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/'; // Redirect on success
        } else {
            return response.text().then(text => {
                // Show error message
                document.getElementById('erreur-email').innerText = text;
            });
        }
    })
    .catch(error => console.error('Error:', error));
}


function redirectAccueil(event) {
    event.preventDefault();
    window.location.href = "/";
    console.log("Rediriction finie");
}