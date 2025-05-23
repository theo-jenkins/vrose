// components/GoogleSignIn.js
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function GoogleSignIn() {
  return (
    <GoogleOAuthProvider clientId="735267755465-memcani6u0bs11s1c5uq4hlefvc3fopf.apps.googleusercontent.com">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          // Sendsthe Google ID token to backend for verification and login
          const response = await fetch('http://localhost:8000/api/auth/google/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: credentialResponse.credential }),
          });
          const data = await response.json();
          console.log('User logged in:', data);
          // Store the Django session/JWT (e.g., in cookies or localStorage)
        }}
        onError={() => {
          console.error('Google Login failed');
        }}
      />
    </GoogleOAuthProvider>
  );
}