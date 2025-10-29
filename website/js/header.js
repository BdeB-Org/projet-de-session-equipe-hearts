const appMenu = document.querySelector(".app-menu");
const navbar = document.getElementById("navbar");
const animationSquare = document.getElementById("animationSquare");
let navbarVisible = true;

appMenu.addEventListener("click", () => {
  if (navbarVisible) {
    animationSquare.classList.add("active");
    navbar.style.opacity = "0";
    navbarVisible = false;

    setTimeout(() => {
      navbar.style.visibility = "hidden";
    }, 500);
  } else {
    navbar.style.visibility = "visible";
    navbar.style.opacity = "0";
    animationSquare.classList.remove("active");

    setTimeout(() => {
      navbar.style.opacity = "1";
    }, 20);

    navbarVisible = true;
  }
});
