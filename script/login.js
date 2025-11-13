// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBGPFSP0e0oYqKqvJHLB5eGlX9mJ8aU09s",
  authDomain: "test-da143.firebaseapp.com",
  databaseURL: "https://test-da143-default-rtdb.firebaseio.com",
  projectId: "test-da143",
  storageBucket: "test-da143.appspot.com",
  messagingSenderId: "58366480447",
  appId: "1:58366480447:web:f3dd12850f09952b49688a",
  measurementId: "G-T5HK7JTWHW"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === MANUAL ROLE LIST ===
// Add usernames and their roles here
const roles = {
  "muzafar": "admin",
  "helperkid": "helper"
  // Add more like: "username": "role"
};

document.getElementById("login").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");
  error.style.display = "none";

  try {
    const snapshot = await db.ref("users/" + username).get();

    if (!snapshot.exists()) {
      error.textContent = "Invalid username or password.";
      error.style.display = "block";
      return;
    }

    const userData = snapshot.val();

    if (userData.password !== password) {
      error.textContent = "Invalid username or password.";
      error.style.display = "block";
      return;
    }

    // === ROLE LOGIC ===
    let userRole = "user"; // default role
    if (roles[username]) {
      userRole = roles[username];
    }

    // Store info locally
    localStorage.setItem("currentUser", username);
    localStorage.setItem("displayName", userData.displayName);
    localStorage.setItem("role", userRole);  // NOW SAVING ROLE

    console.log(`Logged in as ${username} with role: ${userRole}`);

    window.location.href = "./dash.html";

  } catch (err) {
    console.error("Firebase login error:", err);
    error.textContent = "Error connecting to database. Please try again.";
    error.style.display = "block";
  }
});
