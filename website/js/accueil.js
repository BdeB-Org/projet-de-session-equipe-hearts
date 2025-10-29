document.addEventListener("mousemove", (e) => {
  const glow = document.querySelector(".glow");

  glow.style.left = `${e.pageX}px`;
  glow.style.top = `${e.pageY}px`;
});

const cards = document.querySelectorAll(".card");
const modal = document.getElementById("modal");
const modalDescription = document.getElementById("modal-description");

const inscriptionButton = document.createElement("div");
inscriptionButton.className = "modal-close";
inscriptionButton.textContent = "Inscription";
modal.appendChild(inscriptionButton);

cards.forEach((card) => {
  card.addEventListener("click", () => {
    modalDescription.innerHTML = "";

    const title = card.getAttribute("data-title");
    modalDescription.innerHTML += title + "<br>";

    const description = card.getAttribute("data-description");
    modalDescription.innerHTML += description.replace(/\n/g, "<br>");

    const cardType = card.getAttribute("data-card-type");
    inscriptionButton.setAttribute(
      "onclick",
      `window.location.href = "/views/pages/inscription.html";`
    );

    modal.style.display = "block";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const closeModalButton = document.getElementById("close-modal");
  const modal = document.getElementById("modal");

  if (closeModalButton && modal) {
    closeModalButton.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
});
function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.style.display = "none";
  }
}
