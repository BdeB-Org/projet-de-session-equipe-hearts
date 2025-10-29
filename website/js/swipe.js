document.addEventListener("DOMContentLoaded", () => {
  // Mock current user for sidebar
  const userDetails = {
    e_prenom: "Ava",
    e_photo: "/images/user.jpg",
  };
  document.querySelector(".profile-picture").src = userDetails.e_photo;
  document.getElementById("user-name").textContent = userDetails.e_prenom;

  // Mock swipe data
  const users = [
    { name: "Luna", age: 27, city: "Québec", img: "/images/date1.jpg" },
    { name: "Mia", age: 22, city: "Laval", img: "/images/date2.jpg" },
    { name: "Zoé", age: 26, city: "Longueuil", img: "/images/date3.jpg" },
    { name: "Ella", age: 25, city: "Sherbrooke", img: "/images/date4.jpg" },
    { name: "Nora", age: 24, city: "Montréal", img: "/images/date5.jpg" },
  ];

  let index = 0;
  let swipes = 0;
  const maxSwipes = 5;

  const card = document.querySelector(".mock-card");
  const swipesLeft = document.getElementById("swipes-left");

  function renderUser() {
    if (index >= users.length) {
      card.innerHTML = `<p style="color:#00ffff;">Plus d'utilisateurs disponibles.</p>`;
      return;
    }

    const user = users[index];
    card.innerHTML = `
            <img src="${user.img}" alt="${user.name}">
            <h2>${user.name}, ${user.age}</h2>
            <p>${user.city}</p>
            <div class="swipe-buttons">
              <button id="pass"><i class="fas fa-times"></i></button>
              <button id="like"><i class="fas fa-heart"></i></button>
            </div>
          `;
    attachEvents();
  }

  function attachEvents() {
    const likeBtn = document.getElementById("like");
    const passBtn = document.getElementById("pass");

    likeBtn.addEventListener("click", () => handleSwipe("right"));
    passBtn.addEventListener("click", () => handleSwipe("left"));
  }

  function handleSwipe(direction) {
    if (swipes >= maxSwipes) {
      card.innerHTML = `<p style="color:#ffcc00;">Limite de swipes atteinte.</p>`;
      return;
    }

    swipes++;
    swipesLeft.textContent = maxSwipes - swipes;
    card.classList.add(direction === "right" ? "swipe-right" : "swipe-left");

    setTimeout(() => {
      index++;
      card.classList.remove("swipe-right", "swipe-left");
      renderUser();
    }, 400);
  }

  renderUser();
});

  document.addEventListener("DOMContentLoaded", () => {
    const messagesIcon = document.querySelector(".fa-comments");
    if (messagesIcon) {
      messagesIcon.addEventListener("click", (e) => {
        e.preventDefault();
        alert("La messagerie est désactivée dans la version démo !");
      });
    }
  });