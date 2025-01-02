import React from "react";
import { Link } from "react-router-dom";
import "../styles/home-page.css";

const HomePage = () => {
    return (
        <div className="home-page">
            <h1>Home Page</h1>
            <Link to="/register" className="register-link">Register</Link>
            <Link to="/login" className="login-link">Login</Link>
        </div>
    );
};

export default HomePage;