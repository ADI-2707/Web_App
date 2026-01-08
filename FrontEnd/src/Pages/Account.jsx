import React, { useMemo } from "react";

const Account = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  if (!user) {
    return (
      <div className="account-page">
        <div className="account-card card-surface">
          <p>Unable to load account details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-card card-surface">
        <h2 className="account-title">Account Details</h2>

        <div className="account-field">
          <label>Full Name</label>
          <input value={user.full_name || ""} disabled />
        </div>

        <div className="account-field">
          <label>Email</label>
          <input value={user.email || ""} disabled />
        </div>
      </div>

      <div className="account-card card-surface">
        <h2 className="account-title">Security</h2>

        <div className="password-grid">
          <div className="account-field">
            <label>Current Password</label>
            <input type="password" />
          </div>

          <div className="account-field">
            <label>New Password</label>
            <input type="password" />
          </div>

          <div className="account-field">
            <label>Confirm Password</label>
            <input type="password" />
          </div>
        </div>

        <p className="password-hint">
          Password must be at least 8 characters long.
        </p>

        <button className="primary-btn">
          Update Password
        </button>
      </div>
    </div>
  );
};

export default Account;