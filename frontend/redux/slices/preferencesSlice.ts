import { createSlice } from '@reduxjs/toolkit';

// Retrieve theme from localStorage (fallback to 'light' if not set)
const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') || 'light';
    }
    return 'light'; // Default for SSR
};

const preferencesSlice = createSlice({
    name: 'preferences',
    initialState: {
        theme: getInitialTheme(),
    },
    reducers: {
        setTheme: (state, action) => {
            state.theme = action.payload;
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme', action.payload); // Save to localStorage
            }
        },
    },
});

export const { setTheme } = preferencesSlice.actions;
export default preferencesSlice.reducer;
