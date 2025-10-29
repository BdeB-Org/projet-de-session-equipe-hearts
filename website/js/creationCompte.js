const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

registerBtn.addEventListener("click", () => {
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  container.classList.remove("active");
});

function redirectInscription(event) {
  event.preventDefault();
  const email = document.getElementById("courriel_insc").value;
  const password = document.getElementById("mdp_insc").value;

  localStorage.setItem("email", email);
  localStorage.setItem("password", password);

  window.location.href = "./views/pages/inscription.html";
}

function redirectAccueil(event) {
  event.preventDefault();
  window.location.href = "/";
  console.log("Rediriction finie");
}

particlesJS("particles-js", {
  particles: {
    number: {
      value: 120,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "#ff00ff",
    },
    shape: {
      type: "circle",
    },
    opacity: {
      value: 0.7,
      random: true,
      anim: {
        enable: false,
      },
    },
    size: {
      value: 4,
      random: true,
      anim: {
        enable: false,
      },
    },
    line_linked: {
      enable: true,
      distance: 200,
      color: "#ffcc00",
      opacity: 0.5,
      width: 1.5,
    },
    move: {
      bounce: true,
      enable: true,
      speed: 1,
      out_mode: "out",
    },
  },
  interactivity: {
    detect_on: "window",
    events: {
      onhover: {
        enable: true,
        mode: "repulse",
      },
      resize: {
        enable: true,
        density_auto: true,
        density_area: 800,
      },
    },
    modes: {
      repulse: {
        distance: 100,
        duration: 0.4,
      },
    },
  },
  retina_detect: true,
});

window.addEventListener("focus", () => {
  if (pJSDom && pJSDom[0] && pJSDom[0].pJS) {
    pJSDom[0].pJS.fn.particlesRefresh();
  }
});

function loginWithGoogle() {
  const width = 600;
  const height = 600;
  const left = window.innerWidth / 2 - width / 2;
  const top = window.innerHeight / 2 - height / 2;
  const options = `width=${width},height=${height},top=${top},left=${left}`;
  const googleAuthUrl = "/auth/google";

  window.open(googleAuthUrl, "Google Login", options);
}

document.addEventListener("DOMContentLoaded", () => {
  const googleButtons = document.querySelectorAll(".fa-google");

  googleButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Orbitron', sans-serif",
        color: "#fff",
        fontSize: "1.5em",
        zIndex: "9999",
      });
      overlay.innerHTML = `
        <i class="fab fa-google fa-spin" style="font-size:3em;margin-bottom:20px;color:#ffcc00;"></i>
        Connexion à Google...
      `;
      document.body.appendChild(overlay);

      setTimeout(() => {
        overlay.remove();
        window.location.href = "/views/pages/google-completion.html";
      }, 1500);
    });
  });
});

document.querySelector(".mdp_button").addEventListener("click", (e) => {
  e.preventDefault();
  alert(
    "La fonctionnalité de récupération de mot de passe n’est pas disponible dans la version démo."
  );
});

const unavailableSocials = document.querySelectorAll(
  ".fa-facebook, .fa-apple, .fa-twitter"
);

unavailableSocials.forEach((icon) => {
  icon.parentElement.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Seule la connexion Google est disponible dans cette version démo.");
  });
});

function redirectSwipe(event) {
  event.preventDefault();
  window.location.href = "./views/pages/swipe.html";
}
