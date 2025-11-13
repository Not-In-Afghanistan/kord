const db = firebase.database();

// List of banned words (expand as needed)
const bannedWords = ["cum", "swear2", "swear3"]; // replace with actual words

// Function to check if a string contains any banned word
function containsBadWord(str) {
  const lowerStr = str.toLowerCase();
  return bannedWords.some(word => lowerStr.includes(word));
}

document.getElementById("signup").addEventListener("submit", function(e) {
  e.preventDefault();

  const displayName = document.getElementById("displayName").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");
  const success = document.getElementById("success");

  // Hide previous messages
  error.style.display = "none";
  success.style.display = "none";

  // Check for swear words
  if (containsBadWord(displayName) || containsBadWord(username)) {
    error.textContent = "Please avoid using offensive words in Display Name or Username.";
    error.style.display = "block";
    return;
  }

  // Password length check
  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters.";
    error.style.display = "block";
    return;
  }

  // Check if username already exists
  db.ref("users/" + username).get().then(snapshot => {
    if (snapshot.exists()) {
      error.textContent = "Username already exists!";
      error.style.display = "block";
    } else {
      // Create new user
      db.ref("users/" + username).set({
        displayName: displayName,
        password: password,
        createdAt: new Date().toISOString()
      }).then(() => {
        success.textContent = "Account created! Redirecting to login...";
        success.style.display = "block";

        // Redirect to login.html after 2 seconds
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      }).catch(err => {
        console.error(err);
        error.textContent = "Error creating account. Try again.";
        error.style.display = "block";
      });
    }
  }).catch(err => {
    console.error(err);
    error.textContent = "Error checking username. Try again.";
    error.style.display = "block";
  });
});
