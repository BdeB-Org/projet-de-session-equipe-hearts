// Get query params
const urlParams = new URLSearchParams(window.location.search);
const amount = parseFloat(urlParams.get("amount")) || 19.47;
const subscriptionName = urlParams.get("subscriptionType") || "Premium";

// Display plan + totals
document.getElementById("subscription-name").innerText = subscriptionName;
document.getElementById("initial-amount").innerText = `$${amount.toFixed(2)}`;

const tvqRate = 0.09975;
const tpsRate = 0.05;
const tvqAmount = amount * tvqRate;
const tpsAmount = amount * tpsRate;
const totalAmount = amount + tvqAmount + tpsAmount;

document.getElementById("tvq-amount").innerText = `$${tvqAmount.toFixed(2)}`;
document.getElementById("tps-amount").innerText = `$${tpsAmount.toFixed(2)}`;
document.getElementById("total-amount").innerText = `$${totalAmount.toFixed(2)}`;

const modal = document.getElementById("card-modal");
const loadingModal = document.getElementById("loading-modal");

document.getElementById("payment-form").addEventListener("submit", (e) => {
  e.preventDefault();
  modal.style.display = "flex";
});

function closeModal() {
  modal.style.display = "none";
}

document.getElementById("submit-button").addEventListener("click", () => {
  modal.style.display = "none";
  loadingModal.style.display = "flex";

  setTimeout(() => {
    loadingModal.style.display = "none";
    // Redirect to confirmation page with plan
    window.location.href = `confirmation.html?plan=${encodeURIComponent(subscriptionName)}`;
  }, 2000);
});
