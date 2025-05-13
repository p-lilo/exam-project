import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { db } from "./config.js";

const auth = getAuth();

document.querySelector("#profileBtn").addEventListener("click", renderProfileContent);

export async function renderProfileContent() {
  document.getElementById("content").innerHTML = `
    <div class="container mt-5" id="profileContent">
      <div class="card p-4 shadow">
        <div class="d-flex align-items-center">
          <img src="imgs/stdlogo.png" class="rounded-circle me-3" width="100" height="100" alt="صورة الطالب" id="profilePic">
          <div>
            <h4 id="studentName">اسم الطالب</h4>
            <p id="studentEmail">student@example.com</p>
          </div>
        </div>
        <hr />
        <p><strong>تاريخ التسجيل:</strong> <span id="registrationDate"></span></p>
        <p><strong>عدد الامتحانات:</strong> <span id="examCount">0</span></p>
        <p><strong>إجمالي الدرجات:</strong> <span id="totalScore">0</span></p>

      </div>
      <div class="text-center mt-4">
  <button id="logoutBtn" class="btn btn-danger">تسجيل الخروج</button>
</div>

    </div>
  `;

 
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      document.getElementById("studentName").textContent = user.displayName || "طالب";
      document.getElementById("studentEmail").textContent = user.email;
      document.getElementById("registrationDate").textContent = new Date(user.metadata.creationTime).toLocaleDateString();

      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

       
        document.getElementById("studentName").textContent = userData.username|| user.displayName || "طالب";

        
        const resultsRef = collection(userRef, "results");
        const resultsSnapshot = await getDocs(resultsRef);

        let totalScore = 0;
        let examCount = resultsSnapshot.size; 


        resultsSnapshot.forEach(doc => {
          const resultData = doc.data();
          totalScore += resultData.score || 0;
        });

       
        document.getElementById("examCount").textContent = examCount;
        document.getElementById("totalScore").textContent = totalScore;
      } else {
        console.log("No such user!");
        window.location.href = "../signup.html";
      }
    } else {
      window.location.href = "../signup.html";
    }
  });
  document.getElementById("logoutBtn").addEventListener("click", logoutUser);
}
function logoutUser() {
  if(confirm("هل أنت متأكد من تسجيل الخروج؟")){
    auth.signOut().then(() => {
      alert("تم تسجيل الخروج بنجاح");
      window.location.href = "../index.html";
    }).catch((error) => {
      console.error("خطأ أثناء تسجيل الخروج:", error);
      alert("حدث خطأ أثناء تسجيل الخروج");
    });
  }
}
