import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUserDetails, loginSuccess, initializeAuth } from "../slices/authSlice";
import { parseCookies } from "nookies";
import { AppDispatch } from "../store";

const PreloadRedux = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const { refresh_token } = parseCookies();

        if (refresh_token) {
            dispatch(fetchUserDetails() as any);
        } else if (typeof window !== "undefined") {
            // Load authentication state from localStorage if available
            const storedUser = localStorage.getItem("user");
            const storedAuth = localStorage.getItem("isAuthenticated") === "true";
            const storedAccessToken = localStorage.getItem("accessToken");
            const storedRefreshToken = localStorage.getItem("refreshToken");
            const storedIsGoogleAuth = localStorage.getItem("isGoogleAuth") === "true";

            if (storedAuth && storedUser) {
                dispatch(loginSuccess({
                    user: JSON.parse(storedUser),
                    accessToken: storedAccessToken || undefined,
                    refreshToken: storedRefreshToken || undefined,
                    isGoogleAuth: storedIsGoogleAuth
                })); // Hydrate Redux store with complete auth state
            } else {
                // No stored auth found, mark as initialized
                dispatch(initializeAuth());
            }
        }
    }, [dispatch]);

    return null;
};

export default PreloadRedux;
