let timer;
let timeLeft = TEST_DURATION;
let correct = 0;
let wrong = 0;
let total = 0;
let startTime = 0;
let reactionTimes = [];

function startTest() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("test-screen").style.display = "block";

    timeLeft = TEST_DURATION;
    correct = 0;
    wrong = 0;
    total = 0;
    reactionTimes = [];

    document.getElementById("timer").innerText = timeLeft;

    nextWord();
    timer = setInterval(countDown, 1000);
}

function countDown() {
    timeLeft--;
    document.getElementById("timer").innerText = timeLeft;

    if (timeLeft <= 0) {
        clearInterval(timer);
        endTest();
    }
}

function nextWord() {
    const randomColorWord = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomInkColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    document.getElementById("word").innerText = randomColorWord.name;
    document.getElementById("word").style.color = randomInkColor.code;

    document.getElementById("options").innerHTML = "";

    COLORS.forEach(color => {
        const btn = document.createElement("button");
        btn.innerText = color.name;
        btn.className = "option-btn";
        btn.onclick = () => checkAnswer(color.name, randomInkColor.name);
        document.getElementById("options").appendChild(btn);
    });

    startTime = Date.now();
}

function checkAnswer(selectedName, correctInkName) {
    total++;

    let reactionTime = Date.now() - startTime;
    reactionTimes.push(reactionTime);

    if (selectedName === correctInkName) {
        correct++;
    } else {
        wrong++;
    }

    nextWord();
}

function endTest() {
    document.getElementById("test-screen").style.display = "none";
    document.getElementById("result-screen").style.display = "block";

    let avgTime = reactionTimes.length
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    document.getElementById("result-correct").innerText = correct;
    document.getElementById("result-wrong").innerText = wrong;
    document.getElementById("result-total").innerText = total;
    document.getElementById("result-time").innerText = avgTime;

    sendToGoogle(correct, wrong, total, avgTime);
}

function sendToGoogle(correct, wrong, total, avgTime) {
    const name = document.getElementById("username").value || "بدون اسم";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name,
            correct: correct,
            wrong: wrong,
            total: total,
            avgTime: avgTime,
            timestamp: new Date().toISOString()
        })
    });
}
