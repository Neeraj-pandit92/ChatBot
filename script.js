const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// Auth elements
const signupForm = document.querySelector("#signup-form");
const loginForm = document.querySelector("#login-form");
const showLoginLink = document.querySelector("#show-login");
const showSignupLink = document.querySelector("#show-signup");
const authContainer = document.querySelector(".auth-container");
const chatWrapper = document.querySelector(".chat-container");

// Navbar elements
const logoutButton = document.querySelector("#logout-button");
const chatHistoryButton = document.querySelector("#chat-history");
const userNameDisplay = document.querySelector("#user-name");

let userMessage = null;
let isResponseGenerating = false;

const API_KEY = "AIzaSyB4Lpli00Izis-wy9wcqEa9ZYq8RWxatL8";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

/* ---------------------------
   Load Data & Theme
---------------------------- */
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  if (savedChats) {
    chatContainer.innerHTML = savedChats;
    document.body.classList.add("hide-header");
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }

  // Load user info if logged in
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    userNameDisplay.innerText = `${user.username} (${user.email})`;
  }
};

/* ---------------------------
   Chat message helpers
---------------------------- */
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }, 75);
};

const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponse = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="images/gemini.svg" alt="Gemini avatar">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);

  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyButton) => {
  const messageText =
    copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => (copyButton.innerText = "content_copy"), 1000);
};

const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `<div class="message-content">
                  <img class="avatar" src="images/user.png" alt="User avatar">
                  <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);

  typingForm.reset();
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showLoadingAnimation, 500);
};

/* ---------------------------
   Theme & Delete
---------------------------- */
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    chatContainer.innerHTML = "";
    document.body.classList.remove("hide-header");
    alert("All chats cleared!");
  }
});

/* ---------------------------
   Suggestions & Form
---------------------------- */
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

/* ---------------------------
   Sign In / Sign Up Functionality
---------------------------- */
showLoginLink.addEventListener("click", () => {
  signupForm.style.display = "none";
  loginForm.style.display = "flex";
});

showSignupLink.addEventListener("click", () => {
  loginForm.style.display = "none";
  signupForm.style.display = "flex";
});

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.querySelector("#signup-username").value;
  const email = document.querySelector("#signup-email").value;
  const password = document.querySelector("#signup-password").value;

  localStorage.setItem("user", JSON.stringify({ username, email, password }));
  alert("Sign Up Successful! Please Sign In.");
  signupForm.style.display = "none";
  loginForm.style.display = "flex";
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.querySelector("#login-email").value;
  const password = document.querySelector("#login-password").value;

  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (storedUser && storedUser.email === email && storedUser.password === password) {
    localStorage.setItem("loggedIn", "true"); // ✅ Persist session
    authContainer.style.display = "none";
    chatWrapper.style.display = "block";
    loadDataFromLocalstorage();
  } else {
    alert("Invalid email or password!");
  }
});

/* ---------------------------
   Navbar Functionality
---------------------------- */
logoutButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("loggedIn"); 
    authContainer.style.display = "flex";
    chatWrapper.style.display = "none";
    alert("You have been logged out!");
  }
});

chatHistoryButton.addEventListener("click", () => {
  const savedChats = localStorage.getItem("saved-chats");
  if (savedChats) {
    alert("✅ Chat history loaded!");
    chatContainer.innerHTML = savedChats;
  } else {
    alert("No chat history found!");
  }
});

/* ---------------------------
   Initialize
---------------------------- */
chatWrapper.style.display = "none";

// ✅ Persist login session
const loggedIn = localStorage.getItem("loggedIn");
if (loggedIn === "true") {
  authContainer.style.display = "none";
  chatWrapper.style.display = "block";
  loadDataFromLocalstorage();
} else {
  authContainer.style.display = "flex";
  chatWrapper.style.display = "none";
}
