import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: '$99.99', period: '/month', desc: 'Billed monthly' },
  { id: 'yearly', name: 'Yearly', price: '$999.99', period: '/year', desc: 'Save $200 — best value', badge: 'BEST VALUE' },
];

export default function SubscriptionPage() {
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const pollPaymentStatus = useCallback(async (sessionId, attempts = 0) => {
    if (attempts >= 8) {
      setPolling(false);
      toast.error('Payment status check timed out');
      return;
    }
    try {
      const res = await axios.get(`${API}/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.payment_status === 'paid') {
        setPolling(false);
        await refreshUser();
        toast.success('Subscription activated!');
        return;
      }
      if (res.data.status === 'expired') {
        setPolling(false);
        toast.error('Payment expired');
        return;
      }
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
    } catch {
      setPolling(false);
      toast.error('Error checking payment status');
    }
  }, [token, refreshUser]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setPolling(true);
      pollPaymentStatus(sessionId);
    }
  }, [searchParams, pollPaymentStatus]);

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await axios.post(`${API}/subscribe`, {
        plan: planId,
        origin_url: origin,
      }, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Subscription failed');
      setLoading(false);
    }
  };

  const isActive = user?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-void" data-testid="subscription-page">
      <header className="h-12 bg-surface border-b border-white/5 flex items-center px-4">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors" data-testid="back-to-dashboard-sub">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-chakra text-xs uppercase tracking-wider">Dashboard</span>
        </button>
        <div className="ml-4 font-chakra font-bold text-sm text-white uppercase tracking-widest">
          Subscription
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-8">
        {polling && (
          <div className="bg-cyan-400/5 border border-cyan-400/20 p-4 mb-6 flex items-center gap-3" data-testid="payment-polling">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="font-exo text-sm text-cyan-400">Processing payment...</span>
          </div>
        )}

        {isActive ? (
          <div className="bg-panel border border-cyan-400/30 p-8 text-center" data-testid="active-subscription">
            <Check className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <h2 className="font-chakra font-bold text-lg text-white uppercase tracking-widest mb-2">RF PRO ACTIVE</h2>
            <p className="font-exo text-sm text-slate-500">
              Plan: <span className="text-cyan-400 font-mono">{user.subscription_plan?.toUpperCase()}</span>
            </p>
            {user.subscription_end && (
              <p className="font-mono text-xs text-slate-600 mt-2">
                Renews: {new Date(user.subscription_end).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-6 h-6 text-cyan-400" />
                <h2 className="font-chakra font-bold text-base md:text-lg text-white uppercase tracking-widest">RF PRO</h2>
              </div>
              <p className="font-exo text-sm text-slate-500">Unlock unlimited saved configurations and full simulator access.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`
                    relative bg-panel border p-6 cursor-pointer transition-all
                    ${selectedPlan === plan.id ? 'border-cyan-400/60 bg-cyan-400/5' : 'border-white/10 hover:border-white/20'}
                  `}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-cyan-400 text-black font-chakra text-[9px] px-3 py-0.5 uppercase tracking-widest">
                      {plan.badge}
                    </div>
                  )}
                  <div className="font-chakra text-xs text-slate-500 uppercase tracking-widest mb-2">{plan.name}</div>
                  <div className="font-mono text-3xl text-white">{plan.price}</div>
                  <div className="font-exo text-xs text-slate-600 mt-1">{plan.period}</div>
                  <div className="font-exo text-[10px] text-slate-700 mt-2">{plan.desc}</div>
                </div>
              ))}
            </div>

            <Button
              data-testid="subscribe-btn"
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={loading}
              className="w-full mt-6 bg-cyan-400 text-black font-chakra font-bold uppercase tracking-wider py-3 hover:bg-cyan-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'PROCESSING...' : 'SUBSCRIBE NOW'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
