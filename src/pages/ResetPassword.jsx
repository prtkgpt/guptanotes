import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // The reset email link signs the user in; without that session we can't set a password.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-sm text-center">
          <h1 className="text-2xl font-bold mb-2">Link expired</h1>
          <p className="text-sm text-gray-500 mb-6">
            This reset link is invalid or has expired. Request a new one and open it right
            away.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm text-black font-medium hover:underline"
          >
            Send a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Choose a new password</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  );
}
