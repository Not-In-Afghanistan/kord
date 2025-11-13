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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.getElementById("login").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  // hide previous error
  error.style.display = "none";

  // Check user in database
  db.ref("users/" + username).get().then((snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.password === password) {
        // ✅ Login success
        localStorage.setItem("currentUser", username);
        localStorage.setItem("displayName", userData.displayName);

        // Optional: slight delay to show feedback
        setTimeout(() => {
          window.location.href = "dash.html";
        }, 300);
      } else {
        error.textContent = "Invalid username or password.";
        error.style.display = "block";
      }
    } else {
      error.textContent = "Invalid username or password.";
      error.style.display = "block";
    }
  }).catch((err) => {
    console.error(err);
    error.textContent = "Error connecting to database. Try again.";
    error.style.display = "block";
  });
});
