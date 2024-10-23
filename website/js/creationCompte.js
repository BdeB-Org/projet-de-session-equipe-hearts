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

particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": 120,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ff00ff" // Neon yellow for particles
        },
        "shape": {
            "type": "circle",
        },
        "opacity": {
            "value": 0.7,
            "random": true,
            "anim": {
                "enable": false
            }
        },
        "size": {
            "value": 4,
            "random": true,
            "anim": {
                "enable": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 200,
            "color": "#ffcc00", // Neon pink for the connecting lines
            "opacity": 0.5,
            "width": 1.5
        },
        "move": {
            "bounce": true,
            "enable": true,
            "speed": 1,
            "out_mode": "out"
        }
    },
    "interactivity": {
        "detect_on": "window",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "repulse"
            },
            "resize": {
                "enable": true,
                "density_auto": true,
                "density_area": 800
            }
        },
        "modes": {
            "repulse": {
                "distance": 100,
                "duration": 0.4
            }
        }
    },
    "retina_detect": true
});


window.addEventListener("focus", () => {
    if (pJSDom && pJSDom[0] && pJSDom[0].pJS) {
        pJSDom[0].pJS.fn.particlesRefresh();
    }
});

function loginWithGoogle() {
    const width = 600; // Width of the popup
    const height = 600; // Height of the popup
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    const options = `width=${width},height=${height},top=${top},left=${left}`;
    const googleAuthUrl = '/auth/google';

    window.open(googleAuthUrl, 'Google Login', options);
}

