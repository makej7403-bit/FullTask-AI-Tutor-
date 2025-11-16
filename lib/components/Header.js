"use client";

import { googleLogin } from "../lib/firebase";
import { useState } from "react";

export default function Header() {
  const [user, setUser] = useState(null);

  const login = async () => {
    const result = await googleLogin();
    setUser(result.user);
  };

  return (
    <header style={{ padding: 20, background: "#fff", marginBottom: 10 }}>
      <h2>FullTask AI Tutor</h2>
      {user ? (
        <p>Welcome, {user.displayName}</p>
      ) : (
        <button onClick={login}>
          Sign in with Google
        </button>
      )}
    </header>
  );
}
