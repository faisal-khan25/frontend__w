import { api } from "../lib/api";


let firebaseAuthServicePromise;
function loadFirebaseAuthService() {
  if (!firebaseAuthServicePromise) {
    firebaseAuthServicePromise = import("../firebase/authService");
  }
  return firebaseAuthServicePromise;
}


function toFriendlyError(getFirebaseErrorMessage, error) {
  const wrapped = new Error(getFirebaseErrorMessage(error));
  wrapped.code = error?.code;
  wrapped.friendlyMessage = wrapped.message;
  return wrapped;
}


export async function signup({ firstName, lastName, email, password, confirmPassword, department }) {
  if (password !== confirmPassword) {
    const err = new Error("Passwords do not match");
    err.friendlyMessage = err.message;
    throw err;
  }

  const { registerWithEmail, getIdToken, getFirebaseErrorMessage } = await loadFirebaseAuthService();

  let firebaseUser;
  try {
    firebaseUser = await registerWithEmail(email, password);
  } catch (error) {
    throw toFriendlyError(getFirebaseErrorMessage, error);
  }

  try {
    const idToken = await getIdToken(firebaseUser);
    const { data } = await api.post("/auth/firebase/register", {
      idToken,
      firstName,
      lastName,
      department,
    });
    return data; 
  } catch (error) {
    
    await firebaseUser.delete().catch(() => {});
    throw error;
  }
}

export async function login({ email, password }) {
  const { loginWithEmail, getIdToken, getFirebaseErrorMessage } = await loadFirebaseAuthService();

  let firebaseUser;
  try {
    firebaseUser = await loginWithEmail(email, password);
  } catch (error) {
    throw toFriendlyError(getFirebaseErrorMessage, error);
  }

  const idToken = await getIdToken(firebaseUser);
  const { data } = await api.post("/auth/firebase/login", { idToken });
  return data; 
}


export async function loginWithGoogle() {
  const { loginWithGoogle: firebaseLoginWithGoogle, getIdToken, getFirebaseErrorMessage } =
    await loadFirebaseAuthService();

  let firebaseUser;
  try {
    firebaseUser = await firebaseLoginWithGoogle();
  } catch (error) {
    if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
      const cancelled = new Error("Sign-in was cancelled");
      cancelled.code = error.code;
      cancelled.cancelled = true;
      throw cancelled;
    }
    throw toFriendlyError(getFirebaseErrorMessage, error);
  }

  const idToken = await getIdToken(firebaseUser);
  const { data } = await api.post("/auth/firebase/login", { idToken });
  return data;
}

export async function logout() {
  
  const { logoutFirebase } = await loadFirebaseAuthService();
  await logoutFirebase().catch(() => {});
}

export async function forgotPassword(email) {
  const { sendReset, getFirebaseErrorMessage } = await loadFirebaseAuthService();
  try {
    await sendReset(email);
  } catch (error) {
  
    if (error?.code === "auth/invalid-email" || error?.code === "auth/too-many-requests") {
      throw toFriendlyError(getFirebaseErrorMessage, error);
    }
  }
  return {
    success: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };
}

export async function refreshToken(refreshTokenValue) {
  const { data } = await api.post("/auth/refresh-token", { refreshToken: refreshTokenValue });
  return data;
}


export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}



export async function verifyOTP({ email, otp }) {
  const { data } = await api.post("/auth/verify-otp", { email, otp });
  return data; 
}

export async function resetPassword({ resetToken, newPassword, confirmPassword }) {
  const { data } = await api.post("/auth/reset-password", {
    resetToken,
    newPassword,
    confirmPassword,
  });
  return data; 
}


// Change password for the logged-in user (Settings > Change Password).
// Login is Firebase-based, so for users with a Firebase email/password session
// the password must be changed in Firebase. Users without one (legacy accounts
// that only have a password stored in the HRMS database) use the existing
// backend endpoint: POST /profile/change-password.
export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const fb = await loadFirebaseAuthService();

  if (fb.hasFirebasePasswordSession()) {
    try {
      await fb.changeFirebasePassword(currentPassword, newPassword);
    } catch (error) {
      const wrongPassword = ["auth/wrong-password", "auth/invalid-credential"].includes(error?.code);
      const err = new Error(
        wrongPassword ? "Current password is incorrect" : fb.getFirebaseErrorMessage(error)
      );
      err.friendlyMessage = err.message;
      err.code = error?.code;
      throw err;
    }
    return { success: true, message: "Password changed successfully" };
  }

  const { changePassword: changePasswordApi } = await import("./profileService");
  try {
    return await changePasswordApi({ currentPassword, newPassword, confirmPassword });
  } catch (error) {
    const msg = error.response?.data?.error;
    if (msg) error.friendlyMessage = msg;
    throw error;
  }
}