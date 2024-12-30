import axios from "axios";

export const registerUser = async (email, key_word, password) => {
    try {
        const response = await axious.post("http://127.0.0.1:8000/api/register/", {
            email,
            key_word,
            password
        });
        return response.data;
    } catch (error) {
        console.error("Error registering user:", error); // Fallback for error handling
        return { success: false, message: "Error registering user" };
    }
};

export const loginUser = async (email, password) => {
    try {
        const response = await axios.post("http://127.0.0.1:8000/api/login/", {
            email,
            password
        });
        return response.data;
    } catch (error) {
        console.error("Error logging in user:", error); // Fallback for error handling
        return { success: false, message: "Error logging in user" };
    }
};

export const logoutUser = async () => {
    try {
        const response = await axios.post("http://127.0.0.1:8000/api/logout/");
        return response.data;
    } catch (error) {
        console.error("Error logging out user:", error); // Fallback for error handling
        return { success: false, message: "Error logging out user" };
    }
}