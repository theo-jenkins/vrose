import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUserDetails, loginSuccess } from "../slices/authSlice";
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

            if (storedAuth && storedUser) {
                dispatch(loginSuccess(JSON.parse(storedUser))); // Hydrate Redux store
            }
        }
    }, [dispatch]);

    return null;
};

export default PreloadRedux;
