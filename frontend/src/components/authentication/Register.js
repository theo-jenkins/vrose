import React, { useState } from "react";
import { registerUser } from "../../utils/authentication/api";
import "../../styles/authentication/register.css";

const Register = () => {
    const [formData, setFormData] = useState({
        email: "",
        key_word: "",
        password: "",
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await registerUser(formData.email, formData.key_word, formData.password);
        if (response.success) {
            setMessage("User registered successfully!");
        } else {
            setMessage(response.message || "Failed to register user.");
        }
    };

    return (
        <div className="register-container">
            <h2>Register</h2>
            {message && <p className="register-message">{message}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="key_word">Key Word:</label>
                    <input
                        type="text"
                        id="key_word"
                        name="key_word"
                        value={formData.key_word}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <button type="submit" className="register-button">
                    Register
                </button>
            </form>
        </div>
    );
};

export default Register;
