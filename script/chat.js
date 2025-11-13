// === Firebase Setup ===
const db = firebase.database();

// === Get current user ===
const username = localStorage.getItem("currentUser");
if (!username) {
  window.location.href = "login.html";
}

// === Display Name ===
db.ref("users/" + username + "/displayName").once("value")
  .then(snapshot => {
    const name = snapshot.val() || username;
    document.getElementById("displayName").textContent = name;
  })
  .catch(err => {
    console.error("Error loading display name:", err);
    document.getElementById("displayName").textContent = username;
  });

// === Cuss Word Filter ===
const badWords = [
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy",
  "cock", "faggot", "slut", "whore", "nigger", "nigga", "cunt", "twat",
  "retard", "cum", "penis", "vagina", "boob", "sex", "rape"
];
function hasBadWord(text) {
  return badWords.some(w => text.toLowerCase().includes(w));
}

// === Elements ===
const serverList = document.getElementById("server-list");
const addServerBtn = document.getElementById("add-server-btn");
const joinServerBtn = document.getElementById("join-server-btn");
const main = document.getElementById("main");
const messagesDiv = document.getElementById("messages");

// === Load Servers ===
function loadServers() {
  db.ref("users/" + username + "/servers").on("value", snapshot => {
    serverList.innerHTML = "";
    if (!snapshot.exists()) {
      const li = document.createElement("li");
      li.textContent = "No servers joined yet.";
      li.classList.add("empty-text");
      serverList.appendChild(li);
      return;
    }

    snapshot.forEach(serverSnap => {
      const name = serverSnap.key;
      db.ref("servers/" + name).once("value").then(serverDataSnap => {
        const data = serverDataSnap.val();
        if (!data) return;
        const li = document.createElement("li");
        li.innerHTML = `
          <img src="${data.img || './images/default-server.png'}" class="server-icon">
          <span>${name}</span>
          ${data.owner === username ? `<button class="delete-btn" onclick="deleteServer('${name}')">Delete</button>` : ""}
        `;
        li.onclick = () => openServer(name);
        serverList.appendChild(li);
      });
    });
  });
}

// === Add Server Modal ===
const serverModal = document.getElementById("server-modal");
const joinModal = document.getElementById("join-modal");
const closeBtns = document.querySelectorAll(".close");

addServerBtn.onclick = () => serverModal.style.display = "block";
joinServerBtn.onclick = () => joinModal.style.display = "block";
closeBtns.forEach(btn => btn.onclick = () => {
  serverModal.style.display = "none";
  joinModal.style.display = "none";
});

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
      db.ref("servers/" + name).set({
        owner: username,
        password,
        img: imgData
      }).then(() => {
        db.ref("users/" + username + "/servers/" + name).set(true);
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
    db.ref("users/" + username + "/servers/" + name).set(true);
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
    if (data.owner !== username) return alert("Only the owner can delete!");
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

// === Open Server Chat ===
function openServer(name) {
  main.innerHTML = `
    <div class="chat-header"><h2>${name}</h2></div>
    <div id="messages"></div>
    <form id="chat-form">
      <input type="text" id="chat-input" placeholder="Type a message..." required />
      <button type="submit">Send</button>
    </form>
  `;
  const messagesDiv = document.getElementById("messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  db.ref("messages/" + name).on("value", snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(msgSnap => {
      const msg = msgSnap.val();
      const div = document.createElement("div");
      div.className = "message";
      div.innerHTML = `<b>${msg.user}:</b> ${msg.text}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  chatForm.onsubmit = e => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    if (hasBadWord(text)) return alert("Inappropriate language!");
    db.ref("messages/" + name).push({
      user: username,
      text
    });
    chatInput.value = "";
  };
}

// === Init ===
window.onload = () => {
  loadServers();
};
