"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { endpoints } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User>();
  const [name, setName] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    endpoints.me()
      .then((res) => {
        setUser(res.user);
        setName(res.user.name);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Profile failed to load"));
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setError("");
      setMessage("");
      const res = await endpoints.updateMe({ name });
      setUser(res.user);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed");
    }
  };

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
            <h1>My Profile</h1>
            <p>Manage your account details and password.</p>
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}

        <div className="profile-grid">
          <form className="panel" onSubmit={saveProfile}>
            <h2>Account</h2>
            <div className="form-grid">
              <label className="field">Name<input className="input" value={name} onChange={(e)=>setName(e.target.value)}/></label>
              <label className="field">Email<input className="input" value={user?.email || ""} disabled/></label>
              <label className="field">Role<input className="input" value={user?.role || ""} disabled/></label>
              <label className="field">Status<input className="input" value={user?.status || ""} disabled/></label>
            </div>
            <button className="btn" style={{marginTop:16}}>Save profile</button>
          </form>

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
