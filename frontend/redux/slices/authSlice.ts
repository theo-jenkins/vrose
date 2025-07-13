import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../../src/services/api";

// Define Auth State
interface AuthState {
  isAuthenticated: boolean;
  user: { 
    id: string; 
    email: string; 
    first_name: string; 
    last_name: string; 
  } | null;
  accessToken?: string;
  refreshToken?: string;
  isGoogleAuth?: boolean;
  isInitialized: boolean; // Track if auth state has been loaded from storage
}

// Default state (avoid accessing localStorage directly)
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: undefined,
  refreshToken: undefined,
  isGoogleAuth: false,
  isInitialized: false,
};

// Create a thunk to fetch user details
export const fetchUserDetails = createAsyncThunk(
  "auth/fetchUserDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/user-details/");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      return rejectWithValue(error.response?.data || "Failed to fetch user");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ 
      user: { id: string; email: string; first_name: string; last_name: string; };
      accessToken?: string; 
      refreshToken?: string; 
      isGoogleAuth?: boolean; 
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isGoogleAuth = action.payload.isGoogleAuth || false;
      state.isInitialized = true;
      
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("isAuthenticated", "true");
        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
        localStorage.setItem("isGoogleAuth", String(state.isGoogleAuth));
      }
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = undefined;
      state.refreshToken = undefined;
      state.isGoogleAuth = false;
      state.isInitialized = true;
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isGoogleAuth");
      }
    },
    initializeAuth: (state) => {
      // Mark auth as initialized when no stored auth is found
      state.isInitialized = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    });
  },
});

export const { loginSuccess, logoutSuccess, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
