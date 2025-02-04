import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../../src/services/api";

// Define Auth State
interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
}

// Default state (avoid accessing localStorage directly)
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
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
    loginSuccess: (state, action: PayloadAction<{ id: string; email: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload));  // Store user safely in the browser
        localStorage.setItem("isAuthenticated", "true");
      }
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");  // Ensure localStorage is only accessed in the browser
        localStorage.removeItem("isAuthenticated");
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    });
  },
});

export const { loginSuccess, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
