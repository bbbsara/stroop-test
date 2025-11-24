// متغيرات عامة لإدارة حالة الاختبار
let score = { correct: 0, wrong: 0, total: 0 };
let timerInterval;
let timeLeft;
let currentTrial = {}; // لتخزين تفاصيل المحاولة الحالية
let reactionTimes = { congruent: [], incongruent: [] }; // لتخزين الأزمنة وحساب تأثير ستروب
let startTime; // وقت ظهور الكلمه

// بدء الاختبار
function startTest() {
    const username = document.getElementById("username").value.trim();
    if (!username) {
        alert("الرجاء كتابة اسمك أولاً!");
        return;
    }

    // تصفير النتائج
    score = { correct: 0, wrong: 0, total: 0 };
    reactionTimes = { congruent: [], incongruent: [] };
    timeLeft = CONFIG.TEST_DURATION;

    // تبديل الشاشات
    document.getElementById("start-screen").classList.remove("active");
    document.getElementById("test-screen").classList.add("active");

    // بدء المؤقت واللعبة
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
    nextTrial();
}

// إدارة المؤقت
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

// الانتقال للمحاولة التالية (ظهور كلمة جديدة)
function nextTrial() {
    const wordDisplay = document.getElementById("word-display");
    const optionsContainer = document.getElementById("options-container");

    // اختيار لون وكلمة عشوائياً
    // 1. نختار "نص" الكلمة
    const textObj = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];
    // 2. نختار "لون" الكلمة
    const colorObj = CONFIG.COLORS[Math.floor(Math.random() * CONFIG.COLORS.length)];

    // تحديد هل الحالة متطابقة (Congruent) أم لا (Incongruent) لحساب تأثير ستروب
    currentTrial = {
        isCongruent: textObj.name === colorObj.name,
        correctColorHex: colorObj.hex
    };

    // عرض الكلمة
    wordDisplay.innerText = textObj.name;
    wordDisplay.style.color = colorObj.hex;

    // إنشاء الأزرار (نخلط الألوان حتى لا تكون بنفس الترتيب دائماً)
    optionsContainer.innerHTML = "";
    const shuffledColors = [...CONFIG.COLORS].sort(() => Math.random() - 0.5);

    shuffledColors.forEach(color => {
        const btn = document.createElement("button");
        btn.innerText = color.name;
        btn.className = "color-btn";
        // عند الضغط، نرسل كود اللون المختار (Hex)
        btn.onclick = () => handleAnswer(color.hex);
        optionsContainer.appendChild(btn);
    });

    // بدء حساب وقت رد الفعل لهذه المحاولة
    startTime = Date.now();
}

// معالجة إجابة المستخدم
function handleAnswer(selectedHex) {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    // تسجيل البيانات
    score.total++;
    
    if (selectedHex === currentTrial.correctColorHex) {
        score.correct++;
        // نضيف الزمن للقائمة المناسبة (متطابق أو غير متطابق) فقط للإجابات الصحيحة
        if (currentTrial.isCongruent) {
            reactionTimes.congruent.push(timeTaken);
        } else {
            reactionTimes.incongruent.push(timeTaken);
        }
        
        // وميض أخضر سريع للخلفية
        document.body.style.backgroundColor = "#d4edda";
    } else {
        score.wrong++;
        // وميض أحمر سريع للخلفية
        document.body.style.backgroundColor = "#f8d7da";
    }

    // إعادة لون الخلفية والذهاب للتالي
    setTimeout(() => {
        document.body.style.backgroundColor = "#f0f2f5";
    }, 100);

    nextTrial();
}

// إنهاء الاختبار وحساب النتائج
function endTest() {
    clearInterval(timerInterval);
    
    // حساب المتوسطات
    const allTimes = [...reactionTimes.congruent, ...reactionTimes.incongruent];
    const avgTime = allTimes.length > 0 
        ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length) 
        : 0;

    // حساب تأثير ستروب (الفرق بين متوسط زمن غير المتطابق والمتطابق)
    const avgCongruent = reactionTimes.congruent.length > 0 
        ? reactionTimes.congruent.reduce((a, b) => a + b, 0) / reactionTimes.congruent.length 
        : 0;
    const avgIncongruent = reactionTimes.incongruent.length > 0 
        ? reactionTimes.incongruent.reduce((a, b) => a + b, 0) / reactionTimes.incongruent.length 
        : 0;
    
    // إذا لم يكن هناك بيانات كافية، نضع القيمة صفر
    let stroopEffect = 0;
    if (avgCongruent > 0 && avgIncongruent > 0) {
        stroopEffect = Math.round(avgIncongruent - avgCongruent);
    }

    // عرض النتائج على الشاشة
    document.getElementById("test-screen").classList.remove("active");
    document.getElementById("end-screen").classList.add("active");

    document.getElementById("score-correct").innerText = score.correct;
    document.getElementById("score-wrong").innerText = score.wrong;
    document.getElementById("score-total").innerText = score.total;
    document.getElementById("avg-time").innerText = avgTime;
    document.getElementById("stroop-effect").innerText = stroopEffect;

    // إرسال البيانات إلى Google Sheets
    sendDataToGoogleSheets(avgTime, stroopEffect);
}

// دالة الإرسال إلى السيرفر
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
        stroopEffect: stroopEffect // نرسل القيمة الجديدة
    };

    fetch(CONFIG.SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // مهم جداً لتجاوز سياسات المتصفح
        headers: {
            "Content-Type": "application/json"
        },
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
