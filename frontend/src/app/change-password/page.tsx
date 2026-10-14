"use client";

import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints } from "@/lib/api";

export default function ChangePasswordPage() {
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    try {
      setError("");
      setMessage("");
      await endpoints.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    }
  };

  return (
    <main className="dashboard-layout">
      <AppNav/>
      <section className="main">
        <div className="toolbar">
          <div>
            <h1>Change Password</h1>
            <p>Update your password using your current password.</p>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        <div className="profile-grid single">
          <form className="panel" onSubmit={changePassword}>
            <h2>Change Password</h2>
            <div className="form-grid">
              <label className="field">Current password<input className="input" type="password" value={passwords.currentPassword} onChange={(e)=>setPasswords({...passwords, currentPassword: e.target.value})}/></label>
              <label className="field">New password<input className="input" type="password" value={passwords.newPassword} onChange={(e)=>setPasswords({...passwords, newPassword: e.target.value})}/></label>
              <label className="field">Confirm new password<input className="input" type="password" value={passwords.confirmPassword} onChange={(e)=>setPasswords({...passwords, confirmPassword: e.target.value})}/></label>
            </div>
            <button className="btn" style={{marginTop:16}}>Update password</button>
          </form>
        </div>
      </section>
    </main>
  );
}
