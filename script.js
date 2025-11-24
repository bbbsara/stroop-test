let timer;
let timeLeft = TEST_DURATION;

let correct = 0;
let wrong = 0;
let total = 0;

let currentColor;
let startTime;

const startScreen = document.getElementById("start-screen");
const testScreen = document.getElementById("test-screen");
const endScreen = document.getElementById("end-screen");

const usernameInput = document.getElementById("username");
const timeLabel = document.getElementById("time");
const cardWord = document.getElementById("color-word");

document.getElementById("start-btn").onclick = startTest;
document.getElementById("restart-btn").onclick = () => location.reload();

document.querySelectorAll(".color-btn").forEach(btn => {
    btn.onclick = () => checkAnswer(btn.dataset.color);
});

function startTest() {
    if (usernameInput.value.trim() === "") {
        alert("رجاءً اكتب الاسم قبل البدء");
        return;
    }

    startScreen.classList.add("hidden");
    testScreen.classList.remove("hidden");

    nextWord();

    timer = setInterval(() => {
        timeLeft--;
        timeLabel.innerText = timeLeft;

        if (timeLeft <= 0) finishTest();

    }, 1000);
}

function nextWord() {
    const randomText = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    currentColor = randomColor.code;

    cardWord.innerText = randomText.name;
    cardWord.style.color = randomColor.code;

    startTime = performance.now();
}

function checkAnswer(chosenColor) {
    const rt = performance.now() - startTime;

    total++;

    if (chosenColor === currentColor) correct++;
    else wrong++;

    // إرسال كل محاولة مباشرة
    sendAttempt(rt, chosenColor === currentColor);

    nextWord();
}

function finishTest() {
    clearInterval(timer);

    testScreen.classList.add("hidden");
    endScreen.classList.remove("hidden");

    document.getElementById("correct-count").innerText = correct;
    document.getElementById("wrong-count").innerText = wrong;
    document.getElementById("total-count").innerText = total;

    sendSummary();
}

// إرسال كل محاولة
function sendAttempt(rt, isCorrect) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            type: "attempt",
            user: usernameInput.value,
            rt: Math.round(rt),
            correct: isCorrect ? 1 : 0
        })
    });
}

// إرسال ملخص الاختبار
function sendSummary() {
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            type: "summary",
            user: usernameInput.value,
            correct,
            wrong,
            total,
        })
    });
}
