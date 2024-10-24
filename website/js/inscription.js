document.addEventListener('DOMContentLoaded', () => {
    // Retrieve the stored email and password from localStorage
    const storedEmail = localStorage.getItem('email');
    const storedPassword = localStorage.getItem('password');

    // Populate the inputs if they exist
    if (storedEmail) {
        document.getElementById('email').value = storedEmail;
        localStorage.removeItem('email'); // Optionally remove from localStorage after using
    }
    
    if (storedPassword) {
        document.getElementById('password').value = storedPassword;
        localStorage.removeItem('password'); // Optionally remove from localStorage after using
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Select all icons
    const icons = document.querySelectorAll('.icon');
    let selectedIcon = null; // Store the selected icon

    // Add event listeners to each icon
    icons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default behavior

            // Remove 'selected' class from the currently selected icon, if any
            if (selectedIcon) {
                selectedIcon.classList.remove('selected');
            }

            // Add 'selected' class to the clicked icon
            icon.classList.add('selected');
            selectedIcon = icon; // Set the newly clicked icon as the selected one
        });
    });
});


document.getElementById("pick-options-btn").addEventListener("click", function() {
    document.getElementById("options-modal").style.display = "block";
});

document.querySelector(".close-btn").addEventListener("click", function() {
    document.getElementById("options-modal").style.display = "none";
});

document.getElementById("save-options-btn").addEventListener("click", function() {
    const checkboxes = document.querySelectorAll('.scrollable-options input[type="checkbox"]');
    const selected = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    document.getElementById("selected-options").textContent = selected.join(", ");
    document.getElementById("options-modal").style.display = "none";
});

// Close the modal when clicking outside of it
window.addEventListener("click", function(event) {
    const modal = document.getElementById("options-modal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
