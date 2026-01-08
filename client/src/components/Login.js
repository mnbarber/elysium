import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import './Auth.css';

function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>login to elysium</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>username OR email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'login'}
          </button>
        </form>
        <p className="switch-auth">
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister}>Register</button>
        </p>
      </div>
    </div>
  );
}

export default Login;