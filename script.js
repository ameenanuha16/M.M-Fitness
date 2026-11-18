import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

/* =========================================
   1. FIREBASE CONFIGURATION
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBN3hQPjhhX3my8aWmOgR-cLg-uecehgkA",
  authDomain: "mm-fitness-450a1.firebaseapp.com",
  projectId: "mm-fitness-450a1",
  storageBucket: "mm-fitness-450a1.firebasestorage.app",
  messagingSenderId: "504073195369",
  appId: "1:504073195369:web:40f51c9a571d14c8b9f7f8",
  measurementId: "G-BSVSWXWFFE"
};

// Initialize Firebase ONCE
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let currentUser = null;
let isSignup = false;
let waterCount = 0;

const $ = id => document.getElementById(id);

/* =========================================
   2. GENERAL FUNCTIONS
========================================= */

function showMessage(id, message) {
  const element = $(id);
  if (element) element.textContent = message;
}

function showScreen(screen) {
  $("loader").classList.add("hidden");
  $("authScreen").classList.toggle("hidden", screen !== "auth");
  $("app").classList.toggle("hidden", screen !== "app");
}

function safeDateKey() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function userDocument() {
  return doc(db, "users", currentUser.uid);
}

function dailyDocument() {
  return doc(db, "users", currentUser.uid, "daily", safeDateKey());
}

function friendlyError(error) {
  const messages = {
    "auth/email-already-in-use": "This email already has an account. Please sign in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-credential": "Your email or password is incorrect.",
    "auth/user-not-found": "No account found. Please create an account.",
    "auth/wrong-password": "Incorrect password.",
    "auth/network-request-failed": "Check your internet connection.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/operation-not-allowed": "Enable Email/Password sign-in in Firebase Authentication.",
    "permission-denied": "Firebase Firestore permissions need to be checked."
  };

  return messages[error.code] || error.message || "Something went wrong.";
}

/* =========================================
   3. LOGIN AND SIGNUP
========================================= */

function setAuthMode(signup) {
  isSignup = signup;

  $("authTitle").textContent = signup
    ? "Create Your Account."
    : "Welcome Back.";

  $("authSubtitle").textContent = signup
    ? "Start building your fitness journey."
    : "Sign in to continue your journey.";

  $("authSubmit").textContent = signup
    ? "CREATE ACCOUNT"
    : "SIGN IN";

  $("nameGroup").classList.toggle("hidden", !signup);

  $("switchText").textContent = signup
    ? "Already have an account?"
    : "New to M.M FITNESS?";

  $("switchAuth").textContent = signup
    ? "Sign in"
    : "Create account";

  showMessage("authMessage", "");
}

$("switchAuth").addEventListener("click", () => {
  setAuthMode(!isSignup);
});

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;
  const name = $("fullName").value.trim();

  if (isSignup && !name) {
    showMessage("authMessage", "Please enter your full name.");
    return;
  }

  $("authSubmit").disabled = true;
  $("authSubmit").textContent = "PLEASE WAIT...";

  showMessage("authMessage", "");

  try {
    if (isSignup) {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, {
        displayName: name
      });

      await setDoc(doc(db, "users", result.user.uid), {
        name: name,
        email: email,
        createdAt: serverTimestamp()
      }, { merge: true });

    } else {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    }

  } catch (error) {
    console.error("Authentication error:", error);
    showMessage("authMessage", friendlyError(error));

  } finally {
    $("authSubmit").disabled = false;

    $("authSubmit").textContent = isSignup
      ? "CREATE ACCOUNT"
      : "SIGN IN";
  }
});

/* =========================================
   4. NAVIGATION
========================================= */

const pageNames = {
  dashboard: "Overview",
  profile: "My Profile",
  workouts: "Workouts",
  nutrition: "Nutrition",
  progress: "Progress",
  women: "Women's Wellness",
  assistant: "AI Fitness Assistant"
};

function openPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === `page-${page}`
    );
  });

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  $("pageHeading").textContent =
    pageNames[page] || "Overview";
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

/* =========================================
   5. PROFILE AND DASHBOARD
========================================= */

async function loadProfile() {
  if (!currentUser) return;

  try {
    const snapshot = await getDoc(userDocument());

    const data = snapshot.exists()
      ? snapshot.data()
      : {};

    $("profileName").value =
      data.name || currentUser.displayName || "";

    $("profileAge").value = data.age || "";
    $("profileHeight").value = data.height || "";
    $("profileWeight").value = data.weight || "";
    $("profileGender").value = data.gender || "";
    $("profileGoal").value = data.goal || "";
    $("profileLevel").value = data.level || "beginner";
    $("profileDiet").value = data.diet || "vegetarian";

    updateDashboard(data);

  } catch (error) {
    console.error("Profile loading error:", error);
  }
}

$("profileForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) return;

  const profile = {
    name: $("profileName").value.trim(),
    age: Number($("profileAge").value),
    height: Number($("profileHeight").value),
    weight: Number($("profileWeight").value),
    gender: $("profileGender").value,
    goal: $("profileGoal").value,
    level: $("profileLevel").value,
    diet: $("profileDiet").value,
    updatedAt: serverTimestamp()
  };

  if (
    !profile.name ||
    !profile.height ||
    !profile.weight
  ) {
    showMessage(
      "profileMessage",
      "Please enter your name, height and weight."
    );
    return;
  }

  try {
    await setDoc(userDocument(), profile, { merge: true });

    if (currentUser.displayName !== profile.name) {
      await updateProfile(currentUser, {
        displayName: profile.name
      });
    }

    updateDashboard(profile);

    showMessage(
      "profileMessage",
      "Your profile has been saved successfully!"
    );

  } catch (error) {
    console.error("Profile save error:", error);
    showMessage("profileMessage", friendlyError(error));
  }
});

function updateDashboard(data) {
  const name =
    data.name ||
    currentUser?.displayName ||
    "Athlete";

  $("welcomeName").textContent = name.split(" ")[0];

  $("userInitials").textContent =
    name.slice(0, 2).toUpperCase();

  const height = Number(data.height);
  const weight = Number(data.weight);

  if (height > 0 && weight > 0) {
    const bmi = weight / ((height / 100) ** 2);

    $("bmiValue").textContent = bmi.toFixed(1);

    let status = "BMI screening estimate";

    if (bmi < 18.5) {
      status = "Below standard adult range";
    } else if (bmi < 25) {
      status = "Within standard adult range";
    } else if (bmi < 30) {
      status = "Above standard adult range";
    } else {
      status = "Higher adult BMI range";
    }

    $("bmiStatus").textContent = status;

  } else {
    $("bmiValue").textContent = "—";
    $("bmiStatus").textContent = "Add details in Profile";
  }
}

/* =========================================
   6. WORKOUT LIBRARY
========================================= */

const exercises = [
  {
    name: "Bodyweight Squats",
    category: "legs",
    level: "beginner",
    sets: "3 sets × 12 reps",
    description: "Keep feet shoulder-width apart, push hips back and lower with control.",
    link: "https://www.youtube.com/results?search_query=bodyweight+squat+exercise+demo"
  },
  {
    name: "Reverse Lunges",
    category: "legs",
    level: "beginner",
    sets: "3 sets × 10 each leg",
    description: "Step backward, lower carefully and keep your front knee aligned.",
    link: "https://www.youtube.com/results?search_query=reverse+lunge+exercise+demo"
  },
  {
    name: "Push-ups",
    category: "chest",
    level: "beginner",
    sets: "3 sets × 8 reps",
    description: "Keep your body straight and lower your chest with control.",
    link: "https://www.youtube.com/results?search_query=push+up+exercise+demo"
  },
  {
    name: "Knee Push-ups",
    category: "chest",
    level: "beginner",
    sets: "3 sets × 10 reps",
    description: "Keep your body aligned from knees to shoulders.",
    link: "https://www.youtube.com/results?search_query=knee+push+up+demo"
  },
  {
    name: "Plank",
    category: "abs",
    level: "beginner",
    sets: "3 sets × 20 seconds",
    description: "Keep elbows under shoulders and your body in a straight line.",
    link: "https://www.youtube.com/results?search_query=plank+exercise+demo"
  },
  {
    name: "Crunches",
    category: "abs",
    level: "beginner",
    sets: "3 sets × 12 reps",
    description: "Lift your shoulders gently without pulling your neck.",
    link: "https://www.youtube.com/results?search_query=crunches+exercise+demo"
  },
  {
    name: "Shoulder Press",
    category: "shoulders",
    level: "intermediate",
    sets: "3 sets × 10 reps",
    description: "Press weights overhead without arching your lower back.",
    link: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+demo"
  },
  {
    name: "Lateral Raises",
    category: "shoulders",
    level: "beginner",
    sets: "3 sets × 12 reps",
    description: "Raise light weights to the sides with controlled movement.",
    link: "https://www.youtube.com/results?search_query=lateral+raise+exercise+demo"
  },
  {
    name: "Jumping Jacks",
    category: "full-body",
    level: "beginner",
    sets: "3 sets × 30 seconds",
    description: "Move arms and legs together at a comfortable pace.",
    link: "https://www.youtube.com/results?search_query=jumping+jacks+demo"
  },
  {
    name: "Burpees",
    category: "full-body",
    level: "advanced",
    sets: "3 sets × 8 reps",
    description: "Use a controlled squat and step or jump back carefully.",
    link: "https://www.youtube.com/results?search_query=burpee+exercise+demo"
  },
  {
    name: "Mountain Climbers",
    category: "abs",
    level: "intermediate",
    sets: "3 sets × 20 reps",
    description: "Keep shoulders over hands and alternate knees at a controlled pace.",
    link: "https://www.youtube.com/results?search_query=mountain+climber+demo"
  },
  {
    name: "Goblet Squats",
    category: "legs",
    level: "intermediate",
    sets: "3 sets × 10 reps",
    description: "Hold a weight close to your chest and squat with a stable torso.",
    link: "https://www.youtube.com/results?search_query=goblet+squat+demo"
  }
];

function renderWorkouts() {
  const category = $("workoutCategory").value;
  const level = $("workoutLevel").value;

  const filtered = exercises.filter(exercise =>
    (category === "all" || exercise.category === category) &&
    (level === "all" || exercise.level === level)
  );

  const list = $("workoutList");
  list.innerHTML = "";

  filtered.forEach(exercise => {
    const card = document.createElement("article");
    card.className = "workout-card";

    const categoryText =
      exercise.category.replace("-", " ").toUpperCase();

    card.innerHTML = `
      <span class="category">
        ${categoryText} / ${exercise.level.toUpperCase()}
      </span>
      <h3>${exercise.name}</h3>
      <p>${exercise.description}</p>
      <p><strong>${exercise.sets}</strong></p>
      <a href="${exercise.link}"
         target="_blank"
         rel="noopener noreferrer"
         class="text-btn">WATCH DEMO ↗</a>
      <br>
      <button class="primary-btn log-workout"
        data-index="${exercises.indexOf(exercise)}">
        COMPLETE WORKOUT
      </button>
    `;

    list.appendChild(card);
  });

  document.querySelectorAll(".log-workout").forEach(button => {
    button.addEventListener("click", () => {
      logWorkout(Number(button.dataset.index));
    });
  });
}

$("workoutCategory").addEventListener("change", renderWorkouts);
$("workoutLevel").addEventListener("change", renderWorkouts);

async function logWorkout(index) {
  if (!currentUser) return;

  const exercise = exercises[index];

  if (!exercise) return;

  try {
    await addDoc(
      collection(db, "users", currentUser.uid, "workouts"),
      {
        exercise: exercise.name,
        category: exercise.category,
        date: safeDateKey(),
        completedAt: serverTimestamp()
      }
    );

    await loadWorkoutHistory();

    alert(`${exercise.name} added to your workout history!`);

  } catch (error) {
    console.error("Workout save error:", error);
    alert("Unable to save workout: " + friendlyError(error));
  }
}

async function loadWorkoutHistory() {
  if (!currentUser) return;

  try {
    const workoutQuery = query(
      collection(db, "users", currentUser.uid, "workouts"),
      orderBy("completedAt", "desc")
    );

    const snapshot = await getDocs(workoutQuery);

    $("workoutValue").textContent = snapshot.size;

    $("progressWorkouts").textContent =
      `${snapshot.size} workouts completed`;

    const history = $("progressHistory");
    history.innerHTML = "";

    snapshot.forEach(item => {
      const data = item.data();

      const row = document.createElement("div");
      row.className = "history-item";
      row.textContent =
        `${data.exercise} • ${data.date || ""}`;

      history.appendChild(row);
    });

  } catch (error) {
    console.error("Workout history error:", error);
  }
}

/* =========================================
   7. WATER TRACKER
========================================= */

async function loadWater() {
  if (!currentUser) return;

  try {
    const snapshot = await getDoc(dailyDocument());

    waterCount = snapshot.exists()
      ? Number(snapshot.data().water || 0)
      : 0;

    updateWaterDisplay();

  } catch (error) {
    console.error("Water loading error:", error);
  }
}

function updateWaterDisplay() {
  waterCount = Math.max(0, Math.min(8, waterCount));

  $("waterValue").textContent = `${waterCount} / 8`;

  $("waterCount").textContent =
    `${waterCount} of 8 glasses`;

  $("waterBar").style.width =
    `${waterCount / 8 * 100}%`;
}

async function saveWater() {
  if (!currentUser) return;

  try {
    await setDoc(dailyDocument(), {
      water: waterCount,
      date: safeDateKey()
    }, { merge: true });

  } catch (error) {
    console.error("Water save error:", error);
    alert("Unable to save water tracker. Check Firestore permissions.");
  }
}

$("addWater").addEventListener("click", async () => {
  waterCount = Math.min(8, waterCount + 1);
  updateWaterDisplay();
  await saveWater();
});

$("removeWater").addEventListener("click", async () => {
  waterCount = Math.max(0, waterCount - 1);
  updateWaterDisplay();
  await saveWater();
});

/* =========================================
   8. WOMEN'S WELLNESS
========================================= */

async function loadWellness() {
  if (!currentUser) return;

  try {
    const cycleSnapshot = await getDoc(
      doc(db, "users", currentUser.uid, "wellness", "cycle")
    );

    if (cycleSnapshot.exists()) {
      const data = cycleSnapshot.data();

      $("periodStart").value = data.periodStart || "";
      $("periodEnd").value = data.periodEnd || "";
    }

    const dailySnapshot = await getDoc(dailyDocument());

    if (dailySnapshot.exists()) {
      $("restDay").checked =
        Boolean(dailySnapshot.data().restDay);
    }

  } catch (error) {
    console.error("Wellness loading error:", error);
  }
}

$("savePeriod").addEventListener("click", async () => {
  if (!currentUser) return;

  const start = $("periodStart").value;
  const end = $("periodEnd").value;

  if (!start || !end || end < start) {
    showMessage(
      "periodMessage",
      "Please enter valid start and end dates."
    );
    return;
  }

  try {
    await setDoc(
      doc(db, "users", currentUser.uid, "wellness", "cycle"),
      {
        periodStart: start,
        periodEnd: end,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    showMessage(
      "periodMessage",
      "Cycle dates saved successfully!"
    );

  } catch (error) {
    showMessage("periodMessage", friendlyError(error));
  }
});

$("restDay").addEventListener("change", async event => {
  if (!currentUser) return;

  try {
    await setDoc(dailyDocument(), {
      restDay: event.target.checked
    }, { merge: true });

  } catch (error) {
    console.error("Rest day save error:", error);
  }
});

/* =========================================
   9. DAILY THOUGHT
========================================= */

const quotes = [
  ["Discipline creates the results motivation promises.", "M.M FITNESS"],
  ["Your only competition is who you were yesterday.", "M.M FITNESS"],
  ["Strength grows every time you refuse to give up.", "M.M FITNESS"],
  ["Progress is built one workout at a time.", "M.M FITNESS"],
  ["Show up for yourself. Your future self will thank you.", "M.M FITNESS"],
  ["Strong habits build a stronger life.", "M.M FITNESS"]
];

$("newQuoteBtn").addEventListener("click", () => {
  const quote = quotes[
    Math.floor(Math.random() * quotes.length)
  ];

  $("dailyQuote").textContent = quote[0];
  $("quoteAuthor").textContent = "— " + quote[1];
});

/* =========================================
   10. FITNESS ASSISTANT
========================================= */

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("chatInput");
  const question = input.value.trim();

  if (!question) return;

  addChatBubble(question, "user");
  input.value = "";

  const lower = question.toLowerCase();

  let answer =
    "Start with a comfortable routine, warm up, use proper form and rest when needed. What fitness goal are you working towards?";

  if (lower.includes("fat") || lower.includes("weight loss")) {
    answer =
      "For general fat-loss support, combine regular activity, strength training, balanced meals, sleep and consistency. Avoid extreme diets.";

  } else if (lower.includes("muscle") || lower.includes("gain")) {
    answer =
      "For muscle development, use progressive strength training, enough recovery and balanced meals with adequate protein.";

  } else if (lower.includes("beginner")) {
    answer =
      "Start with 2–3 comfortable full-body sessions per week. Use simple movements and build up gradually.";

  } else if (lower.includes("water")) {
    answer =
      "Keep water accessible throughout the day. Your hydration needs vary with activity, weather and individual health.";

  } else if (lower.includes("abs")) {
    answer =
      "Try beginner-friendly planks and controlled crunches if comfortable. Stop if you feel pain.";

  } else if (lower.includes("pcos") || lower.includes("pcod")) {
    answer =
      "Regular movement, balanced nutrition and good sleep can support general wellbeing. Speak with a qualified healthcare professional for personalized PCOS/PCOD care.";

  } else if (lower.includes("diet") || lower.includes("food")) {
    answer =
      "A balanced plate can include vegetables, a protein source and a suitable portion of carbohydrates. Individual needs vary.";
  }

  addChatBubble(answer, "bot");
});

function addChatBubble(message, type) {
  const bubble = document.createElement("div");

  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = message;

  $("chatMessages").appendChild(bubble);

  $("chatMessages").scrollTop =
    $("chatMessages").scrollHeight;
}

/* =========================================
   11. LOG OUT
========================================= */

$("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(friendlyError(error));
  }
});

/* =========================================
   12. FIREBASE AUTHENTICATION LISTENER
========================================= */

onAuthStateChanged(auth, async user => {
  currentUser = user;

  if (!user) {
    showScreen("auth");
    setAuthMode(false);
    return;
  }

  showScreen("app");
  openPage("dashboard");

  try {
    await loadProfile();
    await loadWater();
    await loadWorkoutHistory();
    await loadWellness();

  } catch (error) {
    console.error("Dashboard loading error:", error);
  }
});

/* =========================================
   13. INITIAL STARTUP
========================================= */

// Prepare workout cards before the user opens the page.
renderWorkouts();

// Prepare the login screen.
setAuthMode(false);

// Keep the opening animation for approximately 3 seconds.
// Then reveal the login screen if the user is not logged in.
setTimeout(() => {
  $("loader").classList.add("hidden");

  if (!currentUser) {
    showScreen("auth");
  }
}, 3000);