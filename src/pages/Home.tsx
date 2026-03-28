import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<any>({});
  const [stats, setStats] = useState<any>({ total_served: 0, total_hours: 0, total_villages: 0, page_views: 0 });
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const parseJsonStringArray = (raw: unknown) => {
    if (typeof raw !== 'string' || !raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
    } catch {
      return [];
    }
  };

  const heroImages = (() => {
    const list = parseJsonStringArray(content.hero_images);
    if (list.length > 0) return list;
    const one = typeof content.hero_image === 'string' ? content.hero_image.trim() : '';
    if (one) return [one];
    return [
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A+warm+and+hopeful+scene+of+university+volunteers+visiting+left-behind+children+and+elderly+in+rural+China%2C+soft+sunlight%2C+cinematic%2C+high+quality&image_size=landscape_16_9",
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A+kind+volunteer+helping+an+elderly+person+use+a+smartphone%2C+rural+home%2C+warm+tones%2C+cinematic%2C+high+quality&image_size=landscape_16_9",
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A+volunteer+tutoring+a+left-behind+child+after+school+in+a+rural+village%2C+warm+lighting%2C+cinematic%2C+high+quality&image_size=landscape_16_9",
    ];
  })();

  const heroIntervalMs = (() => {
    const raw = Number(content.hero_slideshow_interval_ms);
    if (Number.isFinite(raw) && raw >= 2000) return Math.floor(raw);
    const rawSeconds = Number(content.hero_slideshow_interval_seconds);
    if (Number.isFinite(rawSeconds) && rawSeconds >= 2) return Math.floor(rawSeconds * 1000);
    return 6000;
  })();

  const homePhotos = (() => {
    const raw = content.home_photos;
    let list: string[] = [];

    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
        }
      } catch {
        list = [];
      }
    }

    if (list.length === 0) {
      list = [content.service_photo_1, content.service_photo_2, content.service_photo_3]
        .filter((x: any) => typeof x === 'string' && x.trim())
        .map((x: any) => x.trim());
    }

    if (list.length === 0) {
      list = [
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=village+life+service+moment+photo+0&image_size=square',
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=village+life+service+moment+photo+1&image_size=square',
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=village+life+service+moment+photo+2&image_size=square',
      ];
    }

    const displayCountRaw = content.home_photos_display_count;
    const displayCount = Number(displayCountRaw);
    const count =
      Number.isFinite(displayCount) && displayCount > 0 ? Math.min(displayCount, list.length) : list.length;

    return list.slice(0, count);
  })();

  const formatViews = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return '0';
    if (value >= 10000) {
      const wan = value / 10000;
      const text = wan >= 100 ? Math.round(wan).toString() : wan.toFixed(1);
      return `${text}万`;
    }
    return new Intl.NumberFormat('zh-CN').format(Math.floor(value));
  };

  const pageViewsOffset = (() => {
    const raw = Number(content.page_views_offset);
    return Number.isFinite(raw) ? raw : 0;
  })();

  const displayPageViews = (() => {
    const raw = Number(stats.page_views);
    const base = Number.isFinite(raw) ? raw : 0;
    return Math.max(0, base + pageViewsOffset);
  })();

  useEffect(() => {
    const initHome = async () => {
      try {
        setLoading(true);
        // 增加浏览量
        await api.incrementView().catch(err => console.error('Stats error:', err));
        
        // 获取内容和统计数据
        const [contentData, statsData] = await Promise.all([
          api.getSiteContent().catch(err => {
            console.error('Content error:', err);
            return {};
          }),
          api.getStats().catch(err => {
            console.error('Stats error:', err);
            return { total_served: 156, total_hours: 2340, total_villages: 12, page_views: 0 };
          })
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

  useEffect(() => {
    heroImages.forEach((src) => {
      try {
        const img = new Image();
        img.src = src;
      } catch {
      }
    });
  }, [heroImages.join('|')]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    setHeroIndex(0);
    const id = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, heroIntervalMs);
    return () => window.clearInterval(id);
  }, [heroImages.length, heroIntervalMs]);

  if (loading && !content.hero_image) {
    return (
      <div className="min-h-screen bg-[#2B0B0B] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#F9D8C6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loading && !content.hero_image) {
    return (
      <div className="min-h-screen bg-[#2B0B0B] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#F9D8C6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2B0B0B] text-[#F3DDE4] font-sans selection:bg-[#F9D8C6] selection:text-[#2B0B0B]">
      <Navbar />

      <main className="relative pt-24 pb-32 px-4 md:px-24 overflow-hidden">
        {/* 背景光晕装饰 */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F9D8C6]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#F9D8C6]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start relative z-10">
          <div className="flex-1 space-y-12 animate-fade-in">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-widest uppercase opacity-80">乡助桥</h2>
              <h1 className="text-6xl md:text-8xl font-bold leading-tight tracking-tight">
                让乡村留守者<br />
                不再孤单
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl opacity-70 leading-relaxed max-w-2xl font-light">
              乡助桥帮助大学生志愿者一对一陪伴留守儿童和老人，转化为有意义的贡献，发现微福祉，支持你的社区，并捕捉微感的积极影响。
            </p>

            {/* 核心数据动态显示 */}
            <div className="flex flex-wrap gap-8 md:gap-12 pt-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[#F9D8C6]">{stats.total_villages}</span>
                <span className="text-sm opacity-60">已走访村庄</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[#F9D8C6]">{stats.total_served}</span>
                <span className="text-sm opacity-60">已服务人数</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-[#F9D8C6]">{stats.total_hours}</span>
                <span className="text-sm opacity-60">已陪伴小时</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-8 pt-10">
              <button 
                onClick={() => navigate('/service-objects')}
                className="w-full sm:w-auto bg-[#F9D8C6] hover:bg-white text-[#2B0B0B] font-bold px-8 sm:px-12 py-4 sm:py-5 rounded-full transition-all shadow-2xl flex items-center justify-center sm:justify-start gap-4 text-base sm:text-xl group active:scale-95"
              >
                我要认领服务对象
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/join-us')}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-8 sm:px-12 py-4 sm:py-5 rounded-full transition-all border border-white/20 backdrop-blur-sm text-base sm:text-xl active:scale-95"
              >
                我要成为志愿者
              </button>
            </div>
          </div>

          <div className="md:w-1/3 text-right space-y-12 pt-12 hidden md:block animate-fade-in-right">
            <div className="space-y-4">
              <p className="text-2xl italic font-light leading-relaxed">
                {content.hero_quote_1 || '“爱之所在花才放的地方，生命能随着欣赏的栽”'}
              </p>
              <p className="text-lg font-bold opacity-60 tracking-widest">
                —— {content.hero_author_1 || '梵高'}
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-2xl italic font-light leading-relaxed">
                {content.hero_quote_2 || '“在你的成长的过程中为别人提供加持，教我们把事件代为别人送去一些粮食”'}
              </p>
              <p className="text-lg font-bold opacity-60 tracking-widest">
                —— {content.hero_author_2 || '德·席勒'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-24 animate-slide-up">
          <div className="relative rounded-[40px] overflow-hidden shadow-2xl group border border-white/10 aspect-[21/9]">
            {heroImages.map((src, idx) => (
              <img
                key={`${idx}-${src.slice(0, 20)}`}
                src={src}
                alt="乡助桥服务环境"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${idx === heroIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'} group-hover:scale-105`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 mt-16">
            {homePhotos.map((src, idx) => (
              <div key={`${idx}-${src.slice(0, 20)}`} className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 group aspect-square relative cursor-pointer">
                <img
                  src={src}
                  alt={`调研照片${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 悬浮小组件 */}
        <div className="fixed right-10 top-1/2 -translate-y-1/2 z-50 group hidden lg:block">
          <button 
            onClick={() => navigate('/join-us')}
            className="w-16 h-16 bg-white rounded-full p-1 shadow-2xl hover:scale-110 transition-transform active:scale-95 overflow-hidden border-2 border-[#F9D8C6]"
          >
            <img 
              src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A+cute+volunteer+girl+avatar+illustration%2C+clean+line+art%2C+soft+colors&image_size=square" 
              alt="加入我们" 
              className="w-full h-full object-cover rounded-full"
            />
            <div className="absolute inset-0 bg-[#2B0B0B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">加入</span>
            </div>
          </button>
        </div>

        {/* 浏览量统计 */}
        <div className="max-w-7xl mx-auto mt-16 text-right opacity-40 text-sm">
          <p>网站总浏览量：{formatViews(displayPageViews)}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
