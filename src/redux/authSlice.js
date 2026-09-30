import { createSlice } from "@reduxjs/toolkit";

const storedToken = localStorage.getItem("token");
const storedRefreshToken = localStorage.getItem("refreshToken");
const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  refreshToken: storedRefreshToken || null,
  role: storedUser ? JSON.parse(storedUser).role : null,
  loading: false,
  error: null,
  isAuthenticated: Boolean(storedToken),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authRequestStart(state) {
      state.loading = true;
      state.error = null;
    },
    authRequestFailure(state, action) {
      state.loading = false;
      state.error = action.payload === null ? null : action.payload || "Something went wrong";
    },
    loginSuccess(state, action) {
      const { token, refreshToken, user } = action.payload;
      state.loading = false;
      state.error = null;
      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      state.role = user?.role || null;
      state.isAuthenticated = true;

      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
    },
    setUser(state, action) {
      state.user = action.payload;
      state.role = action.payload?.role || null;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    updateToken(state, action) {
      const { token, refreshToken } = action.payload;
      state.token = token;
      if (refreshToken) state.refreshToken = refreshToken;

      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export const {
  authRequestStart,
  authRequestFailure,
  loginSuccess,
  setUser,
  updateToken,
  logout,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
