import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../api';
import { Heart, Clock, MapPin, Quote, ChevronRight } from 'lucide-react';

const ServiceResults = () => {
  const [stats, setStats] = useState<any>({ total_served: 156, total_hours: 2340, total_villages: 12 });
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const defaultCases = [
      {
        title: '从沉默到开朗：小明的蜕变',
        type: '儿童陪伴',
        before: '父母常年在外打工，小明性格孤僻，不愿与人交流，成绩下滑严重。',
        after: '志愿者每周通过视频进行情感陪伴和功课辅导。现在小明变得活泼自信，期末考试进入班级前十。',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop'
      },
      {
        title: '王奶奶学会了“视频通话”',
        type: '老人助老',
        before: '独居老人王奶奶不会使用智能手机，只能通过座机与子女简单通话。',
        after: '志愿者耐心地教会了王奶奶使用微信视频。现在王奶奶每天都能看到远在广东工作的孙子。',
        image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2070&auto=format&fit=crop'
      }
    ];

    const parseCases = (raw: unknown) => {
      if (typeof raw !== 'string' || !raw.trim()) return defaultCases;
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return defaultCases;
        const list = parsed
          .filter((x) => x && typeof x === 'object')
          .map((x: any) => ({
            title: typeof x.title === 'string' ? x.title : '',
            type: typeof x.type === 'string' ? x.type : '',
            before: typeof x.before === 'string' ? x.before : '',
            after: typeof x.after === 'string' ? x.after : '',
            image: typeof x.image === 'string' ? x.image : '',
          }))
          .filter((x) => x.title);
        return list.length > 0 ? list : defaultCases;
      } catch {
        return defaultCases;
      }
    };

    const fetchData = async () => {
      try {
        const [statsData, contentData] = await Promise.all([
          api.getStats(),
          api.getSiteContent().catch(() => ({})),
        ]);
        setStats(statsData);
        setCases(parseCases((contentData as any)?.service_cases));
        setContent(contentData);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setCases(defaultCases);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const parseJson = (raw: any) => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const defaultTestimonials = [
    {
      name: '张同学',
      major: '教育学专业',
      content: '加入乡助桥让我明白，有时一点点关怀就能改变一个人的世界。看到小明脸上的笑容，我觉得一切努力都是值得的。'
    },
    {
      name: '李同学',
      major: '社会工作专业',
      content: '不仅仅是我们帮助了留守老人，他们的人生智慧也深深启发了我。这是一场跨越代际的双向奔赴。'
    }
  ];

  const testimonials = parseJson(content?.volunteer_testimonials) || defaultTestimonials;

  const photos = (() => {
    const raw = content?.home_photos;
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop',
    ];
  })();

  return (
    <div className="min-h-screen bg-white text-[#333] font-sans">
      <Navbar />
      
      <div className="pt-24 pb-32 px-4 md:px-24 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-5xl font-bold">服务成果</h2>
          <p className="text-xl text-black/50">用数据和故事记录每一份温暖的传递</p>
        </div>

        {/* 数据看板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-[#E84C4C]/5 p-10 rounded-[40px] text-center space-y-4 border border-[#E84C4C]/10 hover:bg-[#E84C4C]/10 transition-all">
            <div className="w-16 h-16 bg-[#E84C4C] text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-8 h-8" />
            </div>
            <div className="text-5xl font-black text-[#E84C4C]">{stats.total_served}</div>
            <p className="text-lg font-bold opacity-60">累计服务人次</p>
          </div>
          <div className="bg-[#E84C4C]/5 p-10 rounded-[40px] text-center space-y-4 border border-[#E84C4C]/10 hover:bg-[#E84C4C]/10 transition-all">
            <div className="w-16 h-16 bg-[#E84C4C] text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Clock className="w-8 h-8" />
            </div>
            <div className="text-5xl font-black text-[#E84C4C]">{stats.total_hours}</div>
            <p className="text-lg font-bold opacity-60">累计陪伴小时</p>
          </div>
          <div className="bg-[#E84C4C]/5 p-10 rounded-[40px] text-center space-y-4 border border-[#E84C4C]/10 hover:bg-[#E84C4C]/10 transition-all">
            <div className="w-16 h-16 bg-[#E84C4C] text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="text-5xl font-black text-[#E84C4C]">{stats.total_villages}</div>
            <p className="text-lg font-bold opacity-60">覆盖乡村数量</p>
          </div>
        </div>

        {/* 成功案例 */}
        <div className="space-y-20 mb-32">
          <h3 className="text-3xl font-bold flex items-center gap-4">
            <div className="w-2 h-8 bg-[#E84C4C] rounded-full"></div>
            成功案例分享
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {cases.map((item, index) => (
              <div key={index} className="flex flex-col gap-8 group">
                <div className="aspect-[16/9] rounded-[40px] overflow-hidden shadow-2xl relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full text-sm font-bold text-[#E84C4C] shadow-lg">
                    {item.type}
                  </div>
                </div>
                <div className="space-y-6 px-4">
                  <h4 className="text-2xl font-bold">{item.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-black/40 uppercase tracking-widest">服务前</p>
                      <p className="text-sm opacity-60 leading-relaxed">{item.before}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#E84C4C] uppercase tracking-widest">服务后</p>
                      <p className="text-sm font-bold text-[#E84C4C]/80 leading-relaxed">{item.after}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 照片墙 */}
        <div className="space-y-16 mb-32">
          <h3 className="text-3xl font-bold flex items-center gap-4">
            <div className="w-2 h-8 bg-[#E84C4C] rounded-full"></div>
            服务瞬间
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <div key={index} className="aspect-square rounded-3xl overflow-hidden shadow-xl border border-black/5 group cursor-pointer">
                <img src={photo} alt={`服务瞬间 ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>

        {/* 志愿者感言 */}
        <div className="space-y-16">
          <h3 className="text-3xl font-bold flex items-center gap-4">
            <div className="w-2 h-8 bg-[#E84C4C] rounded-full"></div>
            志愿者感言
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {testimonials.map((item, index) => (
              <div key={index} className="bg-black/5 p-12 rounded-[48px] relative group hover:bg-[#E84C4C]/5 transition-all">
                <Quote className="absolute top-10 right-10 w-12 h-12 text-[#E84C4C]/10 group-hover:text-[#E84C4C]/20 transition-colors" />
                <p className="text-xl italic leading-relaxed mb-8 opacity-70">
                  “{item.content}”
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E84C4C] text-white rounded-2xl flex items-center justify-center font-bold text-xl">
                    {item.name[0]}
                  </div>
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-sm opacity-40">{item.major}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceResults;
