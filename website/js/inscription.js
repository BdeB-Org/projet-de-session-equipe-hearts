let isEditing = false;
let editingFieldId = null;

document.addEventListener("DOMContentLoaded", () => {
  const questions = [
    { id: "email", prompt: "Entrez votre courriel" },
    { id: "password", prompt: "Créez un mot de passe" },
    { id: "verify-password", prompt: "Vérifiez votre mot de passe" },
    { id: "phone", prompt: "Entrez votre numéro de téléphone" },
    { id: "first-name", prompt: "Entrez votre prénom" },
    { id: "last-name", prompt: "Entrez votre nom de famille" },
    { id: "birthdate", prompt: "Quelle est votre date de naissance" },
    { id: "gender", prompt: "Sélectionnez votre genre" },
    { id: "selected-card", prompt: "Choissisez votre carte" },
    { id: "selected-likes", prompt: "Choissisez vos préférences" },
    { id: "photos", prompt: "Soumettre votre première photo" },
    { id: "selectedImage", prompt: "Choisissez qui vous voulez dater" },
  ];

  let currentQuestion = 0;

  // Show the initial question right away
  showBotMessage(questions[currentQuestion].prompt);

  // Event listener for the send button
  const sendButton = document.querySelector(".send-button");
  if (sendButton) {
    sendButton.addEventListener("click", handleResponse);
  } else {
    console.error("Send button not found in the DOM");
  }

  // Event listener for the Enter key in the input field
  const userInput = document.getElementById("userInput");
  userInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent the default Enter key behavior
      handleResponse();
    }
  });

  // Create date input element for the birthdate question
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "dateInput";
  dateInput.style.display = "none"; // Hidden by default
  document
    .querySelector(".input-container")
    .insertBefore(dateInput, sendButton);

  dateInput.addEventListener("change", () => {
    showUserResponse(dateInput.value);
    saveResponse("birthdate", dateInput.value);
    dateInput.style.display = "none"; // Hide date input
    userInput.style.display = ""; // Re-enable text input
    currentQuestion++;
    showNextQuestion();
  });
  window.saveResponse = function (fieldId, response) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = response; // Update the value of the hidden input field
      console.log(`Saved response: ${response} to field: ${fieldId}`);
    } else {
      console.error(`Field with id "${fieldId}" not found.`);
    }
  };

  function handleResponse() {
    const userInputValue = userInput.value.trim();

    if (questions[currentQuestion].id === "phone") {
      const digitCount = userInputValue.replace(/\D/g, "").length; // Count only digits
      if (digitCount !== 10) {
        alert("Le numéro de téléphone doit contenir exactement 10 chiffres.");
        return; // Stop further processing if the digit count is not 10
      }
    }
    // For the first question (email), check if the input is a valid email
    if (
      questions[currentQuestion].id === "email" &&
      !isValidEmail(userInputValue)
    ) {
      alert("Veuillez entrer une adresse e-mail valide.");
      return; // Stop if the email is invalid
    }

    // Set the input field type to "password" for password and verify-password questions
    if (
      questions[currentQuestion].id === "password" ||
      questions[currentQuestion].id === "verify-password"
    ) {
      userInput.type = "password";
    }

    // Check if we are on the verify-password question and validate passwords match
    if (questions[currentQuestion].id === "verify-password") {
      const password = document.getElementById("password").value;
      if (userInputValue !== password) {
        alert("Les mots de passe ne correspondent pas. Veuillez réessayer.");
        return; // Stop if passwords don't match
      }
    }

    if (!userInputValue) return;
    const fieldId = questions[currentQuestion].id;
    // Display asterisks instead of the actual password in chat
    const displayValue =
      questions[currentQuestion].id === "password" ||
      questions[currentQuestion].id === "verify-password"
        ? "*".repeat(userInputValue.length)
        : userInputValue;

    showUserResponse(userInputValue, fieldId); // Show hidden password as asterisks
    saveResponse(fieldId, userInputValue);

    userInput.value = ""; // Clear the input field

    // Remove the blinking effect from the previous bot message
    const lastBotMessage = document.querySelector(
      ".bot-message .blinking-line"
    );
    if (lastBotMessage) {
      lastBotMessage.classList.remove("blinking-line");
    }

    // Reset input type to text for other questions after password questions are answered
    if (questions[currentQuestion].id === "verify-password") {
      userInput.type = "text";
    }

    // Move to the next question if there are more questions
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      showNextQuestion();
    } else {
      submitForm(); // Submit the form once all questions are answered
    }
  }

  function isValidEmail(email) {
    // Simple email regex pattern for validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  function showNextQuestion() {
    if (currentQuestion >= questions.length) {
      console.error("No more questions available.");
      submitForm(); // Submit the form if all questions are answered
      return;
    }

    const nextQuestion = questions[currentQuestion];

    if (
      nextQuestion.id === "password" ||
      nextQuestion.id === "verify-password"
    ) {
      // Set input type to password
      userInput.type = "password";
    } else if (nextQuestion.id === "phone") {
      // Set input type to text and add a placeholder for phone formatting
      userInput.type = "text";
      userInput.placeholder = "XXX-XXX-XXXX";

      // Add phone formatting logic
      userInput.addEventListener("input", formatPhoneNumber);
    } else {
      // Reset input type to text for other questions and remove phone formatting
      userInput.type = "text";
      userInput.placeholder = "";

      // Remove phone formatting listener if it was added previously
      userInput.removeEventListener("input", formatPhoneNumber);
    }

    if (nextQuestion.id === "birthdate") {
      // Show date input for birthdate
      userInput.style.display = "none";
      dateInput.style.display = "";
      sendButton.style.display = "none";
      showBotMessage(nextQuestion.prompt);
    } else if (nextQuestion.id === "gender") {
      // Show gender radio buttons
      userInput.style.display = "none";
      sendButton.style.display = "none";
      showBotMessage(nextQuestion.prompt);

      const radioContainer = document.createElement("div");
      radioContainer.className = "radio-container";
      radioContainer.innerHTML = `
                <label><input type="radio" name="gender" value="H" required> Homme</label>
                <label><input type="radio" name="gender" value="F"> Femme</label>
                <label><input type="radio" name="gender" value="O"> Autre</label>
            `;

      const chatContainer = document.querySelector(".chat-container");
      const inputContainer = document.querySelector(".input-container");
      chatContainer.insertBefore(radioContainer, inputContainer);

      scrollToBottom();

      radioContainer.addEventListener("change", () => {
        const selectedOption = document.querySelector(
          'input[name="gender"]:checked'
        );
        if (selectedOption) {
          showUserResponse(selectedOption.nextSibling.textContent.trim());
          saveResponse("gender", selectedOption.value);
          radioContainer.remove();
          sendButton.style.display = "";
          userInput.style.display = "";
          currentQuestion++;
          showNextQuestion();
        }
      });
    } else if (nextQuestion.id === "selected-card") {
      // Show card selection icons
      userInput.style.display = "none";
      sendButton.style.display = "none";
      showBotMessage(nextQuestion.prompt);

      const iconContainer = document.createElement("div");
      iconContainer.className = "icon-container";
      iconContainer.innerHTML = `
                <label for="ace"><img src="/images/ace.png" class="icon" id="ace" alt="Ace"></label>
                <label for="joker"><img src="/images/joker.png" class="icon" id="joker" alt="Joker"></label>
                <label for="reine"><img src="/images/queen.png" class="icon" id="reine" alt="Reine"></label>
                <label for="roi"><img src="/images/king.png" class="icon" id="roi" alt="Roi"></label>
            `;

      const chatContainer = document.querySelector(".chat-container");
      const inputContainer = document.querySelector(".input-container");
      chatContainer.insertBefore(iconContainer, inputContainer);

      setTimeout(scrollToBottom, 100);

      iconContainer.addEventListener("click", (event) => {
        const selectedIcon = event.target.closest("img");
        if (selectedIcon) {
          const cardType = selectedIcon.alt;
          showUserResponse(cardType);
          saveResponse("selected-card", cardType);
          iconContainer.remove();
          sendButton.style.display = "";
          userInput.style.display = "";
          currentQuestion++;
          showNextQuestion();
        }
      });
    } else if (nextQuestion.id === "selected-likes") {
      // Show modal for likes/preferences selection
      userInput.style.display = "none";
      sendButton.style.display = "none";
      showBotMessage(nextQuestion.prompt);

      const modal = document.createElement("div");
      modal.id = "options-modal";
      modal.className = "modal";
      modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h3>Choisissez vos préférences</h3>
                    <div class="scrollable-options">
                        <label><input type="checkbox" name="interests" value="musique"> Musique</label>
                        <label><input type="checkbox" name="interests" value="cinema"> Cinéma</label>
                        <label><input type="checkbox" name="interests" value="voyages"> Voyages</label>
                        <label><input type="checkbox" name="interests" value="sport"> Sport</label>
                        <label><input type="checkbox" name="interests" value="lecture"> Lecture</label>
                        <label><input type="checkbox" name="interests" value="cuisine"> Cuisine</label>
                    </div>
                    <button type="button" id="save-options-btn">Save</button>
                </div>
            `;

      const chatContainer = document.querySelector(".chat-container");
      chatContainer.appendChild(modal);

      modal.style.display = "block";

      modal.querySelector(".close-btn").addEventListener("click", () => {
        modal.style.display = "none";
      });

      document
        .getElementById("save-options-btn")
        .addEventListener("click", () => {
          const selectedOptions = Array.from(
            document.querySelectorAll('input[name="interests"]:checked')
          ).map((checkbox) => checkbox.nextSibling.textContent.trim());

          showUserResponse(`Sélections: ${selectedOptions.join(", ")}`);
          saveResponse("selected-likes", selectedOptions.join(", "));

          modal.style.display = "none";
          modal.remove();

          sendButton.style.display = "";
          userInput.style.display = "";
          currentQuestion++;
          showNextQuestion();
        });
    } else if (nextQuestion.id === "selectedImage") {
      // Show image selection for "who you want to date" question
      userInput.style.display = "none";
      sendButton.style.display = "";
      showBotMessage(nextQuestion.prompt);

      const imageSection = document.createElement("div");
      imageSection.className = "image-selection";
      imageSection.innerHTML = `
                <div class="image-section image1">
                    <label for="radioHomme">
                        <img src="/images/swiper.png" class="icon" id="imageHomme" alt="Homme">
                    </label>
                    <input type="radio" name="selectedImage" id="radioHomme" value="Homme" hidden required>
                </div>
                <div class="image-section image2">
                    <label for="radioFemme">
                        <img src="/images/swiper2.png" class="icon" id="imageFemme" alt="Femme">
                    </label>
                    <input type="radio" name="selectedImage" id="radioFemme" value="Femme" hidden required>
                </div>
            `;

      const chatContainer = document.querySelector(".chat-container");
      const inputContainer = document.querySelector(".input-container");
      chatContainer.insertBefore(imageSection, inputContainer);

      setTimeout(scrollToBottom, 100);

      imageSection.addEventListener("click", (event) => {
        const selectedImage = event.target.closest("img");
        if (selectedImage) {
          const choice = selectedImage.alt;
          showUserResponse(`Image choisie: ${choice}`);
          saveResponse("selectedImage", choice);
          imageSection.remove();
          userInput.style.display = "";
          currentQuestion++;
          showNextQuestion();
        }
      });
    } else if (nextQuestion.id === "photos") {
      // Show file input for photo upload
      userInput.style.display = "none";
      sendButton.style.display = "";
      showBotMessage(nextQuestion.prompt);

      // Create a file input for photo upload
      const photoInput = document.createElement("input");
      photoInput.type = "file";
      photoInput.accept = "image/*";
      photoInput.id = "photoUpload";
      photoInput.className = "photo-upload";

      const chatContainer = document.querySelector(".chat-container");
      const inputContainer = document.querySelector(".input-container");
      chatContainer.insertBefore(photoInput, inputContainer);

      sendButton.addEventListener("click", function handlePhotoSubmit() {
        if (photoInput.files.length > 0) {
          const fileName = photoInput.files[0].name;
          showUserResponse(`Photo sélectionnée : ${fileName}`);

          // Directly assign the file to the hidden input in the form
          const formFileInput = document.getElementById("photos");
          formFileInput.files = photoInput.files;

          // Clean up
          photoInput.remove();
          sendButton.removeEventListener("click", handlePhotoSubmit);

          // Advance to the next question
          currentQuestion++;
          showNextQuestion();
        } else {
          // Alert user to choose a file if they haven't yet
          alert("Veuillez sélectionner une photo avant de continuer.");
        }
      });
    } else if (currentQuestion < questions.length - 1) {
      // Handle other questions as before
      userInput.style.display = "";
      sendButton.style.display = "";
      showBotMessage(nextQuestion.prompt);
    } else {
      // If this is the last question, submit the form
      submitForm();
    }
  }

  function formatPhoneNumber(event) {
    const input = event.target;
    let inputValue = input.value.replace(/\D/g, ""); // Remove all non-digit characters

    // Apply formatting
    if (inputValue.length > 3 && inputValue.length <= 6) {
      input.value = `${inputValue.slice(0, 3)}-${inputValue.slice(3)}`;
    } else if (inputValue.length > 6) {
      input.value = `${inputValue.slice(0, 3)}-${inputValue.slice(
        3,
        6
      )}-${inputValue.slice(6, 10)}`;
    } else {
      input.value = inputValue;
    }

    // Limit to 10 digits
    if (inputValue.length > 10) {
      input.value = input.value.slice(0, 12);
    }
  }

  function showBotMessage(message) {
    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "message bot-message";

    // Place the blinking line directly after the message text in the same span
    botMessageDiv.innerHTML = `<span class="typing-effect">${message}<span class="blinking-line"></span></span>`;

    const chatContainer = document.querySelector(".chat-container");
    const inputContainer = document.querySelector(".input-container");
    chatContainer.insertBefore(botMessageDiv, inputContainer);

    scrollToBottom();

    // Remove the blinking line for specific questions
    if (
      message.includes("date de naissance") ||
      message.includes("genre") ||
      message.includes("carte") ||
      message.includes("préférence")
    ) {
      const blinkingLine = botMessageDiv.querySelector(".blinking-line");
      if (blinkingLine) {
        blinkingLine.remove();
      }
    }
  }

  function showUserResponse(response, fieldId) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user-message";

    // Add user response with a pencil icon for editing
    if (fieldId !== "verify-password") {
      messageDiv.innerHTML = `
        <span>${response}</span>
        <i class="fa-solid fa-pencil edit-icon" data-field-id="${fieldId}" style="cursor: pointer; margin-left: 10px;"></i>
      `;
    } else {
      // Only display the response for "verify-password" without the pencil icon
      messageDiv.innerHTML = `
        <span>${response}</span>
      `;
    }

    const chatContainer = document.querySelector(".chat-container");
    const inputContainer = document.querySelector(".input-container");
    chatContainer.insertBefore(messageDiv, inputContainer);

    scrollToBottom();

    // Add event listener to the pencil icon to enable editing
    const editIcon = messageDiv.querySelector(".edit-icon");
    if (editIcon) {
      editIcon.addEventListener("click", () => {
        editResponse(fieldId, response);
      });
    }
  }

  function submitForm() {
    document.getElementById("myForm").submit();
  }

  function scrollToBottom() {
    const chatContainer = document.querySelector(".chat-container");
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});

function editResponse(fieldId, oldResponse) {
  console.log(`Editing field: ${fieldId} with value: ${oldResponse}`); // Debug log
  if (isEditing) return; // Prevent multiple edits simultaneously
  isEditing = true;

  // Find the message to edit
  const chatContainer = document.querySelector(".chat-container");
  const messages = Array.from(chatContainer.querySelectorAll(".user-message"));
  const messageToEdit = messages.find((message) => {
    const icon = message.querySelector(".edit-icon");
    return icon && icon.getAttribute("data-field-id") === fieldId;
  });

  if (!messageToEdit) {
    isEditing = false;
    return; // Exit if the message is not found
  }

  // Save the original content for cancellation
  const originalContent = messageToEdit.innerHTML;

  // For password fields, display both password and verification inputs
  if (fieldId === "password") {
    messageToEdit.innerHTML = `
      <input
        type="password"
        id="new-password"
        placeholder="Nouveau mdp"
        class="edit-input"
        style="margin-right: 10px; padding: 5px; border: 1px solid #555; border-radius: 5px; width: 30%;"
      />
      <input
        type="password"
        id="verify-new-password"
        placeholder="Vérification mdp"
        class="edit-input"
        style="margin-right: 10px; padding: 5px; border: 1px solid #555; border-radius: 5px; width: 30%;"
      />
      <button class="save-edit-button" style="padding: 5px 10px; background: #00ffcc; color: #000; border: none; border-radius: 5px; cursor: pointer;">Confirm</button>
      <button class="cancel-edit-button" style="padding: 5px 10px; background: #ff007f; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-left: 5px;">Cancel</button>
    `;
  } else {
    // For other fields
    messageToEdit.innerHTML = `
      <input
        type="text"
        id="edit-${fieldId}"
        value="${oldResponse}"
        class="edit-input"
        style="margin-right: 10px; padding: 5px; border: 1px solid #555; border-radius: 5px; width: 70%;"
      />
      <button class="save-edit-button" style="padding: 5px 10px; background: #00ffcc; color: #000; border: none; border-radius: 5px; cursor: pointer;">Confirm</button>
      <button class="cancel-edit-button" style="padding: 5px 10px; background: #ff007f; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-left: 5px;">Cancel</button>
    `;
  }

  // Disable the "Next" button while editing
  const sendButton = document.querySelector(".send-button");
  if (sendButton) sendButton.disabled = true;

  const saveButton = messageToEdit.querySelector(".save-edit-button");
  const cancelButton = messageToEdit.querySelector(".cancel-edit-button");

  // Save button click event
  saveButton.addEventListener("click", () => {
    if (fieldId === "password") {
      const newPassword = document.getElementById("new-password").value.trim();
      const verifyPassword = document
        .getElementById("verify-new-password")
        .value.trim();

      // Check if the passwords match
      if (newPassword !== verifyPassword) {
        alert("Les mots de passe ne correspondent pas. Veuillez réessayer.");
        return; // Stop if passwords don't match
      }

      // Optional: Check password strength
      if (newPassword.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      // Save the new password
      saveResponse(fieldId, newPassword);

      // Automatically update the hidden "verify-password" field to match
      saveResponse("verify-password", newPassword);

      // Update the "verify-password" UI message dynamically
      const verifyPasswordMessage = Array.from(
        document.querySelectorAll(".user-message")
      ).find((message) => {
        const icon = message.querySelector(".edit-icon");
        return icon && icon.getAttribute("data-field-id") === "verify-password";
      });

      if (verifyPasswordMessage) {
        const spanElement = verifyPasswordMessage.querySelector("span");
        if (spanElement) {
          spanElement.textContent = "*".repeat(newPassword.length); // Update the displayed password as asterisks
        }
      }

      // Replace the input with the updated response and add the pencil icon
      messageToEdit.innerHTML = `
        <span>${"*".repeat(newPassword.length)}</span>
        <i class="fa-solid fa-pencil edit-icon" data-field-id="${fieldId}" style="cursor: pointer; margin-left: 10px;"></i>
      `;

      // Add the click event to the new pencil icon
      const newEditIcon = messageToEdit.querySelector(".edit-icon");
      newEditIcon.addEventListener("click", () =>
        editResponse(fieldId, newPassword)
      );

      // Re-enable the "Next" button
      if (sendButton) sendButton.disabled = false;

      isEditing = false;
    } else {
      const newValue = document.getElementById(`edit-${fieldId}`).value.trim();
      if (!newValue) {
        alert("The response cannot be empty.");
        return;
      }

      // Save the new response for other fields
      saveResponse(fieldId, newValue);

      messageToEdit.innerHTML = `
        <span>${newValue}</span>
        <i class="fa-solid fa-pencil edit-icon" data-field-id="${fieldId}" style="cursor: pointer; margin-left: 10px;"></i>
      `;

      const newEditIcon = messageToEdit.querySelector(".edit-icon");
      newEditIcon.addEventListener("click", () =>
        editResponse(fieldId, newValue)
      );

      if (sendButton) sendButton.disabled = false;

      isEditing = false;
    }
  });

  // Email validation function
  function isValidEmail(email) {
    // Simple email regex pattern for validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }
}
