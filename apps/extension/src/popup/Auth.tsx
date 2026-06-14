import React, { useState } from 'react';
import { supabase } from '@/services/supabase';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Zap } from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '360px', minHeight: '460px' }} className="bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand mb-6">
        <Zap size={24} className="text-white" />
      </div>
      
      <h1 className="text-xl font-bold text-center mb-1">LeadScaper Pro</h1>
      <p className="text-sm text-[var(--text-tertiary)] text-center mb-8">
        Log in to sync leads to your dashboard.
      </p>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
            {error}
          </div>
        )}
        
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <div className="mt-6 text-xs text-[var(--text-secondary)] text-center">
        Don't have an account?{' '}
        <a 
          href="http://localhost:3000/login" 
          target="_blank" 
          rel="noreferrer"
          className="text-brand-400 hover:text-brand-300"
        >
          Sign up on Web
        </a>
      </div>
    </div>
  );
}
