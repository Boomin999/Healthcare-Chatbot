const themeBtn = document.getElementById("themeToggle");
const clearChatBtn = document.getElementById("clearChat");
const sendButton = document.getElementById("sendButton");
const inputBox = document.getElementById("inputBox");
const chatbox = document.getElementById("chatbox");
const categoryButtons = document.querySelectorAll(".categoryCard");
const botAvatarUrl = "https://cdn-icons-png.flaticon.com/512/3209/3209993.png";

if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
    themeBtn.textContent = "Sun";
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDarkMode = document.body.classList.contains("dark");

    themeBtn.textContent = isDarkMode ? "Sun" : "Moon";
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
});

function saveMessage(role, text) {
    const history = JSON.parse(localStorage.getItem("chatHistory")) || [];
    history.push({ role, text });
    localStorage.setItem("chatHistory", JSON.stringify(history));
}

function addUserMessage(text, shouldSave = true) {
    chatbox.innerHTML += `<div class="bubble user-bubble">${text}</div>`;
    chatbox.scrollTop = chatbox.scrollHeight;

    if (shouldSave) {
        saveMessage("user", text);
    }
}

function typeBotMessage(fullText, shouldSave = true, instant = false) {
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
    const history = JSON.parse(localStorage.getItem("chatHistory"));
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
    localStorage.removeItem("chatHistory");
    chatbox.innerHTML = "";
    showWelcomeMessage();
}

function addLoadingDots() {
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
        showWelcomeMessage();
    }
});
