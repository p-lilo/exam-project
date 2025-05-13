import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { db } from "./config.js";

let currentUser = null;  // تعريف المتغير لتخزين المستخدم الحالي
let examId = null;
let examName = "";
let countdownInterval;
let savedQuestions = [];
let questionsArray = [];
let answers = [];

const mainContent = document.getElementById("mainContentexam");
const sideList = document.getElementById("sideList");
const clockElement = document.getElementById("clock");
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    
    currentUser = user;
    loadQuestions();  
  } else {
    // لو المستخدم مش مسجل الدخول
    alert("لم يتم تسجيل الدخول. من فضلك قم بتسجيل الدخول أولاً.");
    window.location.href = "../login.html"; 
  }
});

async function loadQuestions() {
  if (!currentUser || !currentUser.uid) {
    alert("لم يتم تسجيل الدخول. من فضلك قم بتسجيل الدخول أولاً.");
    window.location.href = "../login.html";  // إعادة التوجيه لصفحة تسجيل الدخول
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  examId = urlParams.get('id');
  const examStartedKey = `examStarted_${examId}`;

  const examDoc = await getDoc(doc(db, "exams", examId));
  if (examDoc.exists()) {
    const examData = examDoc.data();
    examName = examData.name;

    // ✅ حماية من إعادة التحميل أو الرجوع
    if (sessionStorage.getItem(examStartedKey)) {
      await autoSubmitZero("تم اعتبار الامتحان مكتمل بسبب الرجوع أو إعادة التحميل");
      return;
    }
    sessionStorage.setItem(examStartedKey, "true");

    // حساب الوقت
    let durationMinutes = examData.duration || 30;
    let totalSeconds = durationMinutes * 60;

    function updateClockDisplay(secondsLeft) {
      const hours = Math.floor(secondsLeft / 3600);
      const minutes = Math.floor((secondsLeft % 3600) / 60);
      const seconds = secondsLeft % 60;
      clockElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateClockDisplay(totalSeconds);

    countdownInterval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds >= 0) {
        updateClockDisplay(totalSeconds);
      } else {
        clearInterval(countdownInterval);
        alert("انتهى وقت الامتحان ⏰");
        calculateScore();
      }
    }, 1000);

  } else {
    alert("الامتحان غير موجود في قاعدة البيانات.");
    return;
  }

  // التأكد من أن المستخدم لم يسبق له إجابة على هذا الامتحان
  const resultDoc = await getDoc(doc(db, "users", currentUser.uid, "results", examId));
  if (resultDoc.exists()) {
    alert("لقد أجبت على هذا الامتحان سابقًا. يمكنك مشاهدة نتيجتك في قسم النتائج.");
    window.location.href = "../Sdashboard.html";
    return;
  }

  const querySnapshot = await getDocs(collection(db, "exams", examId, "questions"));
  // تحويل البيانات من Firestore لمصفوفة
questionsArray = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

// عمل Shuffle عشوائي لترتيب الأسئلة
questionsArray = shuffleArray(questionsArray);


  if (questionsArray.length === 0) {
    mainContent.innerHTML = "<p>لا يوجد أسئلة.</p>";
    return;
  }

  renderSideList();
  renderQuestion(0);  // عرض السؤال الأول
}
// ع يغير ترتيب الاساله
function shuffleArray(array) {
  let shuffled = array.slice(); 
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


// ع ميرجعش لورا
window.history.pushState(null, null, window.location.href);
window.onbeforeunload = function () {
  return "هل أنت متأكد أنك تريد مغادرة هذه الصفحة؟ سيتم اعتبار الامتحان غير مكتمل.";
};

window.onpopstate = async function () {
  const confirmExit = confirm("هل أنت متأكد أنك تريد الرجوع؟ سيتم اعتبار الامتحان غير مكتمل.");
  if (confirmExit) {
    await autoSubmitZero("تم اعتبار الامتحان مكتمل بسبب الرجوع أو إعادة التحميل");
  } else {
    history.pushState(null, null, window.location.href);
  }
};

async function autoSubmitZero(message) {
  clearInterval(countdownInterval);
  await setDoc(doc(db, "users", currentUser.uid, "results", examId), {
    examId,
    examName,
    score: 0,
    totalScore: questionsArray.length * 10,
    answers: [],
    submittedAt: new Date(),
    userEmail: currentUser.email,
    autoSubmitted: true,
  });
  sessionStorage.removeItem(`examStarted_${examId}`);
  alert(message);
  window.location.href = "../Sdashboard.html";
}

function renderSideList() {
  sideList.innerHTML = "";
  questionsArray.forEach((q, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `السؤال ${index + 1}`;
    
    const saveIcon = document.createElement("i");
    saveIcon.className = `bi ${savedQuestions.includes(q.id) ? 'bi-bookmark-fill' : 'bi-bookmark'}`;
    saveIcon.style.cursor = "pointer";
    saveIcon.onclick = () => toggleSaveQuestion(q.id);

    li.appendChild(saveIcon);
    li.onclick = () => {
      renderQuestion(index);
    };
    sideList.appendChild(li);
  });
}

function toggleSaveQuestion(questionId) {
  const index = savedQuestions.indexOf(questionId);
  if (index === -1) {
    savedQuestions.push(questionId);
  } else {
    savedQuestions.splice(index, 1);
  }
  renderSideList();
}

function renderQuestion(index) {
  const q = questionsArray[index];
  const isSaved = savedQuestions.includes(q.id);
  
  mainContent.innerHTML = `
    <div class="card question-card">
      <div class="card-body text-center">
        <h5 class="card-title mb-4">السؤال ${index + 1} ${isSaved ? '<span class="badge bg-warning">محفوظ</span>' : ''}</h5>
        <p class="card-text mb-4">${q.questionText}</p>
        ${q.choices.map((choice, i) => {
          const isChecked = answers.some(answer => answer.questionId === q.id && answer.answer === choice);
          return `
            <div class="form-check text-start">
              <input class="form-check-input" type="radio" name="q${q.id}" id="opt${q.id}-${i}" value="${choice}" ${isChecked ? 'checked' : ''}>
              <label class="form-check-label" for="opt${q.id}-${i}">${String.fromCharCode(65 + i)}. ${choice}</label>
            </div>
          `;
        }).join("")}
        <button class="btn btn-primary mt-3" id="nextBtn">${index === questionsArray.length - 1 ? 'إنهاء' : 'التالي'}</button>
      </div>
    </div>
  `;

  document.querySelectorAll(`input[name="q${q.id}"]`).forEach(input => {
    input.addEventListener('change', () => saveAnswer(q.id));
  });

  document.getElementById("nextBtn").onclick = () => {
    if (index < questionsArray.length - 1) {
      renderQuestion(index + 1);
    } else {
      confirmSubmit();
    }
  };

  if (isSaved) {
    
    alert("لقد وضعت علامة على سؤال رقم " + (index + 1));
  }


  const goToSavedBtn = document.getElementById("goToSavedBtn");
  goToSavedBtn.style.display = savedQuestions.length > 0 ? 'block' : 'none';
  goToSavedBtn.onclick = () => {
    displaySavedQuestions();
  };
}

// ع اعرض الاساله المحفوظه
function displaySavedQuestions() {
  const savedQuestionsList = savedQuestions.map(qid => {
    const question = questionsArray.find(q => q.id === qid);
    return `
      <li class="list-group-item">
        <span>السؤال: ${question ? question.questionText : "السؤال غير موجود"}</span>
      </li>
    `;
  }).join("");

  mainContent.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">الأسئلة المحفوظة</h5>
        <ul class="list-group">
          ${savedQuestionsList || "<li class='list-group-item'>لا توجد أسئلة محفوظة</li>"}
        </ul>
      </div>
    </div>
  `;
}
//فانكشن حفظ اساله اليوزر
function saveAnswer(questionId) {
  const selectedChoice = document.querySelector(`input[name="q${questionId}"]:checked`);
  if (selectedChoice) {
    const answer = selectedChoice.value;
    const existingAnswerIndex = answers.findIndex(ans => ans.questionId === questionId);
    if (existingAnswerIndex !== -1) {
      answers[existingAnswerIndex].answer = answer;
    } else {
      answers.push({ questionId, answer });
    }
  }
}
// ع يتاكد قبل ما يسلم
function confirmSubmit() {
  if (savedQuestions.length > 0) {
    const confirmSaved = confirm(`لديك ${savedQuestions.length} سؤال عليه علامة "محفوظ". هل أنت متأكد أنك تريد تسليم الامتحان بدون مراجعتها؟`);
    if (confirmSaved) {
      calculateScore();
    }
  } else {
    const confirmSubmit = confirm("هل أنت متأكد أنك تريد تسليم الامتحان؟");
    if (confirmSubmit) {
      calculateScore();
    }
  }
}
// ع حساب النتيجه
async function calculateScore() {
  clearInterval(countdownInterval);
  let score = 0;

  questionsArray.forEach(q => {
    const userAnswer = answers.find(ans => ans.questionId === q.id);
    if (userAnswer) {
      const userAnswerIndex = q.choices.indexOf(userAnswer.answer);
      if (userAnswerIndex === q.correctIndex) {
        score += 10;
      }
    }
  });

  const totalScore = questionsArray.length * 10;

  await setDoc(doc(db, "users", currentUser.uid, "results", examId), {
    examId,
    examName,
    score,
    totalScore,
    answers,
    submittedAt: new Date(),
    userEmail: currentUser.email
  });

  sessionStorage.removeItem(`examStarted_${examId}`);
  alert("تم تسليم الامتحان بنجاح ✅");
  window.location.href = "../Sdashboard.html";
}
