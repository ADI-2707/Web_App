import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserShield } from "react-icons/fa";

const Login = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <>
    <h1 className='text-center text-3xl md:text-6xl font-bold mt-25 hero-header'>Welcome Back!</h1>
    <div className="login-page -mt-2.5">
      <div className="login-card">
        <div className="icon-header">
          <FaUserShield size={32} color="var(--accent-color)" />
        </div>
        <h2>Login</h2>
        <p>Please enter your details to sign in.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" required />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required />
          </div>
          
          <div className="form-options">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forget-password" className="forgot-link">Forgot password?</Link>
          </div>
          
          <button type="submit" className="button login-btn">
            Sign In
          </button>
        </form>
        
        <p className="signup-redirect">
          Don't have an account? <Link to="/signup"><span className="link-text">Sign up</span></Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Login;