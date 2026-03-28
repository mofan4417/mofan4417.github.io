import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 如果已经登录，直接跳转到后台
    const check = async () => {
      try {
        const session = await api.getSession();
        if (session) navigate('/admin/dashboard');
      } catch {
        // ignore
      }
    };
    check();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login({ email, password });
      window.location.href = '/admin/dashboard';
    } catch {
      setError('邮箱或密码错误，请重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2B0B0B] flex items-center justify-center px-4 py-12 font-sans">
      <div className="max-w-md w-full relative z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#F9D8C6]/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#F9D8C6]/20 text-[#F9D8C6] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-[#F3DDE4]">管理者登录</h2>
            <p className="text-[#F3DDE4]/40 text-sm">请输入您的凭据以访问后台管理系统</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#F3DDE4]/50 uppercase tracking-widest flex items-center gap-2 px-1">
                <User className="w-4 h-4" /> 账号
              </label>
              <input
                required
                type="text"
                placeholder="请输入邮箱或管理员账号"
                className="w-full bg-[#1A0707] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#F3DDE4]/50 uppercase tracking-widest flex items-center gap-2 px-1">
                <Lock className="w-4 h-4" /> 密码
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  className="w-full bg-[#1A0707] border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all pr-12"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 py-3 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F9D8C6] hover:bg-white text-[#2B0B0B] font-bold py-5 rounded-2xl transition-all shadow-xl shadow-black/20 mt-4 text-lg disabled:opacity-50"
            >
              {loading ? '正在登录...' : '登 录'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-[#F3DDE4]/40 text-sm hover:text-white transition-colors underline decoration-dotted underline-offset-4"
            >
              返回主站首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
