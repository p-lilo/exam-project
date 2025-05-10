import { auth, db } from "./config.js";
import {
  collection,
  addDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const questions = [];

document.getElementById('addQuestion').addEventListener('click', () => {
  const questionText = document.getElementById('question').value.trim();
  const choices = [
    document.getElementById('choice1').value.trim(),
    document.getElementById('choice2').value.trim(),
    document.getElementById('choice3').value.trim(),
    document.getElementById('choice4').value.trim()
  ];
  const correctIndex = parseInt(document.getElementById('correctIndex').value) - 1;

  if (!questionText || choices.includes("") || isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    alert('Please enter all fields correctly. Correct answer must be between 1 and 4.');
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
    questionDiv.classList.add('alert', 'alert-secondary');
    questionDiv.innerHTML = `
      <strong>Q${index + 1}:</strong> ${q.questionText}
      <ul>
        ${q.choices.map(choice => `<li>${choice}</li>`).join('')}
      </ul>
      <strong>Correct Answer:</strong> ${q.choices[q.correctIndex]}
    `;
    questionListDiv.appendChild(questionDiv);
  });
}

function clearFields() {
  document.getElementById('question').value = '';
  document.getElementById('choice1').value = '';
  document.getElementById('choice2').value = '';
  document.getElementById('choice3').value = '';
  document.getElementById('choice4').value = '';
  document.getElementById('correctIndex').value = '';
}

document.getElementById('finishExam').addEventListener('click', async () => {
  const examName = document.getElementById('examName').value.trim();
  const isAvailable = document.getElementById('available').checked;
  const timeValue = document.getElementById('duration').value;

  if (!examName || questions.length === 0 || !timeValue) {
    alert('Please enter exam title, duration, and at least one question.');
    return;
  }

  const [hours, minutes] = timeValue.split(':').map(Number);
  const duration = hours * 60 + minutes;

  try {
    const examRef = await addDoc(collection(db, "exams"), {
      name: examName,
      duration: duration,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid ?? "anonymous",
      isAvailable
    });

    const examId = examRef.id;
    await updateDoc(examRef, { id: examId });

    for (const question of questions) {
      const questionRef = await addDoc(collection(db, "exams", examId, "questions"), {
        questionText: question.questionText,
        choices: question.choices,
        correctIndex: question.correctIndex,
        createdAt: serverTimestamp()
      });

      await updateDoc(questionRef, { id: questionRef.id });
    }
    alert("the exam has sent sucussfully");

    // تفريغ الحقول
    document.getElementById('examName').value = '';
    document.getElementById('duration').value = '';
    document.getElementById('available').checked = false;
    questions.length = 0;
    displayQuestions();
  } catch (error) {
    console.error("Error saving exam:", error);
    alert("An error occurred while saving the exam.");
  }
});







