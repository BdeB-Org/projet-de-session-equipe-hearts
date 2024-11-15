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

  showBotMessage(questions[currentQuestion].prompt);

  const sendButton = document.querySelector(".send-button");
  const userInput = document.getElementById("userInput");

  sendButton.addEventListener("click", handleResponse);
  userInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleResponse();
    }
  });

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "dateInput";
  dateInput.style.display = "none";
  document
    .querySelector(".input-container")
    .insertBefore(dateInput, sendButton);

  dateInput.addEventListener("change", () => {
    showUserResponse(dateInput.value, "birthdate");
    saveResponse("birthdate", dateInput.value);
    dateInput.style.display = "none";
    userInput.style.display = "";
    currentQuestion++;
    showNextQuestion();
  });

  function handleResponse() {
    const userInputValue = userInput.value.trim();

    if (isEditing) {
      handleEditResponse();
      return;
    }

    // Email validation
    if (
      questions[currentQuestion].id === "email" &&
      !isValidEmail(userInputValue)
    ) {
      alert("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    // Password match validation
    if (questions[currentQuestion].id === "verify-password") {
      const password = document.getElementById("password").value;
      if (userInputValue && password && userInputValue !== password) {
        alert("Les mots de passe ne correspondent pas. Veuillez réessayer.");
        return;
      }
    }

    if (!userInputValue) return;

    // Display logic (e.g., masking passwords)
    const displayValue =
      questions[currentQuestion].id === "password" ||
      questions[currentQuestion].id === "verify-password"
        ? "*".repeat(userInputValue.length)
        : userInputValue;

    showUserResponse(displayValue, questions[currentQuestion].id);
    saveResponse(questions[currentQuestion].id, userInputValue);

    userInput.value = "";

    if (questions[currentQuestion].id === "verify-password") {
      userInput.type = "text"; // Reset input type after verifying passwords
    }

    // Always remove phone formatting when switching questions
    removePhoneNumberFormatting();

    if (!isEditing && currentQuestion < questions.length - 1) {
      currentQuestion++;
      showNextQuestion();
    } else if (currentQuestion === questions.length - 1) {
      submitForm();
    }
  }

  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  function showNextQuestion() {
    // Remove blinking line from the last bot message
    const lastBlinkingLine = document.querySelector(".blinking-line");
    if (lastBlinkingLine) {
      lastBlinkingLine.classList.remove("blinking-line");
    }

    const nextQuestion = questions[currentQuestion];

    // Set input type and behavior based on the question
    if (
      nextQuestion.id === "password" ||
      nextQuestion.id === "verify-password"
    ) {
      userInput.type = "password";
    } else if (nextQuestion.id === "phone") {
      userInput.type = "text";
      userInput.placeholder = "XXX-XXX-XXXX";
      userInput.addEventListener("input", formatPhoneNumber); // Reapply phone number formatting
    } else {
      userInput.type = "text";
      userInput.placeholder = "";
      removePhoneNumberFormatting(); // Remove formatting for non-phone fields
    }

    if (nextQuestion.id === "birthdate") {
      userInput.style.display = "none";
      dateInput.style.display = "";
      sendButton.style.display = "none";
      showBotMessage(nextQuestion.prompt);
    } else {
      userInput.style.display = "";
      sendButton.style.display = "";
      showBotMessage(nextQuestion.prompt);
    }
  }

  function formatPhoneNumber(event) {
    const input = event.target;
    let inputValue = input.value.replace(/\D/g, "");
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
  }

  function showBotMessage(message) {
    const botMessageDiv = document.createElement("div");
    botMessageDiv.className = "message bot-message";
    botMessageDiv.innerHTML = `<span class="typing-effect">${message}<span class="blinking-line"></span></span>`;
    const chatContainer = document.querySelector(".chat-container");
    const inputContainer = document.querySelector(".input-container");
    chatContainer.insertBefore(botMessageDiv, inputContainer);
    scrollToBottom();
  }

  function showUserResponse(response, fieldId) {
    let displayValue =
      fieldId === "password" || fieldId === "verify-password"
        ? "*".repeat(response.length)
        : response;

    let existingMessageDiv = document.querySelector(
      `.user-message[data-field-id="${fieldId}"]`
    );

    if (existingMessageDiv) {
      existingMessageDiv.querySelector("span").textContent = displayValue;
    } else {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message user-message";
      messageDiv.setAttribute("data-field-id", fieldId);

      messageDiv.innerHTML = `
        <span>${displayValue}</span>
        <i class="fa-solid fa-pencil edit-icon" data-field-id="${fieldId}" style="cursor: pointer; margin-left: 10px;"></i>
      `;
      const chatContainer = document.querySelector(".chat-container");
      const inputContainer = document.querySelector(".input-container");
      chatContainer.insertBefore(messageDiv, inputContainer);

      const editIcon = messageDiv.querySelector(".edit-icon");
      editIcon.addEventListener("click", () => editResponse(fieldId, response));
    }

    scrollToBottom();
  }

  function saveResponse(fieldId, response) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = response;
    }
  }

  function submitForm() {
    document.getElementById("myForm").submit();
  }

  function scrollToBottom() {
    const chatContainer = document.querySelector(".chat-container");
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function editResponse(fieldId, currentResponse) {
    if (isEditing) return;

    isEditing = true;
    editingFieldId = fieldId;

    userInput.value = currentResponse;
    userInput.type =
      fieldId === "password" || fieldId === "verify-password"
        ? "password"
        : "text";

    // Reapply phone formatting if editing phone field
    if (fieldId === "phone") {
      userInput.addEventListener("input", formatPhoneNumber);
      userInput.placeholder = "XXX-XXX-XXXX";
    } else {
      removePhoneNumberFormatting();
      userInput.placeholder = "";
    }

    sendButton.removeEventListener("click", handleResponse);
    userInput.removeEventListener("keypress", handleEnterKey);

    sendButton.addEventListener("click", handleEditResponse);
    userInput.addEventListener("keypress", handleEditEnterKey);

    function handleEditResponse() {
      const newResponse = userInput.value.trim();

      if (fieldId === "email" && !isValidEmail(newResponse)) {
        alert("Veuillez entrer une adresse e-mail valide.");
        return;
      } else if (fieldId === "verify-password") {
        const password = document.getElementById("password").value;
        if (newResponse !== password) {
          alert("Les mots de passe ne correspondent pas.");
          return;
        }
      } else if (
        fieldId === "phone" &&
        !/^\d{3}-\d{3}-\d{4}$/.test(newResponse)
      ) {
        alert("Veuillez entrer un numéro de téléphone valide (XXX-XXX-XXXX).");
        return;
      }

      const messageDivToUpdate = document.querySelector(
        `.user-message[data-field-id="${fieldId}"]`
      );
      if (messageDivToUpdate) {
        messageDivToUpdate.querySelector("span").textContent =
          fieldId === "password" || fieldId === "verify-password"
            ? "*".repeat(newResponse.length)
            : newResponse;
      }

      saveResponse(fieldId, newResponse);

      userInput.value = "";
      userInput.type = "text";

      sendButton.removeEventListener("click", handleEditResponse);
      userInput.removeEventListener("keypress", handleEditEnterKey);

      sendButton.addEventListener("click", handleResponse);
      userInput.addEventListener("keypress", handleEnterKey);

      isEditing = false;
      editingFieldId = null;
    }

    function handleEditEnterKey(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        handleEditResponse();
      }
    }
  }

  function handleEnterKey(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleResponse();
    }
  }

  function removePhoneNumberFormatting() {
    userInput.removeEventListener("input", formatPhoneNumber);
  }

  userInput.addEventListener("keypress", handleEnterKey);
});
