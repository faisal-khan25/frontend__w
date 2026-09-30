import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function getFirebaseErrorMessage(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/invalid-email":
      return "Enter a valid email address";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/missing-password":
      return "Password is required";
    
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/user-disabled":
      return "This account has been disabled. Contact your administrator";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again";

    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled";
    case "auth/cancelled-popup-request":
      return "Sign-in already in progress";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for Google sign-in";

    default:
      return "Something went wrong. Please try again";
  }
}


export async function registerWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}


export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}


export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider());
  return credential.user;
}


export function logoutFirebase() {
  return signOut(auth);
}


export function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}


export function getIdToken(user, forceRefresh = false) {
  return user.getIdToken(forceRefresh);
}
