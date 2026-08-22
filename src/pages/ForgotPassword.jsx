import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Reset your password</h1>
        {sent ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Check your inbox — we sent a reset link to <strong>{email}</strong>. Open it on
              this device to choose a new password.
            </p>
            <Link to="/login" className="text-sm text-black font-medium hover:underline">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 text-center mb-6">
              Enter your account email and we&apos;ll send you a link to set a new password.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-500">
              Remembered it?{' '}
              <Link to="/login" className="text-black font-medium hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
