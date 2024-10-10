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
