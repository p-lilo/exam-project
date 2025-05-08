
import { auth, db } from "./js/config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";


const questions = [];

document.getElementById('addQuestion').addEventListener('click', () => {
  const questionText = document.getElementById('question').value;
  const choices = [
    document.getElementById('choice0').value,
    document.getElementById('choice1').value,
    document.getElementById('choice2').value,
    document.getElementById('choice3').value
  ];
  const correctIndex = parseInt(document.getElementById('correctIndex').value) - 1;

  if (!questionText || choices.includes("") || isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    alert('من فضلك أدخل جميع البيانات بشكل صحيح');
    return;
  }

  questions.push({ questionText, choices, correctIndex });
  displayQuestions();
  clearFields();
});

function displayQuestions() {
  const questionListDiv = document.getElementById('questionList');
  questionListDiv.innerHTML = '';
  questions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question-item');
    questionDiv.innerHTML = `
      <strong>سؤال ${index + 1}:</strong> ${q.questionText}
      <ul>
        ${q.choices.map((choice, idx) => `
          <li style="color: ${idx === q.correctIndex ? 'green' : 'black'}">${choice}</li>
        `).join('')}
      </ul>
    `;
    questionListDiv.appendChild(questionDiv);
  });
}

function clearFields() {
  document.getElementById('question').value = '';
  document.getElementById('choice0').value = '';
  document.getElementById('choice1').value = '';
  document.getElementById('choice2').value = '';
  document.getElementById('choice3').value = '';
  document.getElementById('correctIndex').value = '';
}

document.getElementById('finishExam').addEventListener('click', async () => {
  const examName = document.getElementById('examName').value.trim();
  
  if (!examName || questions.length === 0) {
    alert('من فضلك أدخل اسم الامتحان وأضف أسئلة');
    return;
  }

  try {
    // حفظ الامتحان في Firestore
    const examRef = await addDoc(collection(db, "exams"), {
      name: examName,
      createdAt: new Date(),
      createdBy: auth.currentUser.uid
    });

    // إضافة الأسئلة إلى Firestore
    for (const question of questions) {
      await addDoc(collection(db, `exams/${examRef.id}/questions`), {
        questionText: question.questionText,
        choices: question.choices,
        correctIndex: question.correctIndex,
        createdAt: new Date()
      });
    }

    alert('تم حفظ الامتحان بنجاح!');
    // إعادة تهيئة
    document.getElementById('examName').value = '';
    questions.length = 0;
    displayQuestions();
  } catch (error) {
    console.error("خطأ أثناء حفظ البيانات: ", error);
    alert('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
  }
});

 