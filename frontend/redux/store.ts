import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import preferenceReducer from './slices/preferencesSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        preferences: preferenceReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;