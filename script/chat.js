// === Manual Roles Setup ===
const roles = {
  "test3": "premium",
  "helperkid": "helper"
  // Add more like: "username": "role"
};

// === Get Current User ===
const currentUser = localStorage.getItem("currentUser");
if (!currentUser) window.location.href = "login.html";

// Display name fallback
const displayName = localStorage.getItem("displayName") || currentUser;

// Role for current user
const currentRole = roles[currentUser] || "user";

// === Firebase Setup ===
const db = firebase.database();

// === DOM Elements ===
const main = document.getElementById("main");
const displayNameEl = document.getElementById("displayName");
const addServerBtn = document.getElementById("add-server-btn");
const joinServerBtn = document.getElementById("join-server-btn");
const serverModal = document.getElementById("server-modal");
const joinModal = document.getElementById("join-modal");
const closeBtns = document.querySelectorAll(".modal .close");

// === Banned Words Filter ===
const bannedWords = [
  "fuck","shit","bitch","asshole","cunt","nigger","faggot","dick","cock","pussy",
  "slut","whore","bastard","penis","vagina","sex","rape","cum","boob"
];
function hasBadWord(str) {
  return bannedWords.some(word => str.toLowerCase().includes(word));
}

// === Display current user's name ===
if (displayNameEl) displayNameEl.textContent = displayName;

// === Enable/disable Add Server button based on role ===
if (addServerBtn) {
  if (currentRole === "premium" || currentRole === "admin") {
    addServerBtn.disabled = false;
    addServerBtn.style.opacity = 1;
    addServerBtn.title = "";
  } else {
    addServerBtn.disabled = true;
    addServerBtn.style.opacity = 0.6;
    addServerBtn.title = "Premium only: Upgrade to add servers";
  }

  addServerBtn.onclick = () => {
    if (currentRole === "premium" || currentRole === "admin") openServerModal();
  };
}

// === Join Server button ===
if (joinServerBtn) joinServerBtn.onclick = () => joinModal.style.display = "block";

// === Close modal buttons ===
closeBtns.forEach(btn => {
  btn.onclick = () => btn.closest(".modal").style.display = "none";
});
window.onclick = e => {
  document.querySelectorAll(".modal").forEach(modal => {
    if (e.target === modal) modal.style.display = "none";
  });
};

// === Load servers dynamically ===
function loadServers() {
  const serverList = document.getElementById("server-list");
  serverList.innerHTML = "";
  db.ref("servers").on("value", snapshot => {
    const servers = snapshot.val() || {};
    for (let name in servers) {
      const li = document.createElement("li");
      li.textContent = name;
      li.onclick = () => openServer(name);
      serverList.appendChild(li);
    }
  });
}

// === Load friends dynamically ===
function loadFriends() {
  const friendList = document.getElementById("friend-list");
  friendList.innerHTML = "";
  db.ref("users").on("value", snapshot => {
    const users = snapshot.val() || {};
    for (let username in users) {
      if (username === currentUser) continue;
      const li = document.createElement("li");
      li.textContent = users[username].displayName || username;
      friendList.appendChild(li);
    }
  });
}

// === Open Server Chat ===
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

  // Live messages
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

  // Send message
  sendBtn.onclick = () => {
    const text = msgInput.value.trim();
    if (!text) return;
    if (hasBadWord(text)) return alert("Message contains inappropriate language!");
    db.ref("messages/" + name).push({ user: currentUser, text });
    msgInput.value = "";
  };
}

// === Add Server Modal ===
function openServerModal() { serverModal.style.display = "block"; }
function openJoinModal() { joinModal.style.display = "block"; }

// === Create Server ===
document.getElementById("create-server").onclick = () => {
  const name = document.getElementById("server-name").value.trim();
  const password = document.getElementById("server-password").value.trim();
  const file = document.getElementById("server-image").files[0];
  if (!name || !password || !file) return alert("Please fill all fields.");
  if (hasBadWord(name)) return alert("Inappropriate server name!");

  const reader = new FileReader();
  reader.onload = () => {
    const imgData = reader.result;
    db.ref("servers/" + name).once("value").then(snap => {
      if (snap.exists()) return alert("Server already exists!");
      db.ref("servers/" + name).set({ owner: currentUser, password, img: imgData })
        .then(() => {
          db.ref("users/" + currentUser + "/servers/" + name).set(true);
          alert("Server created!");
          serverModal.style.display = "none";
        });
    });
  };
  reader.readAsDataURL(file);
};

// === Join Server ===
document.getElementById("join-server-confirm").onclick = () => {
  const name = document.getElementById("join-server-name").value.trim();
  const password = document.getElementById("join-server-password").value.trim();
  if (!name || !password) return alert("Enter both fields.");

  db.ref("servers/" + name).once("value").then(snap => {
    if (!snap.exists()) return alert("Server not found!");
    const data = snap.val();
    if (data.password !== password) return alert("Wrong password!");
    db.ref("users/" + currentUser + "/servers/" + name).set(true);
    alert("Joined server!");
    joinModal.style.display = "none";
  });
};

// === Delete Server ===
function deleteServer(name) {
  if (!confirm(`Delete "${name}"?`)) return;
  db.ref("servers/" + name).once("value").then(snap => {
    if (!snap.exists()) return alert("Server not found!");
    const data = snap.val();
    if (data.owner !== currentUser) return alert("Only the owner can delete!");
    db.ref("servers/" + name).remove().then(() => {
      db.ref("users").once("value").then(usersSnap => {
        usersSnap.forEach(userSnap => {
          db.ref(`users/${userSnap.key}/servers/${name}`).remove();
        });
      });
      alert("Server deleted!");
    });
  });
}

// === Init Dashboard ===
window.onload = () => {
  loadServers();
  loadFriends();
  main.innerHTML = `
    <div class="no-chat">
      <h2>Welcome to KORD 👋</h2>
      <p>Join a server or add a friend to start chatting!</p>
    </div>
  `;
};
