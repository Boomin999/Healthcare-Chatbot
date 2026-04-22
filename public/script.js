const themeBtn = document.getElementById("themeToggle");
const clearChatBtn = document.getElementById("clearChat");
const sendButton = document.getElementById("sendButton");
const inputBox = document.getElementById("inputBox");
const chatbox = document.getElementById("chatbox");
const categoryButtons = document.querySelectorAll(".categoryCard");
const landingPage = document.getElementById("landingPage");
const botAvatarUrl = "https://cdn-icons-png.flaticon.com/512/3209/3209993.png";
const chatStorage = window.sessionStorage;

function applyTheme(mode) {
    const isDarkMode = mode === "enabled";
    document.body.classList.toggle("dark", isDarkMode);
    themeBtn.querySelector(".icon-text").textContent = isDarkMode ? "Sun" : "Moon";
}

applyTheme(localStorage.getItem("darkMode"));

themeBtn.addEventListener("click", () => {
    const nextMode = document.body.classList.contains("dark") ? "disabled" : "enabled";
    localStorage.setItem("darkMode", nextMode);
    applyTheme(nextMode);
});

function saveMessage(role, text) {
    const history = JSON.parse(chatStorage.getItem("chatHistory")) || [];
    history.push({ role, text });
    chatStorage.setItem("chatHistory", JSON.stringify(history));
}

function showChatView() {
    landingPage.classList.remove("active");
    landingPage.hidden = true;
}

function showLandingView() {
    landingPage.hidden = false;
    landingPage.classList.add("active");
}

function createBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${role === "user" ? "user-bubble" : "bot-bubble"}`;

    if (role === "bot") {
        bubble.innerHTML = `
            <img src="${botAvatarUrl}" class="avatar" alt="Assistant avatar">
            <div class="typingArea"></div>
        `;
        bubble.querySelector(".typingArea").textContent = text;
    } else {
        bubble.textContent = text;
    }

    return bubble;
}

function addUserMessage(text, shouldSave = true) {
    showChatView();
    chatbox.appendChild(createBubble("user", text));
    chatbox.scrollTop = chatbox.scrollHeight;

    if (shouldSave) {
        saveMessage("user", text);
    }
}

function typeBotMessage(fullText, shouldSave = true, instant = false) {
    showChatView();

    const container = document.createElement("div");
    container.className = "bubble bot-bubble";
    container.innerHTML = `
        <img src="${botAvatarUrl}" class="avatar" alt="Assistant avatar">
        <div class="typingArea"></div>
    `;

    chatbox.appendChild(container);
    const textBox = container.querySelector(".typingArea");
    chatbox.scrollTop = chatbox.scrollHeight;

    if (instant) {
        textBox.textContent = fullText;
    } else {
        let index = 0;

        function type() {
            if (index < fullText.length) {
                textBox.textContent += fullText.charAt(index);
                index += 1;
                chatbox.scrollTop = chatbox.scrollHeight;
                setTimeout(type, 15);
            }
        }

        type();
    }

    if (shouldSave) {
        saveMessage("bot", fullText);
    }
}

function loadHistory() {
    const history = JSON.parse(chatStorage.getItem("chatHistory"));
    if (!history || history.length === 0) {
        return false;
    }

    history.forEach((message) => {
        if (message.role === "user") {
            addUserMessage(message.text, false);
        } else {
            typeBotMessage(message.text, false, true);
        }
    });

    return true;
}

function showWelcomeMessage() {
    const welcome =
        "Hello! I am your Healthcare Assistant.\n" +
        "Ask me about symptoms, sleep, stress, nutrition, hydration, or general wellness.\n" +
        "How can I help you today?";

    typeBotMessage(welcome, false);
}

function clearHistory() {
    chatStorage.removeItem("chatHistory");
    chatbox.innerHTML = "";
    showLandingView();
}

function addLoadingDots() {
    showChatView();

    const bubble = document.createElement("div");
    bubble.className = "bubble bot-bubble";
    bubble.id = "loadingBubble";
    bubble.innerHTML = `
        <img src="${botAvatarUrl}" class="avatar" alt="Assistant avatar">
        <div class="typingDots">
            <span></span><span></span><span></span>
        </div>
    `;

    chatbox.appendChild(bubble);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function send() {
    const text = inputBox.value.trim();
    if (!text) {
        return;
    }

    addUserMessage(text);
    inputBox.value = "";
    addLoadingDots();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        document.getElementById("loadingBubble")?.remove();

        if (!response.ok) {
            typeBotMessage(data.reply || "Something went wrong.");
            return;
        }

        typeBotMessage(data.reply);
    } catch (error) {
        document.getElementById("loadingBubble")?.remove();
        typeBotMessage("Failed to connect to the server.");
    }
}

clearChatBtn.addEventListener("click", clearHistory);
sendButton.addEventListener("click", send);
inputBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        send();
    }
});

categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        inputBox.value = button.dataset.question;
        send();
    });
});

window.addEventListener("load", () => {
    const hasHistory = loadHistory();
    if (!hasHistory) {
        showLandingView();
    }
});
