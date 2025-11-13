// chatBars.js
const currentUser = localStorage.getItem("currentUser"); // instead of "username"
const currentRole = localStorage.getItem("role") || "user";

// === Open Server ===
function openServer(name) {
  main.innerHTML = `
    <div class="server-chat">
      <h2>${name}</h2>
      <div id="messages" class="messages"></div>
      <div class="input-area">
        <input type="text" id="msgInput" placeholder="Type a message...">
        <button id="sendMsgBtn">Send</button>
      </div>
    </div>
  `;

  const messagesDiv = document.getElementById("messages");
  const msgInput = document.getElementById("msgInput");
  const sendBtn = document.getElementById("sendMsgBtn");

  // Load messages live
  db.ref("messages/" + name).on("value", snapshot => {
    messagesDiv.innerHTML = "";
    if (!snapshot.exists()) {
      messagesDiv.innerHTML = `<p class="empty-text">No messages yet. Say hi!</p>`;
      return;
    }

    snapshot.forEach(msgSnap => {
      const msg = msgSnap.val();
      const msgEl = document.createElement("div");
      msgEl.className = "message";
      msgEl.innerHTML = `<b>${msg.user}:</b> ${msg.text}`;
      messagesDiv.appendChild(msgEl);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  sendBtn.onclick = () => {
    const text = msgInput.value.trim();
    if (!text) return;
    if (hasBadWord(text)) return alert("Message contains inappropriate language!");
    db.ref("messages/" + name).push({
      user: username,
      text
    });
    msgInput.value = "";
  };
}

// === Default State (No Server Selected) ===
window.onload = () => {
  if (!username) {
    window.location.href = "login.html";
    return;
  }

  loadServers();

  // Show a message when no chat is open
  main.innerHTML = `
    <div class="no-chat">
      <h2>Welcome to KORD 👋</h2>
      <p>Join a server or add a friend to start chatting!</p>
    </div>
  `;
};
