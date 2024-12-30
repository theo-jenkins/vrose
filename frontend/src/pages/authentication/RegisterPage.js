import React from "react";
import Register from "../components/authentication/Register";
import "../../styles/authentication/register-page.css";

const RegisterPage = () => {
    return (
        <div className="register-page">
            <h1>Register Page</h1>
            <Register />
        </div>
    );
};

export default RegisterPage;