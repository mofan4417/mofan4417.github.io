import { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Trophy, Zap, MessageSquare, Share2, Globe, MousePointer2 } from 'lucide-react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useGameStore } from '../store/useGameStore';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Recommender from '../components/gamification/Recommender';
import MissionsModal from '../components/gamification/MissionsModal';
import ActivityWall from '../components/gamification/ActivityWall';
import Leaderboard from '../components/gamification/Leaderboard';
import ShareCard from '../components/gamification/ShareCard';
import ParticleBackground from '../components/visual/ParticleBackground';
import MagneticButton from '../components/visual/MagneticButton';
import VoiceSearch from '../components/visual/VoiceSearch';

const Home = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<any>({});
  const [stats, setStats] = useState<any>({ total_served: 0, total_hours: 0, total_villages: 0, page_views: 0 });
  const [loading, setLoading] = useState(true);
  
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Gamification states
  const { addPoints, unlockAchievement, completeMission, level, points, achievements, xp, xpToNextLevel } = useGameStore();
  const [showRecommender, setShowRecommender] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    // 首次访问成就
    unlockAchievement('first_visit');
    // 每日签到任务
    completeMission('daily_login');
  }, []);

  const handleVoiceResult = (text: string) => {
    console.log('Voice Search Result:', text);
    // 模拟搜索跳转
    if (text.includes('环境') || text.includes('环保')) {
      navigate('/service-objects?q=环保');
    } else {
      navigate(`/service-objects?q=${text}`);
    }
  };

  const formatViews = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return '0';
    if (value >= 10000) {
      const wan = value / 10000;
      const text = wan >= 100 ? Math.round(wan).toString() : wan.toFixed(1);
      return `${text}万`;
    }
    return new Intl.NumberFormat('zh-CN').format(Math.floor(value));
  };

  const displayPageViews = (() => {
    const raw = Number(stats.page_views);
    const base = Number.isFinite(raw) ? raw : 0;
    const offset = Number(content.page_views_offset) || 0;
    return Math.max(0, base + offset);
  })();

  useEffect(() => {
    const initHome = async () => {
      try {
        setLoading(true);
        await api.incrementView().catch(err => console.error('Stats error:', err));
        const [contentData, statsData] = await Promise.all([
          api.getSiteContent().catch(() => ({})),
          api.getStats().catch(() => ({ total_served: 156, total_hours: 2340, total_villages: 12, page_views: 0 }))
        ]);
        setContent(contentData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to init home:', err);
      } finally {
        setLoading(false);
      }
    };
    initHome();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#1A0707] text-white overflow-hidden selection:bg-[#7B1FA2] selection:text-white">
      <ParticleBackground />
      <VoiceSearch onResult={handleVoiceResult} />
      
      <Navbar />

      <main className="relative z-10">
        {/* Hero Section V3 */}
        <section className="relative h-screen flex items-center justify-center px-4 md:px-24 overflow-hidden">
          <motion.div style={{ y: y1, opacity }} className="text-center space-y-12 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(123,31,162,0.2)]"
            >
              <div className="w-2 h-2 bg-[#F9D8C6] rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[#F3DDE4]/60">全球领先的数字化志愿者平台</span>
            </motion.div>

            <div className="space-y-6">
              <motion.h1 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-7xl md:text-9xl font-black tracking-tighter leading-none"
              >
                乡助桥 <br />
                <span className="bg-gradient-to-r from-[#7B1FA2] via-[#F9D8C6] to-[#4A148C] bg-clip-text text-transparent italic">让爱无界</span>
              </motion.h1>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl md:text-2xl text-[#F3DDE4]/40 font-medium max-w-2xl mx-auto leading-relaxed"
              >
                连接 128,000+ 志愿者，为偏远地区提供 4K 级沉浸式情感陪伴与数字化精准帮扶。
              </motion.p>
            </div>

            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8 pt-8"
            >
              <MagneticButton onClick={() => navigate('/register')}>
                一键开启志愿之旅
              </MagneticButton>
              
              <button 
                onClick={() => setShowRecommender(true)}
                className="group flex items-center gap-4 text-sm font-black uppercase tracking-widest text-[#F3DDE4]/60 hover:text-white transition-colors"
              >
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#7B1FA2] transition-colors">
                  <MousePointer2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                AI 智能匹配分析
              </button>
            </motion.div>
          </motion.div>

          {/* Floating Glassmorphism Data Cards */}
          <motion.div 
            style={{ y: y2 }}
            className="absolute bottom-24 left-0 right-0 px-4 md:px-24 hidden lg:grid grid-cols-3 gap-8"
          >
            {[
              { label: '在线志愿者', value: '1,284', icon: <Globe className="w-5 h-5" />, color: '#7B1FA2' },
              { label: '累计陪伴时长', value: '45,920h', icon: <Zap className="w-5 h-5" />, color: '#F9D8C6' },
              { label: '正在进行的任务', value: '342', icon: <Trophy className="w-5 h-5" />, color: '#4A148C' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[32px] group hover:bg-white/10 transition-all hover:border-white/20 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Real-time Data</div>
                </div>
                <div className="text-4xl font-black mb-2 tracking-tighter">{item.value}</div>
                <div className="text-xs font-bold text-[#F3DDE4]/40 uppercase tracking-widest">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

export default Home;
