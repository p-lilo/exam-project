
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { auth, db } from "./config.js";



export const login = async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // get user data
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const username = userDoc.data().username;
      localStorage.setItem("studentName", username);
    }

    alert("تم تسجيل الدخول!");
    window.location.href = "choose.html";
  } catch (error) {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    alert("خطأ في تسجيل الدخول: " + error.message);
  }
};


export const signUp = async (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.querySelectorAll("input[type='password']")[1].value;

  localStorage.setItem('studentName', username);

  if (password !== confirmPassword) {
    alert("كلمة المرور غير متطابقة!");
    return;
  }
  if (!username || !email || !password) {
    alert("من فضلك أدخل كل البيانات!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: username,
      email: email,
      createdAt: new Date(),
    });

    alert("تم إنشاء الحساب بنجاح!");
    window.location.href = "index.html";
  } catch (error) {
    alert("حدث خطأ: " + error.message);
  }
};
