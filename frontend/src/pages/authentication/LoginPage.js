import React from "react";
import Login from "../../components/authentication/Login";
import "../../styles/authentication/login-page.css";

const LoginPage = () => {
    return (
        <div className="login-page">
            <h1>Login Page</h1>
            <Login />
        </div>
    );
};

export default LoginPage;