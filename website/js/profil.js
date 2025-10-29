// --------- Fade-in on load ----------
window.addEventListener("load", () => {
  const profileContainer = document.querySelector(".profile-container");
  setTimeout(() => profileContainer.classList.add("active"), 100);
});

// --------- Elements ----------
const leftArrow = document.querySelector(".left-arrow");
const rightArrow = document.querySelector(".right-arrow");
const profile = document.querySelector(".profile-container");
const modifyBox = document.querySelector(".modify-profile-container");
const previewBox = document.querySelector(".preview");

// --------- Guards (fail fast if markup missing) ----------
if (!leftArrow || !rightArrow || !profile || !modifyBox || !previewBox) {
  console.error("Profile UI: missing required elements.");
}

// --------- State machine ----------
let state = "profile"; // 'profile' | 'preview' | 'modify'
let isAnimating = false; // click-lock during transitions
const DURATION = 300; // ms

// Arrow helpers
function activateArrow(arrow) {
  arrow.style.opacity = "1";
  arrow.style.pointerEvents = "auto";
}
function deactivateArrow(arrow) {
  arrow.style.opacity = "0.3";
  arrow.style.pointerEvents = "none";
}
function setArrows(mode) {
  // mode: 'both' | 'leftOnly' | 'rightOnly' | 'none'
  switch (mode) {
    case "both":
      activateArrow(leftArrow);
      activateArrow(rightArrow);
      break;
    case "leftOnly":
      activateArrow(leftArrow);
      deactivateArrow(rightArrow);
      break;
    case "rightOnly":
      activateArrow(rightArrow);
      deactivateArrow(leftArrow);
      break;
    default:
      deactivateArrow(leftArrow);
      deactivateArrow(rightArrow);
  }
}

// View helpers
function showProfile() {
  if (isAnimating) return;
  isAnimating = true;

  // hide side panels
  previewBox.style.opacity = "0";
  modifyBox.style.opacity = "0";

  setTimeout(() => {
    previewBox.style.display = "none";
    modifyBox.style.display = "none";
  }, DURATION - 10);

  // center profile
  profile.style.transition = "transform 0.3s ease";
  profile.style.transform = "translateX(0)";

  // arrows: both active from profile
  setArrows("both");

  setTimeout(() => {
    state = "profile";
    isAnimating = false;
  }, DURATION);
}

function showPreview() {
  if (isAnimating || state === "preview") return;
  isAnimating = true;

  // slide profile slightly right and show preview
  profile.style.transition = "transform 0.3s ease";
  profile.style.transform = "translateX(30%)";

  previewBox.style.display = "block";
  // force reflow before opacity change
  void previewBox.offsetWidth;
  previewBox.style.opacity = "1";

  // arrows: only RIGHT (to return to profile)
  setArrows("rightOnly");

  setTimeout(() => {
    state = "preview";
    isAnimating = false;
  }, DURATION);
}

function showModify() {
  if (isAnimating || state === "modify") return;
  isAnimating = true;

  // slide profile slightly left and show modify panel
  profile.style.transition = "transform 0.3s ease";
  profile.style.transform = "translateX(-30%)";

  modifyBox.style.display = "block";
  // force reflow
  void modifyBox.offsetWidth;
  modifyBox.style.opacity = "1";

  // arrows: only LEFT (to return to profile)
  setArrows("leftOnly");

  setTimeout(() => {
    state = "modify";
    isAnimating = false;
  }, DURATION);
}

// --------- Arrow wiring (simple & reliable) ----------
leftArrow.addEventListener("click", () => {
  if (isAnimating) return;

  if (state === "profile") {
    // from profile -> preview
    showPreview();
  } else if (state === "modify") {
    // from modify  -> profile
    showProfile();
  } else {
    // state === 'preview' -> left is disabled (do nothing)
  }
});

rightArrow.addEventListener("click", () => {
  if (isAnimating) return;

  if (state === "profile") {
    // from profile -> modify
    showModify();
  } else if (state === "preview") {
    // from preview -> profile
    showProfile();
  } else {
    // state === 'modify' -> right is disabled (do nothing)
  }
});

// --------- Forms & actions (demo) ----------
document.getElementById("edit-profile-btn")?.addEventListener("click", () => {
  const form = document.getElementById("update-profile-form");
  if (!form) return;
  form.style.display = form.style.display === "block" ? "none" : "block";
});

document
  .getElementById("change-password-btn")
  ?.addEventListener("click", () => {
    const form = document.getElementById("change-password-form");
    if (!form) return;
    form.style.display = form.style.display === "block" ? "none" : "block";
  });

document
  .getElementById("change-password-form")
  ?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Mot de passe mis à jour (version démo)");
  });

document
  .getElementById("update-profile-form")
  ?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    document
      .querySelector("#user-prenom")
      ?.replaceChildren(fd.get("new_firstName") || "");
    document
      .querySelector("#user-nom")
      ?.replaceChildren(fd.get("new_lastName") || "");
    document
      .querySelector("#user-email")
      ?.replaceChildren(fd.get("new_email") || "");
    alert("Profil mis à jour avec succès !");
  });

// Delete photo (demo)
document.querySelectorAll(".delete-photo").forEach((btn) => {
  btn.addEventListener("click", () => btn.parentElement?.remove());
});

// Update profile picture (demo)
document
  .getElementById("update-profile-picture-form")
  ?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("profilePicture");
    if (!input || !input.files || !input.files.length) {
      alert("Veuillez choisir une photo avant de mettre à jour !");
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.querySelector(".profile-picture"); // FIXED TYPO
      if (img) img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

// --------- Initial UI setup ----------
previewBox.style.display = "none";
previewBox.style.opacity = "0";
modifyBox.style.display = "none";
modifyBox.style.opacity = "0";
profile.style.transform = "translateX(0)";
setArrows("both"); // both active from the start

document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("upload-button");
  const fileInput = document.getElementById("file-upload");
  const uploadedPhotos = document.querySelector(".uploaded-photos");

  // Open file picker when "+" button clicked
  uploadButton.addEventListener("click", () => fileInput.click());

  // Handle image preview once files are chosen
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photoContainer = document.createElement("div");
        photoContainer.classList.add("photo-container");
        photoContainer.innerHTML = `
          <img src="${event.target.result}" alt="Uploaded Photo" 
               class="add-photo" 
               style="width: 100px; height: 100px; object-fit: cover;">
          <button class="delete-photo"><i class="fas fa-times"></i>X</button>
        `;

        uploadedPhotos.appendChild(photoContainer);

        // Add delete functionality
        const deleteBtn = photoContainer.querySelector(".delete-photo");
        deleteBtn.addEventListener("click", () => {
          photoContainer.remove();
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so user can re-upload same file if needed
    fileInput.value = "";
  });
});
