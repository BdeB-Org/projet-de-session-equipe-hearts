document.addEventListener('DOMContentLoaded', () => {
    // Remplir les champs avec les valeurs stockées dans localStorage
    const storedEmail = localStorage.getItem('email');
    const storedPassword = localStorage.getItem('password');

    if (storedEmail) {
        document.getElementById('email').value = storedEmail;
        localStorage.removeItem('email'); // Supprimer après utilisation si souhaité
    }

    if (storedPassword) {
        document.getElementById('password').value = storedPassword;
        localStorage.removeItem('password'); // Supprimer après utilisation si souhaité
    }

    // Gestion de la sélection des icônes
    const icons = document.querySelectorAll('.icon');
    let selectedIcon = null; // Stocker l'icône sélectionnée

    icons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            event.preventDefault(); // Empêcher le comportement par défaut

            // Retirer la classe 'selected' de l'icône actuellement sélectionnée, le cas échéant
            if (selectedIcon) {
                selectedIcon.classList.remove('selected');
            }

            // Ajouter la classe 'selected' à l'icône cliquée
            icon.classList.add('selected');
            selectedIcon = icon; // Définir l'icône nouvellement cliquée comme l'icône sélectionnée

            // Mettre à jour le champ caché avec l'ID de l'icône sélectionnée
            const iconId = icon.id; // ID de l'icône, comme 'ace', 'joker', etc.
            document.getElementById('selected-card').value = iconId; // Mettre à jour le champ caché
        });
    });

    // Gestion du modal
    document.getElementById("pick-options-btn").addEventListener("click", function () {
        document.getElementById("options-modal").style.display = "block"; // Ouvrir le modal
    });

    document.querySelector(".close-btn").addEventListener("click", function () {
        document.getElementById("options-modal").style.display = "none"; // Fermer le modal
    });

    document.getElementById("save-options-btn").addEventListener("click", function () {
        const checkboxes = document.querySelectorAll('.scrollable-options input[type="checkbox"]');
        const selected = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        document.getElementById("selected-options").textContent = selected.join(", ");
        document.getElementById("selected-likes").value = selected.join(','); // Mettre à jour le champ caché
        document.getElementById("options-modal").style.display = "none"; // Fermer le modal
    });

    // Fermer le modal lorsque l'utilisateur clique en dehors de celui-ci
    window.addEventListener("click", function (event) {
        const modal = document.getElementById("options-modal");
        if (event.target === modal) {
            modal.style.display = "none"; // Fermer le modal
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('.image-section');

    images.forEach(image => {
        image.addEventListener('click', () => {
            // Remove the 'selected' class from all images
            images.forEach(img => img.classList.remove('selected'));
            
            // Add the 'selected' class to the clicked image
            image.classList.add('selected');

            // Check the associated radio button
            const radioButton = document.getElementById("radio" + image.querySelector('img').alt);
            radioButton.checked = true;

            // Set the hidden selectedSexualite field
            const selectedSexualiteField = document.getElementById('selectedSexualite');
            selectedSexualiteField.value = image.querySelector('img').alt === 'Homme' ? '1' : '2';
        });
    });

    // Prevent form submission if no image is selected
    document.getElementById('myForm').addEventListener('submit', (e) => {
        const isSelected = document.querySelector('input[name="selectedImage"]:checked');
        console.log("isSelected:", isSelected); // Debug log

        if (!isSelected) {
            alert("Vous n'avez pas encore choisi entre 'Homme' ou 'Femme'. Faites votre choix avec les images à gauche.");
            e.preventDefault(); // Prevent form submission
        }
    });
});