import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { migrateLocalToSupabaseOnLogin, setAuthUser } from '../../utils.jsx';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // If email confirmation is enabled, user may need to verify email first
      const user = data?.user ?? null;
      setAuthUser(user);

      if (!user) {
        toast('Check your email to confirm your account.');
        navigate('/login', { replace: true, state: { from: redirectTo } });
        return;
      }

      await migrateLocalToSupabaseOnLogin();
      toast.success('Account created!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Signup error', err);
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-zinc-400 mb-6">Sync your watchlist and continue watching across devices.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg py-2 font-medium"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-sm text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" state={{ from: redirectTo }} className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
