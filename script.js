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
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

/* ==========================================
   1. FIREBASE CONFIGURATION
========================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBN3hQPjhhX3my8aWmOgR-cLg-uecehgkA",
  authDomain: "mm-fitness-450a1.firebaseapp.com",
  projectId: "mm-fitness-450a1",
  storageBucket: "mm-fitness-450a1.firebasestorage.app",
  messagingSenderId: "504073195369",
  appId: "1:504073195369:web:40f51c9a571d14c8b9f7f8",
  measurementId: "G-BSVSWXWFFE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ==========================================
   2. APP VARIABLES
========================================== */

const $ = id => document.getElementById(id);

let currentUser = null;
let userData = {};
let authMode = "login";

let waterGlasses = 0;
let waterGoal = 8;

let workoutHistory = [];
let foodHistory = [];

let reminderTimer = null;

let introFinished = false;
let pendingScreen = "login";
let authResolved = false;

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Small steps every day lead to big results.", author: "M.M FITNESS" },
  { text: "Strength grows when you keep showing up.", author: "M.M FITNESS" },
  { text: "Your only competition is who you were yesterday.", author: "M.M FITNESS" }
];

/* ==========================================
   3. EXERCISE LIBRARY
========================================== */

const exercises = [
  {
    name: "Bodyweight Squats",
    category: "Legs",
    level: "Beginner",
    sets: "3 sets",
    reps: "12 reps",
    rest: "60 seconds",
    description: "Stand with feet shoulder-width apart. Push your hips back, bend your knees, then return to standing.",
    tip: "Keep your heels on the floor and knees aligned with your toes.",
    video: "https://www.youtube.com/results?search_query=bodyweight+squat+proper+form"
  },
  {
    name: "Wall Push-ups",
    category: "Chest",
    level: "Beginner",
    sets: "3 sets",
    reps: "10 reps",
    rest: "45 seconds",
    description: "Place your hands on a wall at shoulder height. Bend your elbows to bring your chest closer, then push away.",
    tip: "Keep your body straight and move with control.",
    video: "https://www.youtube.com/results?search_query=wall+push+up+proper+form"
  },
  {
    name: "Knee Push-ups",
    category: "Chest",
    level: "Beginner",
    sets: "3 sets",
    reps: "8 reps",
    rest: "60 seconds",
    description: "Start on your hands and knees. Lower your chest towards the floor and push back up.",
    tip: "Keep your back straight and avoid dropping your hips.",
    video: "https://www.youtube.com/results?search_query=knee+push+up+proper+form"
  },
  {
    name: "Glute Bridges",
    category: "Glutes",
    level: "Beginner",
    sets: "3 sets",
    reps: "15 reps",
    rest: "45 seconds",
    description: "Lie on your back with knees bent. Lift your hips, squeeze your glutes, and lower slowly.",
    tip: "Avoid arching your lower back.",
    video: "https://www.youtube.com/results?search_query=glute+bridge+exercise+proper+form"
  },
  {
    name: "Plank",
    category: "Abs",
    level: "Beginner",
    sets: "3 sets",
    reps: "20 seconds",
    rest: "45 seconds",
    description: "Rest on your forearms and toes. Keep your body in a straight line.",
    tip: "Keep your stomach engaged and do not hold your breath.",
    video: "https://www.youtube.com/results?search_query=forearm+plank+proper+form"
  },
  {
    name: "Bird Dog",
    category: "Abs",
    level: "Beginner",
    sets: "3 sets",
    reps: "10 each side",
    rest: "45 seconds",
    description: "Start on hands and knees. Extend the opposite arm and leg, pause, then switch sides.",
    tip: "Keep your hips level and move slowly.",
    video: "https://www.youtube.com/results?search_query=bird+dog+exercise+proper+form"
  },
  {
    name: "Walking Lunges",
    category: "Legs",
    level: "Intermediate",
    sets: "3 sets",
    reps: "10 each leg",
    rest: "60 seconds",
    description: "Step forward, bend both knees, then push through the front foot to step forward again.",
    tip: "Keep your front knee aligned with your foot.",
    video: "https://www.youtube.com/results?search_query=walking+lunges+proper+form"
  },
  {
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    level: "Intermediate",
    sets: "3 sets",
    reps: "10 reps",
    rest: "60 seconds",
    description: "Hold dumbbells at shoulder height and press overhead. Lower with control.",
    tip: "Use a manageable weight and avoid arching your back.",
    video: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+proper+form"
  },
  {
    name: "Dumbbell Rows",
    category: "Back",
    level: "Intermediate",
    sets: "3 sets",
    reps: "12 reps",
    rest: "60 seconds",
    description: "Hinge at your hips, keep your back neutral and pull the weights towards your waist.",
    tip: "Avoid rounding your back or jerking the weights.",
    video: "https://www.youtube.com/results?search_query=dumbbell+row+proper+form"
  },
  {
    name: "Bicep Curls",
    category: "Biceps",
    level: "Beginner",
    sets: "3 sets",
    reps: "12 reps",
    rest: "45 seconds",
    description: "Hold weights by your sides. Bend your elbows to lift, then lower slowly.",
    tip: "Keep your elbows close to your body.",
    video: "https://www.youtube.com/results?search_query=dumbbell+bicep+curl+proper+form"
  },
  {
    name: "Tricep Extensions",
    category: "Triceps",
    level: "Beginner",
    sets: "3 sets",
    reps: "10 reps",
    rest: "45 seconds",
    description: "Hold one light dumbbell overhead. Bend your elbows to lower it behind your head, then extend.",
    tip: "Keep your elbows comfortably close to your head.",
    video: "https://www.youtube.com/results?search_query=dumbbell+tricep+extension+proper+form"
  },
  {
    name: "Marching in Place",
    category: "Cardio",
    level: "Beginner",
    sets: "3 rounds",
    reps: "1 minute",
    rest: "30 seconds",
    description: "March on the spot, lifting your knees comfortably and swinging your arms.",
    tip: "Choose a pace that lets you breathe comfortably.",
    video: "https://www.youtube.com/results?search_query=marching+in+place+exercise"
  },
  {
    name: "Jumping Jacks",
    category: "Cardio",
    level: "Intermediate",
    sets: "3 sets",
    reps: "30 seconds",
    rest: "45 seconds",
    description: "Jump your feet apart while raising your arms, then return to the starting position.",
    tip: "Use step-out jacks instead if jumping is uncomfortable.",
    video: "https://www.youtube.com/results?search_query=jumping+jacks+proper+form"
  },
  {
    name: "Mountain Climbers",
    category: "Full Body",
    level: "Advanced",
    sets: "3 sets",
    reps: "30 seconds",
    rest: "60 seconds",
    description: "Start in a high plank and alternate bringing each knee towards your chest.",
    tip: "Keep your shoulders over your wrists and control your movement.",
    video: "https://www.youtube.com/results?search_query=mountain+climbers+proper+form"
  }
];

/* ==========================================
   4. GENERAL HELPERS
========================================== */

function showMessage(id, message, isError = false) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#e58b8b" : "#b6e36b";
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getValue(id, fallback = "") {
  return $(id)?.value?.trim() || fallback;
}

function setText(id, value) {
  if ($(id)) $(id).textContent = value;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(name = "Member") {
  return name.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

/* ==========================================
   5. INTRO ANIMATION
========================================== */

function finishIntro() {
  if (introFinished) return;

  introFinished = true;

  const intro = $("introScreen");

  if (intro) {
    intro.classList.add("hide");
  }

  $("loader")?.classList.add("hidden");

  if (authResolved) {
    revealCorrectScreen();
  }
}

function revealCorrectScreen() {
  if (!introFinished || !authResolved) return;

  if (pendingScreen === "app") {
    $("authScreen")?.classList.add("hidden");
    $("app")?.classList.remove("hidden");
  } else {
    $("app")?.classList.add("hidden");
    $("authScreen")?.classList.remove("hidden");
  }
}

// Start animation only once.
if ($("introScreen")) {
  setTimeout(finishIntro, 3500);
} else {
  introFinished = true;
}

/* ==========================================
   6. FIRESTORE SAVE AND LOAD
========================================== */

async function saveUserData() {
  if (!currentUser) return;

  try {
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        ...userData,
        waterGlasses,
        waterGoal,
        workoutHistory,
        foodHistory,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Save error:", error);
    showMessage(
      "profileMessage",
      "Could not save your information. Check your connection.",
      true
    );
  }
}

async function loadUserData(user) {
  try {
    const snapshot = await getDoc(doc(db, "users", user.uid));

    userData = snapshot.exists() ? snapshot.data() || {} : {};

    waterGlasses = Number(userData.waterGlasses || 0);
    waterGoal = Number(userData.waterGoal || 8);

    workoutHistory = Array.isArray(userData.workoutHistory)
      ? userData.workoutHistory : [];

    foodHistory = Array.isArray(userData.foodHistory)
      ? userData.foodHistory : [];

    fillProfile();
    restoreSavedSettings();
    updateDashboard();
    renderWater();
    renderFoodHistory();
    renderProgress();
    renderWorkouts();
    renderTimetable();

    showApp();

  } catch (error) {
    console.error("Load error:", error);
    alert("We couldn't load your saved profile. Check your connection and Firestore rules.");
  }
}

/* ==========================================
   7. LOGIN AND SIGNUP
========================================== */

function setAuthMode(mode) {
  authMode = mode;

  const isSignup = mode === "signup";

  setText("authTitle", isSignup ? "Create your account" : "Welcome back");

  setText(
    "authSubtitle",
    isSignup
      ? "Start building a stronger, healthier you."
      : "Sign in to continue your fitness journey."
  );

  $("nameGroup")?.classList.toggle("hidden", !isSignup);

  setText("authSubmit", isSignup ? "CREATE ACCOUNT" : "LOGIN");

  setText(
    "switchText",
    isSignup ? "Already have an account?" : "New to M.M FITNESS?"
  );

  setText("switchAuth", isSignup ? "Login" : "Create account");

  showMessage("authMessage", "");
}

$("switchAuth")?.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

$("authForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = getValue("email");
  const password = $("password")?.value || "";
  const fullName = getValue("fullName", "M.M FITNESS Member");

  if (!email || !password) {
    showMessage("authMessage", "Enter your email and password.", true);
    return;
  }

  const button = $("authSubmit");

  if (button) {
    button.disabled = true;
    button.textContent = "PLEASE WAIT...";
  }

  try {
    if (authMode === "signup") {
      const result = await createUserWithEmailAndPassword(
        auth, email, password
      );

      await updateProfile(result.user, {
        displayName: fullName
      });

      currentUser = result.user;
      userData = { name: fullName };

      await saveUserData();

    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }

  } catch (error) {
    console.error(error);

    const messages = {
      "auth/email-already-in-use": "This email already has an account. Please log in.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Choose a stronger password with at least 6 characters.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/network-request-failed": "Network error. Check your internet connection."
    };

    showMessage(
      "authMessage",
      messages[error.code] || error.message,
      true
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = authMode === "signup"
        ? "CREATE ACCOUNT"
        : "LOGIN";
    }
  }
});

/* ==========================================
   8. SCREEN MANAGEMENT
========================================== */

function showApp() {
  pendingScreen = "app";
  revealCorrectScreen();

  const name = userData.name ||
    currentUser?.displayName ||
    "Member";

  setText("welcomeName", name);
  setText("userInitials", getInitials(name));

  navigateTo("dashboard");
}

function showLogin() {
  pendingScreen = "login";
  revealCorrectScreen();
}

onAuthStateChanged(auth, async user => {
  currentUser = user;

  if (user) {
    await loadUserData(user);
  } else {
    userData = {};
    waterGlasses = 0;
    workoutHistory = [];
    foodHistory = [];
    authResolved = true;
    showLogin();
  }
});

/* ==========================================
   9. NAVIGATION
========================================== */

const pageNames = {
  dashboard: "Overview",
  setup: "My Fitness Profile",
  workouts: "Workouts",
  timetable: "Weekly Timetable",
  nutrition: "Nutrition",
  water: "Water Tracker",
  women: "Women's Wellness",
  progress: "My Progress"
};

function navigateTo(page) {
  const target = $("page-" + page);

  if (!target) return;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.remove("active");
  });

  target.classList.add("active");

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  setText("pageHeading", pageNames[page] || "M.M FITNESS");

  if (page === "workouts") renderWorkouts();
  if (page === "timetable") renderTimetable();
  if (page === "progress") renderProgress();
}

document.querySelectorAll(".nav[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.page);
  });
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.goto);
  });
});

$("logoutBtn")?.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to log out?")) return;

  try {
    stopWaterReminder();
    await signOut(auth);
  } catch (error) {
    alert("Could not log out: " + error.message);
  }
});

/* ==========================================
   10. PROFILE
========================================== */

function fillProfile() {
  const fields = [
    "profileName",
    "profileAge",
    "profileHeight",
    "profileWeight",
    "profileGender",
    "profileGoal",
    "profileLevel",
    "profileDiet",
    "fitnessGender",
    "fitnessGoal",
    "fitnessLevel",
    "fitnessAge",
    "fitnessHeight",
    "fitnessWeight"
  ];

  fields.forEach(id => {
    if ($(id) && userData[id] !== undefined) {
      $(id).value = userData[id];
    }
  });
}

function collectProfile() {
  const fields = [
    "profileName",
    "profileAge",
    "profileHeight",
    "profileWeight",
    "profileGender",
    "profileGoal",
    "profileLevel",
    "profileDiet",
    "fitnessGender",
    "fitnessGoal",
    "fitnessLevel",
    "fitnessAge",
    "fitnessHeight",
    "fitnessWeight"
  ];

  fields.forEach(id => {
    if ($(id)) userData[id] = $(id).value;
  });

  userData.name =
    getValue("profileName") ||
    currentUser?.displayName ||
    "Member";
}

$("profileForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  collectProfile();
  await saveUserData();

  showMessage("profileMessage", "Your profile has been saved.");
  updateDashboard();
});

$("page-setup")?.querySelector("form")?.addEventListener("submit", async event => {
  if (event.target.id === "profileForm") return;

  event.preventDefault();

  event.target.querySelectorAll("input, select, textarea").forEach(field => {
    if (field.id) userData[field.id] = field.value;
  });

  await saveUserData();

  showMessage("setupMessage", "Your fitness preferences have been saved.");
  updateDashboard();
});

/* ==========================================
   11. BMI CALCULATOR
========================================== */

function calculateBMI() {
  const height = Number(
    userData.profileHeight ||
    userData.fitnessHeight ||
    userData.height
  );

  const weight = Number(
    userData.profileWeight ||
    userData.fitnessWeight ||
    userData.weight
  );

  if (!height || !weight) {
    return {
      value: "--",
      status: "Complete your profile"
    };
  }

  const bmi = weight / Math.pow(height / 100, 2);

  let status = "Within general reference range";

  if (bmi < 18.5) status = "Below general reference range";
  else if (bmi < 25) status = "Within general reference range";
  else if (bmi < 30) status = "Above general reference range";
  else status = "Higher BMI range";

  return {
    value: bmi.toFixed(1),
    status
  };
}

/* ==========================================
   12. DASHBOARD
========================================== */

function updateDashboard() {
  const bmi = calculateBMI();

  setText("bmiValue", bmi.value);
  setText("bmiStatus", bmi.status);
  setText("waterValue", `${waterGlasses}/${waterGoal} glasses`);
  setText("workoutValue", String(workoutHistory.length));

  const name = userData.name ||
    currentUser?.displayName ||
    "Member";

  setText("welcomeName", name);
  setText("userInitials", getInitials(name));
}

function showQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  setText("dailyQuote", `"${quote.text}"`);
  setText("quoteAuthor", `— ${quote.author}`);
}

$("newQuoteBtn")?.addEventListener("click", showQuote);

/* ==========================================
   13. WORKOUT LIBRARY
========================================== */

function renderWorkouts() {
  const list = $("workoutList");
  if (!list) return;

  const category = getValue("workoutCategory", "All");
  const level = getValue("workoutLevel", "All");

  const filtered = exercises.filter(exercise => {
    const categoryMatch =
      category === "All" ||
      !category ||
      exercise.category.toLowerCase() === category.toLowerCase();

    const levelMatch =
      level === "All" ||
      !level ||
      exercise.level.toLowerCase() === level.toLowerCase();

    return categoryMatch && levelMatch;
  });

  if (!filtered.length) {
    list.innerHTML = "<p>No exercises match these filters.</p>";
    return;
  }

  list.innerHTML = filtered.map((exercise, index) => `
    <article class="workout-card">
      <span class="category">${safeText(exercise.category)}</span>
      <h3>${safeText(exercise.name)}</h3>
      <p><strong>Level:</strong> ${safeText(exercise.level)}</p>
      <p><strong>Sets:</strong> ${safeText(exercise.sets)}</p>
      <p><strong>Reps / Time:</strong> ${safeText(exercise.reps)}</p>
      <p><strong>Rest:</strong> ${safeText(exercise.rest)}</p>
      <p>${safeText(exercise.description)}</p>
      <p><strong>Form tip:</strong> ${safeText(exercise.tip)}</p>

      <a class="text-btn"
         href="${exercise.video}"
         target="_blank"
         rel="noopener">
         Watch exercise demonstration ↗
      </a>

      <button class="primary-btn" data-complete-workout="${index}">
        MARK COMPLETED
      </button>
    </article>
  `).join("");

  list.querySelectorAll("[data-complete-workout]").forEach(button => {
    button.addEventListener("click", async () => {
      const exercise = filtered[Number(button.dataset.completeWorkout)];

      if (!exercise) return;

      workoutHistory.unshift({
        name: exercise.name,
        category: exercise.category,
        date: todayKey()
      });

      workoutHistory = workoutHistory.slice(0, 100);

      await saveUserData();

      updateDashboard();
      renderProgress();

      button.textContent = "COMPLETED ✓";
      button.disabled = true;
    });
  });
}

$("workoutCategory")?.addEventListener("change", renderWorkouts);
$("workoutLevel")?.addEventListener("change", renderWorkouts);

/* ==========================================
   14. WEEKLY TIMETABLE
========================================== */

function renderTimetable() {
  const container = $("timetableContent");
  if (!container) return;

  const selectedDays = Array.isArray(userData.availableDays)
    ? userData.availableDays
    : [];

  if (!userData.wantsTimetable || selectedDays.length === 0) {
    container.innerHTML = `
      <div class="schedule-day">
        <h3>Your timetable</h3>
        <p>Choose whether you want a weekly timetable in your fitness setup.</p>
      </div>
    `;
    return;
  }

  const time = userData.workoutTime || "Your preferred time";
  const duration = userData.workoutDuration || "45–60 minutes";
  const goal = userData.profileGoal || userData.fitnessGoal || "General fitness";

  const weeklyFocus = [
    "Full body",
    "Lower body",
    "Upper body",
    "Core and stability",
    "Cardio and endurance",
    "Strength and mobility",
    "Recovery or optional activity"
  ];

  const days = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
  ];

  container.innerHTML = days.map((day, index) => {
    const isWorkoutDay = selectedDays.includes(day);

    return `
      <article class="schedule-day ${isWorkoutDay ? "" : "rest"}">
        <h3>${day}</h3>

        ${
          isWorkoutDay
            ? `
              <p><strong>${weeklyFocus[index]}</strong></p>
              <p>Goal: ${safeText(goal)}</p>
              <p>Time: ${safeText(time)}</p>
              <p>Duration: ${safeText(duration)}</p>
            `
            : "<p>Rest / recovery day</p>"
        }
      </article>
    `;
  }).join("");
}

/* ==========================================
   15. NUTRITION AND FOOD LOG
========================================== */

function renderFoodHistory() {
  const history = $("foodHistory");
  if (!history) return;

  if (!foodHistory.length) {
    history.innerHTML = "<p>No food entries yet. Add your first meal above.</p>";
    return;
  }

  history.innerHTML = foodHistory.map(item => `
    <div class="history-item">
      <strong>${safeText(item.meal)}</strong>
      <p>${safeText(item.food)}</p>
      <small>${safeText(item.date)}</small>
    </div>
  `).join("");
}

$("foodForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const meal = getValue("foodMeal");
  const food = getValue("foodEntry");

  if (!meal || !food) return;

  foodHistory.unshift({
    meal,
    food,
    date: todayKey()
  });

  foodHistory = foodHistory.slice(0, 100);

  await saveUserData();
  renderFoodHistory();

  $("foodForm").reset();
});

/* ==========================================
   16. WATER TRACKER
========================================== */

function renderWater() {
  const count = $("waterCount");
  const bar = $("waterBar");

  if (count) {
    count.textContent = `${waterGlasses} / ${waterGoal} glasses`;
  }

  if (bar) {
    bar.style.width =
      `${Math.min(100, (waterGlasses / waterGoal) * 100)}%`;
  }

  setText("waterValue", `${waterGlasses}/${waterGoal} glasses`);
}

$("addWater")?.addEventListener("click", async () => {
  waterGlasses = Math.min(waterGlasses + 1, 30);

  renderWater();
  updateDashboard();

  await saveUserData();
});

$("removeWater")?.addEventListener("click", async () => {
  waterGlasses = Math.max(0, waterGlasses - 1);

  renderWater();
  updateDashboard();

  await saveUserData();
});

/* ==========================================
   17. WATER REMINDERS
========================================== */

function stopWaterReminder() {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
}

function startWaterReminder() {
  stopWaterReminder();

  const enabled = $("reminderEnabled")?.checked;
  const interval = Number($("reminderInterval")?.value || 60);

  if (!enabled) {
    showMessage("reminderMessage", "Water reminders are turned off.");
    return;
  }

  if (!Number.isFinite(interval) || interval < 15) {
    showMessage(
      "reminderMessage",
      "Choose an interval of at least 15 minutes.",
      true
    );
    return;
  }

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  reminderTimer = setInterval(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("M.M FITNESS 💧", {
        body: "Time for a glass of water. Keep yourself hydrated!"
      });
    } else {
      alert("M.M FITNESS: Time to drink some water!");
    }
  }, interval * 60 * 1000);

  showMessage(
    "reminderMessage",
    `Reminder set for every ${interval} minutes while this page is open.`
  );
}

$("saveReminder")?.addEventListener("click", async () => {
  userData.reminderEnabled = $("reminderEnabled")?.checked || false;
  userData.reminderStart = getValue("reminderStart");
  userData.reminderEnd = getValue("reminderEnd");
  userData.reminderInterval = getValue("reminderInterval", "60");

  await saveUserData();
  startWaterReminder();
});

/* ==========================================
   18. WOMEN'S WELLNESS
========================================== */

$("savePeriod")?.addEventListener("click", async () => {
  const start = getValue("periodStart");
  const end = getValue("periodEnd");

  if (start && end && end < start) {
    showMessage(
      "periodMessage",
      "End date cannot be before start date.",
      true
    );
    return;
  }

  userData.periodStart = start;
  userData.periodEnd = end;

  await saveUserData();

  showMessage(
    "periodMessage",
    "Your dates have been saved privately to your account."
  );
});

$("restDay")?.addEventListener("change", async () => {
  userData.restDay = $("restDay").checked;

  await saveUserData();

  showMessage(
    "periodMessage",
    userData.restDay
      ? "Rest day selected. Listen to your body and adjust activity as needed."
      : "Rest day option turned off."
  );
});

/* ==========================================
   19. PROGRESS
========================================== */

function renderProgress() {
  setText("progressWorkouts", String(workoutHistory.length));

  const history = $("progressHistory");
  if (!history) return;

  if (!workoutHistory.length) {
    history.innerHTML = "<p>Your completed workouts will appear here.</p>";
    return;
  }

  history.innerHTML = workoutHistory.map(item => `
    <div class="history-item">
      <strong>${safeText(item.name)}</strong>
      <p>${safeText(item.category || "Workout")} · ${safeText(item.date)}</p>
    </div>
  `).join("");
}

/* ==========================================
   20. RESTORE SAVED SETTINGS
========================================== */

function restoreSavedSettings() {
  if ($("reminderEnabled")) {
    $("reminderEnabled").checked = Boolean(userData.reminderEnabled);
  }

  if ($("reminderStart")) {
    $("reminderStart").value = userData.reminderStart || "";
  }

  if ($("reminderEnd")) {
    $("reminderEnd").value = userData.reminderEnd || "";
  }

  if ($("reminderInterval")) {
    $("reminderInterval").value = userData.reminderInterval || "60";
  }

  if ($("periodStart")) {
    $("periodStart").value = userData.periodStart || "";
  }

  if ($("periodEnd")) {
    $("periodEnd").value = userData.periodEnd || "";
  }

  if ($("restDay")) {
    $("restDay").checked = Boolean(userData.restDay);
  }
}

/* ==========================================
   21. INITIAL SETUP
========================================== */

setAuthMode("login");
showQuote();