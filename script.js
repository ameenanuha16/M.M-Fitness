document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const activities = ["Full body","Legs","Chest","Shoulders","Abs","Cardio","Mobility","Rest day"];
  const meals = ["Breakfast","Lunch","Evening snack","Dinner"];
  const habits = ["Morning stretch","Workout","Drink enough water","Eat balanced meals","Sleep on time"];

  const exercises = [
    {name:"Squats",cat:"Legs",level:"Beginner",sets:"3 × 12",steps:"1. Stand with feet shoulder-width apart.\n2. Push your hips back and bend your knees.\n3. Keep your chest lifted.\n4. Push through your feet to stand.",tip:"Keep knees aligned with toes.",search:"squat exercise demonstration"},
    {name:"Lunges",cat:"Legs",level:"Intermediate",sets:"3 × 10 each leg",steps:"1. Stand tall.\n2. Step forward.\n3. Bend both knees comfortably.\n4. Push back to standing.",tip:"Keep your front knee aligned with your foot.",search:"lunge exercise demonstration"},
    {name:"Glute Bridge",cat:"Legs",level:"Beginner",sets:"3 × 12",steps:"1. Lie on your back with knees bent.\n2. Keep feet flat.\n3. Lift your hips gently.\n4. Lower slowly.",tip:"Avoid forcing your lower back.",search:"glute bridge demonstration"},
    {name:"Push-ups",cat:"Chest",level:"Beginner",sets:"3 × 8",steps:"1. Place hands slightly wider than shoulders.\n2. Keep your body straight.\n3. Lower your chest.\n4. Push back up.",tip:"Try a wall or knees-down version if needed.",search:"push up exercise demonstration"},
    {name:"Chest Press",cat:"Chest",level:"Intermediate",sets:"3 × 10",steps:"1. Lie on a bench with light dumbbells.\n2. Press the weights upwards.\n3. Lower slowly with control.",tip:"Start with light weights.",search:"dumbbell chest press demonstration"},
    {name:"Plank",cat:"Abs",level:"Beginner",sets:"3 × 20 seconds",steps:"1. Rest on forearms and toes.\n2. Keep your body straight.\n3. Breathe normally while holding.",tip:"Avoid dropping your hips.",search:"plank exercise demonstration"},
    {name:"Bicycle Crunch",cat:"Abs",level:"Intermediate",sets:"3 × 12 each side",steps:"1. Lie on your back.\n2. Bring opposite elbow and knee towards each other.\n3. Alternate sides slowly.",tip:"Do not pull your neck.",search:"bicycle crunch demonstration"},
    {name:"Shoulder Press",cat:"Shoulders",level:"Intermediate",sets:"3 × 10",steps:"1. Hold light dumbbells at shoulder height.\n2. Press overhead.\n3. Lower slowly.",tip:"Avoid arching your back.",search:"shoulder press demonstration"},
    {name:"Lateral Raises",cat:"Shoulders",level:"Beginner",sets:"3 × 12",steps:"1. Hold light dumbbells by your sides.\n2. Lift arms outwards to shoulder height.\n3. Lower slowly.",tip:"Use light weights and controlled movement.",search:"lateral raise demonstration"},
    {name:"Jumping Jacks",cat:"Full Body",level:"Beginner",sets:"3 × 30 seconds",steps:"1. Stand upright.\n2. Jump feet apart while raising arms.\n3. Return to starting position.",tip:"Use step-outs for a low-impact option.",search:"jumping jacks demonstration"},
    {name:"Mountain Climbers",cat:"Full Body",level:"Advanced",sets:"3 × 20 seconds",steps:"1. Start in a high plank.\n2. Bring one knee towards your chest.\n3. Alternate legs with control.",tip:"Keep shoulders above your hands.",search:"mountain climbers demonstration"}
  ];

  let user = {};
  let step = 0;
  let form = {};
  let plan = {};
  let water = 0;
  let mealsDone = [];
  let habitsDone = [];

  function get(key, fallback) {
    try {
      const value = localStorage.getItem("mm_" + key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem("mm_" + key, JSON.stringify(value));
  }

  function todayKey() {
    return new Date().toISOString().slice(0,10);
  }

  function loadDaily() {
    const saved = get("daily", {});
    const today = todayKey();
    if (saved.date !== today) {
      water = 0;
      mealsDone = [];
      habitsDone = [];
      save("daily",{date:today,water,mealsDone,habitsDone,workout:false});
    } else {
      water = saved.water || 0;
      mealsDone = saved.mealsDone || [];
      habitsDone = saved.habitsDone || [];
    }
  }

  function saveDaily() {
    const old = get("daily",{});
    save("daily",{
      date:todayKey(),
      water,
      mealsDone,
      habitsDone,
      workout:old.date === todayKey() ? !!old.workout : false,
      sleep:old.date === todayKey() ? old.sleep || "" : ""
    });
  }

  function defaultPlan() {
    const groups = ["Full body","Legs","Chest & shoulders","Abs","Full body","Cardio & mobility","Rest day"];
    const result = {};
    days.forEach((day,i) => {
      result[day] = {
        activity:groups[i],
        duration:i === 6 ? "Rest" : (user.duration || "45 minutes"),
        time:user.workoutTime || "17:00",
        status:i === 6 ? "Rest day" : "Workout"
      };
    });
    return result;
  }

  function startApp() {
    setTimeout(() => {
      $("intro").classList.add("hidden");
      $("app").classList.remove("hidden");
      loadDaily();
      user = get("user",null);

      if (user) {
        plan = get("plan",null) || defaultPlan();
        showDashboard();
      } else {
        $("login").classList.remove("hidden");
      }
    },3900);
  }

  startApp();

  $("loginButton").addEventListener("click",() => {
    const name = $("loginName").value.trim();
    if (!name) return alert("Please enter your name.");
    user = {name};
    save("user",user);
    form = {};
    step = 0;
    $("login").classList.add("hidden");
    $("onboarding").classList.remove("hidden");
    renderStep();
  });

  function renderStep() {
    const labels = ["STEP 1 OF 3","STEP 2 OF 3","STEP 3 OF 3"];
    $("stepLabel").textContent = labels[step];
    $("stepBar").style.width = ((step+1)/3*100)+"%";
    $("backStep").classList.toggle("hidden",step===0);

    const content = $("stepContent");

    if (step === 0) {
      content.innerHTML = `
        <h2>ABOUT YOU.</h2><p>Let's understand your starting point.</p>
        <label>Age</label><input id="fAge" type="number" min="13" max="100" placeholder="Your age" value="${form.age||""}">
        <div class="field-grid">
          <div><label>Gender section</label><select id="fGender"><option>Men</option><option>Women</option></select></div>
          <div><label>Height (cm)</label><input id="fHeight" type="number" placeholder="Height" value="${form.height||""}"></div>
        </div>
        <label>Current weight (kg)</label><input id="fWeight" type="number" placeholder="Weight" value="${form.weight||""}">
        <label>Fitness goal</label><select id="fGoal">${["General fitness","Weight loss","Weight gain","Muscle building","Lean muscle","Maintain fitness"].map(x=>`<option ${form.goal===x?"selected":""}>${x}</option>`).join("")}</select>
      `;
    }

    if (step === 1) {
      content.innerHTML = `
        <h2>YOUR LIFESTYLE.</h2><p>Build a plan that fits your everyday routine.</p>
        <label>Experience level</label><select id="fLevel">${["Beginner","Intermediate","Advanced"].map(x=>`<option ${form.level===x?"selected":""}>${x}</option>`).join("")}</select>
        <label>Daily lifestyle</label><select id="fLifestyle">${["Mostly sitting","Moderately active","Very active","Student","Working professional"].map(x=>`<option ${form.lifestyle===x?"selected":""}>${x}</option>`).join("")}</select>
        <div class="field-grid">
          <div><label>Wake-up time</label><input type="time" id="fWake" value="${form.wake||"07:00"}"></div>
          <div><label>Sleep time</label><input type="time" id="fSleep" value="${form.sleep||"22:30"}"></div>
        </div>
        <div class="field-grid">
          <div><label>Workout time</label><input type="time" id="fWorkoutTime" value="${form.workoutTime||"17:00"}"></div>
          <div><label>Session duration</label><select id="fDuration"><option>30 minutes</option><option selected>45 minutes</option><option>60 minutes</option><option>75 minutes</option></select></div>
        </div>
      `;
    }

    if (step === 2) {
      content.innerHTML = `
        <h2>YOUR PREFERENCES.</h2><p>Choose how you prefer to train and eat.</p>
        <label>Where do you exercise?</label><select id="fPlace"><option>Gym</option><option>Home</option><option>Both</option></select>
        <label>Equipment available</label><select id="fEquipment"><option>Bodyweight only</option><option>Dumbbells and basic equipment</option><option>Full gym equipment</option><option>Both home and gym equipment</option></select>
        <label>Food preference</label><select id="fFood"><option>Vegetarian</option><option>Non-vegetarian</option><option>Eggetarian</option><option>Vegan</option><option>No preference</option></select>
        <label>Workout days</label><select id="fDays"><option>3 days</option><option>4 days</option><option>5 days</option><option selected>6 days</option></select>
        <label>Focus area</label><select id="fFocus"><option>All body</option><option>Abs and core</option><option>Legs and glutes</option><option>Chest and shoulders</option><option>Full body strength</option></select>
      `;
    }

    $("nextStep").textContent = step===2 ? "CREATE MY PLAN ↗" : "CONTINUE ↗";
  }

  function readStep() {
    const fields = [
      ["age","fAge"],["gender","fGender"],["height","fHeight"],
      ["weight","fWeight"],["goal","fGoal"],["level","fLevel"],
      ["lifestyle","fLifestyle"],["wake","fWake"],["sleep","fSleep"],
      ["workoutTime","fWorkoutTime"],["duration","fDuration"],
      ["place","fPlace"],["equipment","fEquipment"],["food","fFood"],
      ["days","fDays"],["focus","fFocus"]
    ];
    const active = fields.filter(([key,id])=>$(id));
    active.forEach(([key,id])=>form[key]=$(id).value);

    if (step===0 && (!form.age || !form.height || !form.weight)) {
      alert("Please enter your age, height and weight.");
      return false;
    }
    return true;
  }

  $("nextStep").addEventListener("click",() => {
    if (!readStep()) return;
    if (step<2) {
      step++;
      renderStep();
    } else {
      user = {...user,...form};
      save("user",user);
      plan = defaultPlan();
      save("plan",plan);
      $("onboarding").classList.add("hidden");
      showDashboard();
    }
  });

  $("backStep").addEventListener("click",() => {
    readStep();
    if (step>0) step--;
    renderStep();
  });

  function showDashboard() {
    $("login").classList.add("hidden");
    $("onboarding").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    $("avatar").textContent = user.name.charAt(0).toUpperCase();
    $("helloText").textContent = `Welcome, ${user.name}. Your ${user.goal || "fitness"} journey starts now.`;
    $("overviewGoal").textContent = (user.goal||"Fitness").toUpperCase();
    $("overviewLevel").textContent = (user.level||"Beginner")+" level";
    $("foodPreference").textContent = "Your selected preference: "+(user.food||"Not selected");
    if(user.gender==="Women") $("womenWellness").classList.remove("hidden");
    else $("womenWellness").classList.add("hidden");
    $("profileDetails").innerHTML = `
      <h3>${user.name}</h3>
      <p class="muted">Section: ${user.gender||"Not selected"} · Age: ${user.age||"—"}</p>
      <p class="muted">Height: ${user.height||"—"} cm · Weight: ${user.weight||"—"} kg</p>
      <p class="muted">Goal: ${user.goal||"—"} · Experience: ${user.level||"—"}</p>
      <p class="muted">Lifestyle: ${user.lifestyle||"—"} · Training: ${user.place||"—"}</p>
      <p class="muted">Food: ${user.food||"—"} · Focus: ${user.focus||"—"}</p>`;
    $("profileGoal").value = user.goal || "General fitness";
    renderAll();
    navigate("overview");
  }

  $("logout").addEventListener("click",()=>{
    if(!confirm("Log out of this browser profile?")) return;
    localStorage.removeItem("mm_user");
    $("dashboard").classList.add("hidden");
    $("onboarding").classList.add("hidden");
    $("login").classList.remove("hidden");
  });

  function navigate(id) {
    document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
    $(id).classList.remove("hidden");
    document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
    const names={overview:"Overview",timetable:"My timetable",workouts:"Workouts",trackers:"Daily trackers",nutrition:"Nutrition",wellness:"Wellness",profile:"My profile"};
    $("pageTitle").textContent=names[id];
  }

  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));

  function renderAll() {
    renderPlan();
    renderExerciseGrid("All");
    renderTrackers();
    renderReminderFields();
    renderWeights();
    renderToday();
    $("quoteText").textContent=["Discipline creates results.","Progress over perfection.","Show up for yourself.","Stronger habits, stronger you."][new Date().getDate()%4];
  }

  function renderPlan() {
    $("weekSchedule").innerHTML = days.map(day=>{
      const item=plan[day];
      return `<div class="schedule-card" data-day="${day}"><b>${day.toUpperCase()}</b><p>${item.activity}<br>${item.duration} · ${item.time}<br>${item.status}</p></div>`;
    }).join("");

    $("editDay").innerHTML=days.slice(0,6).map(d=>`<option>${d}</option>`).join("");
    $("editActivity").innerHTML=activities.map(a=>`<option>${a}</option>`).join("");
    loadEditDay();
    document.querySelectorAll(".schedule-card").forEach(card=>{
      card.addEventListener("click",()=>{
        if(card.dataset.day==="Sunday"){alert("Sunday is your planned rest day.");return;}
        $("editDay").value=card.dataset.day;
        loadEditDay();
        $("editDay").scrollIntoView({behavior:"smooth",block:"center"});
      });
    });
  }

  function loadEditDay() {
    const item=plan[$("editDay").value];
    if(!item)return;
    $("editActivity").value=item.activity;
    $("editDuration").value=item.duration==="Rest"?"45 minutes":item.duration;
    $("editTime").value=item.time;
    $("editStatus").value=item.status;
  }

  $("editDay").addEventListener("change",loadEditDay);

  $("saveSchedule").addEventListener("click",()=>{
    const day=$("editDay").value;
    plan[day]={
      activity:$("editActivity").value,
      duration:$("editStatus").value==="Rest day"?"Rest":$("editDuration").value,
      time:$("editTime").value,
      status:$("editStatus").value
    };
    save("plan",plan);
    renderPlan();
    renderToday();
    $("scheduleMessage").textContent=day+" has been updated.";
  });

  $("resetPlan").addEventListener("click",()=>{
    if(!confirm("Reset your weekly timetable?"))return;
    plan=defaultPlan();
    save("plan",plan);
    renderPlan();
    renderToday();
  });

  function todayName() {
    return days[(new Date().getDay()+6)%7];
  }

  function renderToday() {
    const day=todayName();
    const item=plan[day];
    $("todayWorkout").innerHTML=`<div class="eyebrow">${day.toUpperCase()}</div><h3>${item.activity}</h3><p class="muted">${item.duration} · ${item.time} · ${item.status}</p>`;
    $("workoutTodayText").textContent=item.activity+" · "+item.duration;
    const saved=get("daily",{});
    $("overviewWorkout").textContent=(saved.date===todayKey()&&saved.workout?"1":"0")+"/1";
  }

  function renderExerciseGrid(filter) {
    const list=exercises.filter(e=>filter==="All"||e.cat===filter);
    $("exerciseGrid").innerHTML=list.map((e)=>{
      const index=exercises.indexOf(e);
      return `<button class="exercise-card" data-exercise="${index}"><span>EXERCISE 0${index+1}</span><h3>${e.name}</h3><p>${e.cat} · ${e.level}</p><p>${e.sets}</p>VIEW DETAILS ↗</button>`;
    }).join("");
    document.querySelectorAll("[data-exercise]").forEach(b=>b.addEventListener("click",()=>showExercise(Number(b.dataset.exercise))));
  }

  function showExercise(i) {
    const e=exercises[i];
    $("exerciseDetail").classList.remove("hidden");
    $("exerciseDetail").innerHTML=`<div class="eyebrow">${e.cat} · ${e.level}</div><h2>${e.name}</h2><h3>${e.sets}</h3><p>${e.steps}</p><p class="muted">Safety: ${e.tip} Stop if you feel pain.</p><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.search)}" target="_blank" rel="noopener">WATCH DEMONSTRATION VIDEO ↗</a>`;
    $("exerciseDetail").scrollIntoView({behavior:"smooth",block:"nearest"});
  }

  document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    renderExerciseGrid(b.dataset.filter);
  }));

  $("suggestWorkout").addEventListener("click",()=>{
    const suitable=exercises.filter(e=>user.level==="Advanced"||e.level===user.level||user.level==="Intermediate"&&e.level==="Beginner");
    const chosen=suitable[Math.floor(Math.random()*suitable.length)]||exercises[0];
    $("suggestion").textContent=`Suggested: ${chosen.name} · ${chosen.sets}. ${chosen.steps}`;
  });

  function renderTrackers() {
    $("waterValue").textContent=water+" / 8";
    $("overviewWater").textContent=water+"/8";
    $("waterBar").style.width=(water/8*100)+"%";
    $("overviewWaterBar").style.width=(water/8*100)+"%";

    $("mealChecks").innerHTML=meals.map(m=>`<label class="check-label"><input type="checkbox" class="check meal-check" data-meal="${m}" ${mealsDone.includes(m)?"checked":""}> ${m}</label>`).join("");
    $("mealCount").textContent=mealsDone.length+" of "+meals.length+" meals recorded.";
    document.querySelectorAll(".meal-check").forEach(c=>c.addEventListener("change",()=>{
      mealsDone=c.checked?[...mealsDone,c.dataset.meal]:mealsDone.filter(m=>m!==c.dataset.meal);
      saveDaily();renderTrackers();
    }));

    $("habitChecks").innerHTML=habits.map(h=>`<label class="check-label"><input type="checkbox" class="check habit-check" data-habit="${h}" ${habitsDone.includes(h)?"checked":""}> ${h}</label>`).join("");
    document.querySelectorAll(".habit-check").forEach(c=>c.addEventListener("change",()=>{
      habitsDone=c.checked?[...habitsDone,c.dataset.habit]:habitsDone.filter(h=>h!==c.dataset.habit);
      saveDaily();renderTrackers();
    }));

    const daily=get("daily",{});
    $("workoutDone").checked=daily.date===todayKey()&&!!daily.workout;
    $("workoutStatus").textContent=$("workoutDone").checked?"Workout completed!":"Mark this when you finish your session.";
    $("sleepHours").value=daily.date===todayKey()?daily.sleep||"":"";
    $("overviewSleep").textContent=(daily.date===todayKey()&&daily.sleep?daily.sleep:"0")+" h";
  }

  $("addWater").addEventListener("click",()=>{
    water=Math.min(8,water+1);saveDaily();renderTrackers();
  });
  $("resetWater").addEventListener("click",()=>{
    water=0;saveDaily();renderTrackers();
  });

  $("workoutDone").addEventListener("change",()=>{
    const daily=get("daily",{});
    daily.date=todayKey();daily.workout=$("workoutDone").checked;
    save("daily",daily);
    $("workoutStatus").textContent=daily.workout?"Workout completed!":"Workout marked incomplete.";
    renderToday();
  });

  $("saveSleep").addEventListener("click",()=>{
    const value=Number($("sleepHours").value);
    if(!Number.isFinite(value)||value<0||value>24){alert("Enter sleep hours from 0 to 24.");return;}
    const daily=get("daily",{});
    daily.date=todayKey();daily.sleep=value;
    save("daily",daily);
    $("sleepMessage").textContent="Sleep record saved.";
    renderTrackers();
  });

  $("saveWeight").addEventListener("click",()=>{
    const value=Number($("weightInput").value);
    if(!value||value<1||value>500){alert("Enter a valid weight.");return;}
    const history=get("weights",[]);
    history.unshift({date:new Date().toLocaleDateString(),weight:value});
    save("weights",history);
    $("weightInput").value="";
    renderWeights();
  });

  function renderWeights() {
    const history=get("weights",[]);
    $("weightHistory").innerHTML="<h3>Saved records</h3>"+(history.length?history.slice(0,10).map(x=>`<p>${x.date} — ${x.weight} kg</p>`).join(""):"<p class='muted'>No records yet.</p>");
  }

  $("saveWellness").addEventListener("click",()=>{
    save("wellness",{energy:$("energy").value,feeling:$("feeling").value});
    $("wellnessMessage").textContent="Your wellbeing check-in is saved.";
  });

  $("saveCycle").addEventListener("click",()=>{
    const start=$("periodStart").value,end=$("periodEnd").value;
    if(!start||!end||end<start){alert("Please enter valid cycle dates.");return;}
    save("cycle",{start,end});
    $("cycleMessage").textContent="Cycle dates saved on this device.";
  });

  $("saveGoal").addEventListener("click",()=>{
    user.goal=$("profileGoal").value;save("user",user);
    $("goalMessage").textContent="Your goal has been updated.";
    $("overviewGoal").textContent=user.goal.toUpperCase();
    $("helloText").textContent=`Welcome, ${user.name}. Your ${user.goal.toLowerCase()} journey continues.`;
  });

  function renderReminderFields() {
    const names=["Water","Breakfast","Lunch","Snack","Dinner","Workout","Sleep"];
    const defaults=["08:00","08:30","13:00","16:30","19:30","17:00","22:00"];
    const saved=get("reminders",{});
    $("reminderFields").innerHTML=names.map((name,i)=>`<label>${name} time</label><input type="time" class="reminder-time" data-reminder="${name}" value="${saved[name]||defaults[i]}">`).join("");
  }

  $("saveReminders").addEventListener("click",()=>{
    const times={};
    document.querySelectorAll(".reminder-time").forEach(input=>times[input.dataset.reminder]=input.value);
    save("reminders",times);
    $("reminderMessage").textContent="Your reminder schedule has been saved. This prototype stores the times but does not send reliable background alerts.";
  });
});