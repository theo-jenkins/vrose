import React from 'react';

const LoginPage = () => {
    return (
        <div>
            <h1>Login Page</h1>
            <p>This is the login page.</p>
            <p>This is a practice tailwind component.</p>
            <div className="bg-blue-500 text-white p-4 rounded-lg">
                <h2 className="text-2xl font-bold">Welcome to VROSE</h2>
                <p className="text-lg">
                    This is a sample page to demonstrate the usage of Tailwind CSS.
                </p>
                <p className="text-lg">
                    Tailwind CSS is a utility-first CSS framework that allows you to
                    style your applications without writing any actual CSS code.
                </p>
                <p className="text-lg">
                    It provides a set of predefined utility classes that you can use to
                    quickly style your HTML elements.
                </p>
                <p className="text-lg">
                    You can also use custom CSS classes to style your elements.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;