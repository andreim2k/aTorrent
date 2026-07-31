import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth.js';
import { AmbientField } from '../layout/AmbientField.js';

export function SetupPage() {
  const { setup } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await setup(username.trim(), password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="holo-auth">
      <AmbientField />
      <motion.div
        className="holo-auth__card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div className="holo-auth__mark">a</div>
          <h1 style={{ fontSize: '1.125rem', letterSpacing: '.04em' }}>Initialise Console</h1>
          <p className="holo-label" style={{ marginTop: 6 }}>Create the operator account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <label className="holo-field">
            <span className="holo-field__label holo-label">Operator</span>
            <input
              type="text"
              className="holo-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="admin"
            />
          </label>

          <label className="holo-field">
            <span className="holo-field__label holo-label">Passphrase</span>
            <input
              type="password"
              className="holo-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="min 6 characters"
            />
          </label>

          <label className="holo-field">
            <span className="holo-field__label holo-label">Confirm passphrase</span>
            <input
              type="password"
              className="holo-input"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              placeholder="repeat passphrase"
            />
          </label>

          {error && <p className="holo-note holo-note--error">{error}</p>}

          <button type="submit" className="holo-btn holo-btn--primary" disabled={loading} style={{ height: 40 }}>
            {loading ? 'Initialising…' : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
