document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "Premium";

  const loadingScreen = document.getElementById("loading-screen");
  const confirmation = document.getElementById("confirmation");
  const planText = document.querySelector(".highlight.plan");

  planText.textContent = plan;

  // Fake loading simulation
  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
      confirmation.style.display = "block";
      confirmation.classList.add("fade-in");
    }, 500);
  }, 2000);
});
