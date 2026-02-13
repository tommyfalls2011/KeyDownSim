import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Radio, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      toast.success('Welcome to Key Down');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4" data-testid="auth-page">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,240,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-cyan-400 transition-colors mb-8 font-exo text-sm"
          data-testid="back-to-home-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-panel border border-cyan-400/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-chakra font-bold text-xl text-white uppercase tracking-wider">Key Down</h1>
            <p className="font-exo text-xs text-slate-600">RF Visualizer</p>
          </div>
        </div>

        <div className="bg-panel border border-white/5 p-6">
          {/* Toggle */}
          <div className="flex gap-0 mb-6 border border-white/10">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 font-chakra text-xs uppercase tracking-widest transition-colors ${isLogin ? 'bg-cyan-400/10 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              data-testid="login-tab"
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 font-chakra text-xs uppercase tracking-widest transition-colors ${!isLogin ? 'bg-cyan-400/10 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
              data-testid="register-tab"
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1.5 block">Callsign / Name</Label>
                <Input
                  data-testid="name-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your handle"
                  className="bg-void border-white/10 text-white font-exo text-sm placeholder:text-slate-700 focus:border-cyan-400/50"
                  required
                />
              </div>
            )}
            <div>
              <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1.5 block">Email</Label>
              <Input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@radio.com"
                className="bg-void border-white/10 text-white font-exo text-sm placeholder:text-slate-700 focus:border-cyan-400/50"
                required
              />
            </div>
            <div>
              <Label className="font-chakra text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-1.5 block">Password</Label>
              <Input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="........"
                className="bg-void border-white/10 text-white font-exo text-sm placeholder:text-slate-700 focus:border-cyan-400/50"
                required
              />
            </div>
            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 text-black font-chakra font-bold uppercase tracking-wider hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'TRANSMITTING...' : isLogin ? 'LOG IN' : 'REGISTER'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
