import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { db } from './config.js';

const resultsLink = document.getElementById("showResults");
const content = document.getElementById("content");
const sidebarLinks = document.querySelectorAll("#sidebar a");

resultsLink.addEventListener("click", (e) => {
  e.preventDefault();

  content.innerHTML = `
    <div class="pt-5 mt-4">
      <h2 class="mb-4">نتائجي</h2>
      <div id="resultsContainer" class="row gy-3"></div>
    </div>
  `;

  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      content.innerHTML = "<p class='text-danger'>يجب تسجيل الدخول أولاً</p>";
      return;
    }

    const resultsRef = collection(db, "users", user.uid, "results");
    const querySnapshot = await getDocs(resultsRef);
    const resultsContainer = document.getElementById("resultsContainer");

    if (querySnapshot.empty) {
      resultsContainer.innerHTML = "<p class='text-center'>لا توجد نتائج بعد.</p>";
      return;
    }

    querySnapshot.forEach(async (resultDoc) => {
      const resultData = resultDoc.data();
      const examId = resultData.examId;
      const examDoc = await getDoc(doc(db, "exams", examId));
      const examName = examDoc.exists() ? examDoc.data().name : "امتحان غير معروف";
      const submittedDate = resultData.submittedAt?.toDate().toLocaleString('ar-EG') || "غير معروف";

      const card = document.createElement("div");
      card.className = "col-12 col-md-6";
      card.innerHTML = `
        <div class="card shadow-sm result-card p-3">
          <h5>${examName}</h5>
          <p class="text-muted mb-1">تم التسليم: ${submittedDate}</p>
          <button class="btn btn-outline-primary toggle-btn">عرض النتيجة</button>
          <div class="result-details mt-3" style="display: none;">
            <p><strong>الدرجة:</strong> ${resultData.score} من ${resultData.totalScore}</p>
            <p><strong>النسبة:</strong> ${((resultData.score / resultData.totalScore) * 100).toFixed(2)}%</p>
            <p><strong>عدد الإجابات:</strong> ${resultData.answers?.length || 0}</p>
            <p><strong>تم التسليم تلقائي؟</strong> ${resultData.autoSubmitted ? "نعم" : "لا"}</p>
          </div>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  });
});


document.addEventListener("click", (e) => {
  if (e.target.classList.contains("toggle-btn")) {
    const btn = e.target;
    const details = btn.nextElementSibling;
    const isVisible = details.style.display === "block";
    details.style.display = isVisible ? "none" : "block";
    btn.textContent = isVisible ? "عرض النتيجة" : "إخفاء النتيجة";
  }
});
