function goToPayment(price, subscriptionType) {
  const baseUrl = `/event/payment?amount=${price}&subscriptionType=${subscriptionType}`;
  const hashedUrl = CryptoJS.SHA256(baseUrl).toString();
  window.location.href = `${baseUrl}&hash=${hashedUrl}`;
}

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789€";
let intervals = [];

// SCREENS
const screens = document.querySelectorAll(".screen");

screens.forEach((screen) => {
  const name = screen.querySelector(".name");
  const price = screen.querySelector(".price");
  const features = screen.querySelector(".features");
  const elementsToEncrypt = [name, price, features];

  screen.onmouseenter = () => {
    elementsToEncrypt.forEach((element, index) => {
      if (element.dataset.value) {
        let iteration = 0;

        if (intervals[index]) {
          clearInterval(intervals[index]);
        }

        intervals[index] = setInterval(() => {
          element.innerText = element.dataset.value
            .split("")
            .map((letter, idx) => {
              if (idx < iteration) {
                return element.dataset.value[idx];
              }
              return letters[Math.floor(Math.random() * letters.length)];
            })
            .join("");

          if (iteration >= element.dataset.value.length) {
            clearInterval(intervals[index]);
          }
          iteration += 1 / 1;
        }, 30);
      }
    });
  };

  screen.onmouseleave = () => {
    elementsToEncrypt.forEach((element, index) => {
      if (intervals[index]) {
        clearInterval(intervals[index]);
      }
      if (element.dataset.value) {
        element.innerText = element.dataset.value;
      }
    });
  };
});

function changePlan(subscriptionId) {
  fetch("/event/change-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ abonnement_id: subscriptionId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.reload();
      } else {
        alert("Erreur lors du changement de plan");
      }
    })
    .catch((error) => {
      console.error("Erreur:", error);
    });
}
function confirmChangePlan(subscriptionId) {
  const confirmation = confirm(
    "Êtes-vous sûr de vouloir changer de plan? Votre plan actuel se terminera maintenant."
  );

  if (confirmation) {
    changePlan(subscriptionId);
  }
}

const buttons = document.querySelectorAll('.custom_butt');
buttons.forEach(btn => {
  btn.addEventListener('click', e => {
    if (!btn.disabled) {
      buttons.forEach(b => b.disabled = false);
      btn.disabled = true;
      btn.textContent = 'Abonnement actuel';
    }
  });
});
