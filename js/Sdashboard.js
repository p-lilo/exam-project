import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { db } from './config.js';

import { renderProfileContent } from './profile.js';

document.querySelector("#profileBtn").addEventListener("click", () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    renderProfileContent(user);
  }
});

  
    const examsLink = document.getElementById("showExams");
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const content = document.getElementById('content');
    const sidebarLinks = sidebar.querySelectorAll("a");
  
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      content.classList.toggle('shifted');
    });
  
    const name = localStorage.getItem("studentName");
    if (name) {
      document.getElementById("welcomemessage").textContent = `Welcome, ${name}!`;
    }
    // جزء اكنيف الزرار
  document.querySelectorAll(".sidebar a").forEach((button) => {
  button.addEventListener("click", () => {
 
    document.querySelectorAll(".sidebar a").forEach((btn) => btn.classList.remove("active"));

   
    button.classList.add("active");
  });
});

   
    examsLink.addEventListener("click", async (e) => {
      e.preventDefault();

   
      content.innerHTML = `<div class="pt-5 mt-4"><h2 class="mb-4">الامتحانات المتاحة</h2><div id="examsList" class="row gy-3"></div></div>`;
      const examsList = document.getElementById("examsList");

      try {
        const querySnapshot = await getDocs(collection(db, "exams"));
        querySnapshot.forEach((doc) => {
         
          const exam = doc.data();
            const examCard = document.createElement("div");
            examCard.className = "col-12 col-md-6";
            examCard.innerHTML = `
              <div class="card shadow-sm p-3">
                <h5 class="card-title">${exam.name}</h5>
                <button class="toexam btn btn-primary" data-id="${doc.id}">start exam</button>
              </div>
            `;
            examsList.appendChild(examCard);
          
        });
      } catch (error) {
        console.error("Error fetching exams:", error);
        examsList.innerHTML = `<p class="text-danger">حدث خطأ أثناء تحميل الامتحانات.</p>`;
      }

     
    });

    // toexam function
    document.addEventListener("click", function (e) {
  const btn = e.target.closest(".toexam");
  if (btn) {
    const examId = btn.getAttribute("data-id");
    window.location.href = `./theexams.html?id=${examId}`;
  }
});
