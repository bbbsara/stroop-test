let score = { correct: 0, wrong: 0, total: 0 };
let timerInterval;
let timeLeft;
let currentTrial = {};
let reactionTimes = { congruent: [], incongruent: [] };
let startTime;

function startTest() {
    const username = document.getElementById("username").value.trim();
    if (!username) {
        alert("الرجاء كتابة اسمك أولاً!");
        return;
    }

    score = { correct: 0, wrong: 0, total: 0 };
    reactionTimes = { congruent: [], incongruent: [] };
    timeLeft = CONFIG.TEST_DURATION;

    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("test-screen").classList.add("active");

    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
    nextTrial();
}

function updateTimer() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
        endTest();
    }
}

function updateTimerDisplay() {
    document.getElementById("timer").innerText = timeLeft;
}

function nextTrial() {
    const wordDisplay = document.getElementById("word-display");
    const optionsContainer = document.getElementById("options-container");

    const textObj = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    const colorObj = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];

    currentTrial = {
        isCongruent: textObj.name === colorObj.name,
        correctColorHex: colorObj.hex
    };

    wordDisplay.innerText = textObj.name;
    wordDisplay.style.color = colorObj.hex;

    optionsContainer.innerHTML = "";
    const shuffledColors = [...CONFIG.COLORS].sort(() => Math.random() - 0.5);

    shuffledColors.forEach(color => {
        const btn = document.createElement("button");
        btn.innerText = color.name;
        btn.className = "color-btn"; // سيأخذ التصميم الجديد الآن
        btn.onclick = () => handleAnswer(color.hex);
        optionsContainer.appendChild(btn);
    });

    startTime = Date.now();
}

function handleAnswer(selectedHex) {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    score.total++;
    
    if (selectedHex === currentTrial.correctColorHex) {
        score.correct++;
        if (currentTrial.isCongruent) {
            reactionTimes.congruent.push(timeTaken);
        } else {
            reactionTimes.incongruent.push(timeTaken);
        }
        document.body.style.backgroundColor = "#d4edda";
    } else {
        score.wrong++;
        document.body.style.backgroundColor = "#f8d7da";
    }

    setTimeout(() => {
        document.body.style.backgroundColor = "#e9ecef"; // نفس لون خلفية الـ CSS الجديد
    }, 100);

    nextTrial();
}

function endTest() {
    clearInterval(timerInterval);
    
    const allTimes = [...reactionTimes.congruent, ...reactionTimes.incongruent];
    const avgTime = allTimes.length > 0 
        ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) 
        : 0;

    const avgCongruent = reactionTimes.congruent.length > 0 
        ? reactionTimes.congruent.reduce((a, b) => a + b, 0) / reactionTimes.congruent.length 
        : 0;
    const avgIncongruent = reactionTimes.incongruent.length > 0 
        ? reactionTimes.incongruent.reduce((a, b) => a + b, 0) / reactionTimes.incongruent.length 
        : 0;
    
    let stroopEffect = 0;
    if (avgCongruent > 0 && avgIncongruent > 0) {
        stroopEffect = Math.round(avgIncongruent - avgCongruent);
    }

    document.getElementById("test-screen").classList.remove("active");
    document.getElementById("end-screen").classList.add("active");

    document.getElementById("score-correct").innerText = score.correct;
    document.getElementById("score-wrong").innerText = score.wrong;
    document.getElementById("score-total").innerText = score.total;
    document.getElementById("avg-time").innerText = avgTime;
    document.getElementById("stroop-effect").innerText = stroopEffect;

    sendDataToGoogleSheets(avgTime, stroopEffect);
}

function sendDataToGoogleSheets(avgTime, stroopEffect) {
    const statusElem = document.getElementById("save-status");
    statusElem.innerText = "جاري إرسال النتائج...";
    statusElem.style.color = "blue";

    const data = {
        name: document.getElementById("username").value,
        correct: score.correct,
        wrong: score.wrong,
        total: score.total,
        avgTime: avgTime,
        stroopEffect: stroopEffect
    };

    fetch(CONFIG.SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(() => {
        statusElem.innerText = "✅ تم حفظ النتائج بنجاح!";
        statusElem.style.color = "green";
    })
    .catch(err => {
        console.error(err);
        statusElem.innerText = "❌ حدث خطأ في الحفظ.";
        statusElem.style.color = "red";
    });
}
