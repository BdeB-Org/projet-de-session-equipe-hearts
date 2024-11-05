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
