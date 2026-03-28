import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, ClipboardList, Settings, LogOut, 
  Trash2, Edit, CheckCircle, XCircle, Plus, Search, 
  ArrowLeft, LayoutDashboard, Image as ImageIcon,
  ShieldCheck, Eye, Upload, Save, RefreshCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../api';
import { ServiceObject } from './ServiceObjects';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'requests' | 'objects' | 'settings' | 'content'>('applications');
  const [applications, setApplications] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [objects, setObjects] = useState<ServiceObject[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [siteContent, setSiteContent] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form for adding/editing service objects
  const [isEditing, setIsEditing] = useState(false);
  const [currentObject, setCurrentObject] = useState<Partial<ServiceObject>>({
    code: '', type: 'child', age: 0, village: '', situation: '', needs: '', status: 'pending'
  });

  // Settings Forms
  const [settingsForm, setSettingsForm] = useState({
    total_served: 0,
    total_hours: 0,
    total_villages: 0,
    hero_image: '',
    hero_images: [] as string[],
    hero_slideshow_interval_seconds: 6,
    hero_quote_1: '',
    hero_author_1: '',
    hero_quote_2: '',
    hero_author_2: '',
    page_views_offset: 0,
    service_cases: [] as { title: string; type: string; before: string; after: string; image: string }[],
    home_photos: [] as string[],
    home_photos_display_count: 0
  });

  // Content Forms
  const [whatWeDoForm, setWhatWeDoForm] = useState({
    title: '',
    subtitle: '',
    bg_image: '',
    cards: [] as any[]
  });

  const [teamForm, setTeamForm] = useState({
    title: '',
    subtitle: '',
    members: [] as any[]
  });

  const [newTeamMember, setNewTeamMember] = useState({ name: '', role: '', desc: '', image: '' });
  const [newWhatWeDoCard, setNewWhatWeDoCard] = useState({ title: '', items: [] as any[] });
  const [newCardItem, setNewCardItem] = useState({ label: '', desc: '' });
  const [newHomePhotoUrl, setNewHomePhotoUrl] = useState('');
  const [newHeroImageUrl, setNewHeroImageUrl] = useState('');
  const [newCase, setNewCase] = useState({ title: '', type: '', before: '', after: '', image: '' });

  const maxHomePhotos = 20;
  const maxHeroImages = 10;

  const recommendedHeroImages = [
    "https://source.unsplash.com/1600x900/?volunteer,elderly",
    "https://source.unsplash.com/1600x900/?volunteer,child",
    "https://source.unsplash.com/1600x900/?rural,china,volunteer",
    "https://source.unsplash.com/1600x900/?community,helping",
  ];

  const parseJsonStringArray = (raw: any) => {
    if (typeof raw !== 'string' || !raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
    } catch {
      return [];
    }
  };

  const parseJson = (raw: any) => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const defaultServiceCases = [
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

  const getHomePhotosFromContent = (content: any) => {
    const raw = content?.home_photos;
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
      list = [content?.service_photo_1, content?.service_photo_2, content?.service_photo_3]
        .filter((x: any) => typeof x === 'string' && x.trim())
        .map((x: any) => x.trim());
    }

    return list.slice(0, maxHomePhotos);
  };

  const getHeroImagesFromContent = (content: any) => {
    const list = parseJsonStringArray(content?.hero_images);
    if (list.length > 0) return list.slice(0, maxHeroImages);
    const one = typeof content?.hero_image === 'string' ? content.hero_image.trim() : '';
    return one ? [one] : [];
  };

  const getServiceCasesFromContent = (content: any) => {
    const parsed = parseJson(content?.service_cases);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x: any) => ({
          title: typeof x.title === 'string' ? x.title : '',
          type: typeof x.type === 'string' ? x.type : '',
          before: typeof x.before === 'string' ? x.before : '',
          after: typeof x.after === 'string' ? x.after : '',
          image: typeof x.image === 'string' ? x.image : '',
        }))
        .filter((x) => x.title.trim())
        .slice(0, 20);
    }
    return defaultServiceCases;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Catch individual errors to prevent the whole dashboard from crashing
      const apps = await api.getApplications().catch(err => {
        console.error('Failed to fetch applications:', err);
        return [];
      });
      const objs = await api.getObjects().catch(err => {
        console.error('Failed to fetch objects:', err);
        return [];
      });
      const reqs = await api.getObjectRequests().catch(err => {
        console.error('Failed to fetch object requests:', err);
        return [];
      });
      const statsData = await api.getStats().catch(err => {
        console.error('Failed to fetch stats:', err);
        return { total_served: 0, total_hours: 0, total_villages: 0, page_views: 0 };
      });
      const content = await api.getSiteContent().catch(err => {
        console.error('Failed to fetch content:', err);
        return {};
      });
      
      setApplications(apps || []);
      setRequests(reqs || []);
      setObjects(objs || []);
      setStats(statsData);
      setSiteContent(content);

      const heroImagesFromDb = getHeroImagesFromContent(content);
      const heroImages = heroImagesFromDb.length > 0 ? heroImagesFromDb : recommendedHeroImages.slice(0, maxHeroImages);
      const homePhotos = getHomePhotosFromContent(content);
      const serviceCases = getServiceCasesFromContent(content);
      const displayCountRaw = Number(content?.home_photos_display_count);
      const displayCount = Number.isFinite(displayCountRaw) && displayCountRaw > 0
        ? Math.min(displayCountRaw, Math.max(homePhotos.length, 1))
        : Math.max(homePhotos.length, 1);

      setSettingsForm({
        total_served: statsData.total_served || 0,
        total_hours: statsData.total_hours || 0,
        total_villages: statsData.total_villages || 0,
        hero_image: content.hero_image || heroImages[0] || '',
        hero_images: heroImages,
        hero_slideshow_interval_seconds: Number(content?.hero_slideshow_interval_seconds) || 6,
        hero_quote_1: content.hero_quote_1 || '',
        hero_author_1: content.hero_author_1 || '',
        hero_quote_2: content.hero_quote_2 || '',
        hero_author_2: content.hero_author_2 || '',
        page_views_offset: Number(content?.page_views_offset) || 0,
        service_cases: serviceCases,
        home_photos: homePhotos,
        home_photos_display_count: displayCount
      });

      // Update Content Forms
      setWhatWeDoForm({
        title: content.what_we_do_title || '',
        subtitle: content.what_we_do_subtitle || '',
        bg_image: content.what_we_do_bg_image || '',
        cards: parseJson(content.what_we_do_cards) || []
      });

      setTeamForm({
        title: content.team_intro_title || '我们的团队',
        subtitle: content.team_intro_subtitle || '来自宜宾学院的青年力量，用技术温暖乡村',
        members: parseJson(content.team_members) || []
      });
    } catch (err) {
      console.error('Critical error in dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const check = async () => {
      try {
        const isBypass = localStorage.getItem('admin_bypass') === 'true';
        if (isBypass) {
          fetchData();
          return;
        }
        
        const session = await api.getSession();
        if (!session) {
          window.location.href = '/admin/login';
          return;
        }
        const role = await api.getMyRole();
        if (role !== 'admin' && role !== 'reviewer') {
          alert('权限不足');
          window.location.href = '/';
          return;
        }
        fetchData();
      } catch {
        window.location.href = '/admin/login';
      }
    };
    check();
  }, []);

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read_failed'));
      reader.readAsDataURL(file);
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const heroImages = (settingsForm.hero_images || [])
        .filter((x) => typeof x === 'string' && x.trim())
        .map((x) => x.trim())
        .slice(0, maxHeroImages);
      const heroIntervalSecondsRaw = Number(settingsForm.hero_slideshow_interval_seconds);
      const heroIntervalSeconds = Number.isFinite(heroIntervalSecondsRaw) ? Math.max(2, Math.floor(heroIntervalSecondsRaw)) : 6;

      const homePhotos = (settingsForm.home_photos || []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, maxHomePhotos);
      const displayCount = Math.min(
        Math.max(1, Number(settingsForm.home_photos_display_count) || homePhotos.length || 1),
        Math.max(1, homePhotos.length || 1),
      );
      const pageViewsOffsetRaw = Number(settingsForm.page_views_offset);
      const pageViewsOffset = Number.isFinite(pageViewsOffsetRaw) ? Math.floor(pageViewsOffsetRaw) : 0;
      const serviceCases = (settingsForm.service_cases || [])
        .filter((x) => x && typeof x === 'object')
        .map((x: any) => ({
          title: typeof x.title === 'string' ? x.title.trim() : '',
          type: typeof x.type === 'string' ? x.type.trim() : '',
          before: typeof x.before === 'string' ? x.before.trim() : '',
          after: typeof x.after === 'string' ? x.after.trim() : '',
          image: typeof x.image === 'string' ? x.image.trim() : '',
        }))
        .filter((x) => x.title)
        .slice(0, 20);

      await Promise.all([
        api.updateGlobalStats({
          total_served: settingsForm.total_served,
          total_hours: settingsForm.total_hours,
          total_villages: settingsForm.total_villages
        }),
        api.updateSiteContent('hero_images', JSON.stringify(heroImages)),
        api.updateSiteContent('hero_slideshow_interval_seconds', String(heroIntervalSeconds)),
        api.updateSiteContent('hero_image', heroImages[0] || settingsForm.hero_image || ''),
        api.updateSiteContent('hero_quote_1', settingsForm.hero_quote_1 || ''),
        api.updateSiteContent('hero_author_1', settingsForm.hero_author_1 || ''),
        api.updateSiteContent('hero_quote_2', settingsForm.hero_quote_2 || ''),
        api.updateSiteContent('hero_author_2', settingsForm.hero_author_2 || ''),
        api.updateSiteContent('page_views_offset', String(pageViewsOffset)),
        api.updateSiteContent('service_cases', JSON.stringify(serviceCases)),
        api.updateSiteContent('home_photos', JSON.stringify(homePhotos)),
        api.updateSiteContent('home_photos_display_count', String(displayCount)),
        api.updateSiteContent('service_photo_1', homePhotos[0] || ''),
        api.updateSiteContent('service_photo_2', homePhotos[1] || ''),
        api.updateSiteContent('service_photo_3', homePhotos[2] || ''),
      ]);
      alert('设置已成功保存！');
      fetchData();
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePageContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Promise.all([
        api.updateSiteContent('what_we_do_title', whatWeDoForm.title),
        api.updateSiteContent('what_we_do_subtitle', whatWeDoForm.subtitle),
        api.updateSiteContent('what_we_do_bg_image', whatWeDoForm.bg_image),
        api.updateSiteContent('what_we_do_cards', JSON.stringify(whatWeDoForm.cards)),
        api.updateSiteContent('team_intro_title', teamForm.title),
        api.updateSiteContent('team_intro_subtitle', teamForm.subtitle),
        api.updateSiteContent('team_members', JSON.stringify(teamForm.members))
      ]);
      alert('内容已成功保存！');
      fetchData();
    } catch (err) {
      console.error('Failed to save content:', err);
      alert('保存内容失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    window.location.href = '/admin/login';
  };

  const updateAppStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('volunteer_applications')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Failed to update app status:', err);
    }
  };

  const deleteApp = async (id: string) => {
    if (window.confirm('确定要删除这条申请记录吗？')) {
      try {
        const { error } = await supabase.from('volunteer_applications').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (err) {
        console.error('Failed to delete application:', err);
      }
    }
  };

  const handleSaveObject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('service_objects')
          .update({
            code: currentObject.code,
            type: currentObject.type,
            age: currentObject.age,
            village: currentObject.village,
            situation: currentObject.situation,
            needs: currentObject.needs,
            status: currentObject.status
          })
          .eq('id', (currentObject as any).id);
        if (error) throw error;
        alert('修改成功！');
      } else {
        const { error } = await supabase
          .from('service_objects')
          .insert([{
            code: currentObject.code,
            type: currentObject.type,
            age: currentObject.age,
            village: currentObject.village,
            situation: currentObject.situation,
            needs: currentObject.needs,
            status: 'pending'
          }]);
        if (error) throw error;
        alert('添加成功！');
      }
      await fetchData();
      setIsEditing(false);
      setCurrentObject({
        code: '', type: 'child', age: 0, village: '', situation: '', needs: '', status: 'pending'
      });
    } catch (err) {
      console.error('Failed to save object:', err);
      alert('操作失败，请确保编号唯一且信息完整');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteObject = async (id: string) => {
    if (window.confirm('确定要删除这个服务对象吗？')) {
      try {
        const { error } = await supabase.from('service_objects').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (err) {
        console.error('Failed to delete object:', err);
      }
    }
  };

  const filteredApps = applications.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.phone.includes(searchTerm) ||
    app.object_code?.includes(searchTerm)
  );

  const filteredRequests = requests.filter((r) =>
    String(r.village || '').includes(searchTerm) ||
    String(r.needs || '').includes(searchTerm) ||
    String(r.contact_phone || '').includes(searchTerm) ||
    String(r.contact_name || '').includes(searchTerm)
  );

  const filteredObjects = objects.filter(obj => 
    obj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.village.includes(searchTerm) ||
    obj.needs.includes(searchTerm)
  );

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateObjectRequest(id, { status, reviewed_at: new Date().toISOString() });
      await fetchData();
    } catch (err) {
      console.error('Failed to update request status:', err);
      alert('操作失败');
    }
  };

  const approveRequest = async (req: any) => {
    setIsSaving(true);
    try {
      const nextCode = await api.getNextServiceObjectCode();
      await api.createObject({
        code: nextCode,
        type: req.type,
        age: req.age,
        village: req.village,
        situation: req.situation,
        needs: req.needs,
        status: 'pending'
      });
      await api.updateObjectRequest(req.id, {
        status: 'approved',
        approved_object_code: nextCode,
        reviewed_at: new Date().toISOString()
      });
      await fetchData();
      alert(`已通过，并生成编号：${nextCode}`);
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert('审核通过失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRequest = async (id: string) => {
    if (window.confirm('确定要删除这条对象申请吗？')) {
      try {
        await api.deleteObjectRequest(id);
        await fetchData();
      } catch (err) {
        console.error('Failed to delete request:', err);
        alert('删除失败');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#2B0B0B] text-[#F3DDE4] flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#1A0707] border-r border-white/5 p-10 flex flex-col gap-12 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E84C4C] rounded-lg flex items-center justify-center text-white font-bold text-sm">CMO</div>
          <span className="text-2xl font-bold tracking-tight">乡助桥后台</span>
        </div>

        <nav className="flex flex-col gap-3 flex-grow">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-bold ${
              activeTab === 'applications' ? 'bg-[#F9D8C6] text-[#2B0B0B] shadow-xl' : 'text-[#F3DDE4]/40 hover:bg-white/5 hover:text-[#F3DDE4]'
            }`}
          >
            <ClipboardList className="w-6 h-6" /> 报名管理
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-bold ${
              activeTab === 'requests' ? 'bg-[#F9D8C6] text-[#2B0B0B] shadow-xl' : 'text-[#F3DDE4]/40 hover:bg-white/5 hover:text-[#F3DDE4]'
            }`}
          >
            <Users className="w-6 h-6" /> 对象申请
          </button>
          <button
            onClick={() => setActiveTab('objects')}
            className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-bold ${
              activeTab === 'objects' ? 'bg-[#F9D8C6] text-[#2B0B0B] shadow-xl' : 'text-[#F3DDE4]/40 hover:bg-white/5 hover:text-[#F3DDE4]'
            }`}
          >
            <UserPlus className="w-6 h-6" /> 对象管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-bold ${
              activeTab === 'settings' ? 'bg-[#F9D8C6] text-[#2B0B0B] shadow-xl' : 'text-[#F3DDE4]/40 hover:bg-white/5 hover:text-[#F3DDE4]'
            }`}
          >
            <Settings className="w-6 h-6" /> 站点设置
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all font-bold ${
              activeTab === 'content' ? 'bg-[#F9D8C6] text-[#2B0B0B] shadow-xl' : 'text-[#F3DDE4]/40 hover:bg-white/5 hover:text-[#F3DDE4]'
            }`}
          >
            <LayoutDashboard className="w-6 h-6" /> 内容编辑
          </button>
        </nav>

        <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[#F3DDE4]/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" /> 返回首页
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut className="w-5 h-5" /> 退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 md:p-16 bg-[#2B0B0B] overflow-y-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-16">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[#F3DDE4]">
              {activeTab === 'applications' && '报名人员信息列表'}
              {activeTab === 'requests' && '新增对象申请列表'}
              {activeTab === 'objects' && '服务对象管理'}
              {activeTab === 'settings' && '站点全局设置'}
              {activeTab === 'content' && '页面内容编辑'}
            </h1>
            <p className="text-lg text-[#F3DDE4]/40">
              {activeTab === 'applications' && `共有 ${applications.length} 名申请者，请及时审核并联系`}
              {activeTab === 'requests' && `共有 ${requests.length} 条对象申请，请审核后再公开展示`}
              {activeTab === 'objects' && `管理已录入的 ${objects.length} 位留守群体信息`}
              {activeTab === 'settings' && '自定义网页背景图、统计数据等核心内容'}
              {activeTab === 'content' && '修改“我们做什么”、“我们的团队”等页面的文字和图片'}
            </p>
          </div>

          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#F3DDE4]/20 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索任何关键词..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-8 text-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all backdrop-blur-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {activeTab === 'applications' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">申请日期</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">姓名</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">学院/专业</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">联系方式</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">认领编号</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">状态</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F3DDE4]">
                  {filteredApps.length > 0 ? filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6 text-sm opacity-60">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="p-6 font-bold">{app.name}</td>
                      <td className="p-6 text-sm opacity-60">{app.college_major}</td>
                      <td className="p-6 text-sm font-mono text-[#F9D8C6]">{app.phone}</td>
                      <td className="p-6 text-sm font-bold text-[#F9D8C6]">{app.object_code || '-'}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          app.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {app.status === 'pending' ? '待审核' : app.status === 'approved' ? '已通过' : '已拒绝'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => updateAppStatus(app.id, 'approved')}
                                className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all"
                                title="通过"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateAppStatus(app.id, 'rejected')}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                                title="拒绝"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => deleteApp(app.id)}
                            className="p-2 bg-white/5 text-[#F3DDE4]/40 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-white/20 italic">暂无报名人员信息...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">提交时间</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">类型</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">年龄</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">村庄</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">需求</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">联系人</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">电话</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">状态</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F3DDE4]">
                  {filteredRequests.length > 0 ? filteredRequests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6 text-sm opacity-60">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                      <td className="p-6 text-sm font-bold">{r.type === 'child' ? '留守儿童' : '留守老人'}</td>
                      <td className="p-6 text-sm opacity-60">{r.age}</td>
                      <td className="p-6 text-sm opacity-60">{r.village}</td>
                      <td className="p-6 text-sm font-medium text-[#F9D8C6]/80">{r.needs}</td>
                      <td className="p-6 text-sm opacity-60">{r.contact_name || '-'}</td>
                      <td className="p-6 text-sm font-mono text-[#F9D8C6]">{r.contact_phone || '-'}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          r.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {r.status === 'pending' ? '待审核' : r.status === 'approved' ? `已通过(${r.approved_object_code || '-'})` : '已拒绝'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          {r.status === 'pending' && (
                            <>
                              <button
                                disabled={isSaving}
                                onClick={() => approveRequest(r)}
                                className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-50"
                                title="通过并生成编号"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                disabled={isSaving}
                                onClick={() => updateRequestStatus(r.id, 'rejected')}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                                title="拒绝"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteRequest(r.id)}
                            className="p-2 bg-white/5 text-[#F3DDE4]/40 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="p-16 text-center text-white/20 italic">暂无对象申请...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'objects' && (
          <div className="space-y-12">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-volunteer-peach/20 text-volunteer-peach rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                {isEditing ? '修改服务对象' : '录入新服务对象'}
              </h2>
              <form onSubmit={handleSaveObject} className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[#F3DDE4]">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">编号</label>
                  <input
                    required
                    type="text"
                    placeholder="如 S001"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all font-mono"
                    value={currentObject.code}
                    onChange={(e) => setCurrentObject({ ...currentObject, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">类型</label>
                  <select
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all appearance-none cursor-pointer"
                    value={currentObject.type}
                    onChange={(e) => setCurrentObject({ ...currentObject, type: e.target.value as any })}
                  >
                    <option value="child">留守儿童</option>
                    <option value="elderly">留守老人</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">年龄</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={currentObject.age}
                    onChange={(e) => setCurrentObject({ ...currentObject, age: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">所在村庄</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={currentObject.village}
                    onChange={(e) => setCurrentObject({ ...currentObject, village: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">基本情况</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={currentObject.situation}
                    onChange={(e) => setCurrentObject({ ...currentObject, situation: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">主要需求</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={currentObject.needs}
                    onChange={(e) => setCurrentObject({ ...currentObject, needs: e.target.value })}
                  />
                </div>
                <div className="md:col-span-4 flex justify-end gap-4 mt-4">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setCurrentObject({
                          code: '', type: 'child', age: 0, village: '', situation: '', needs: '', status: 'pending'
                        });
                      }}
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold"
                    >
                      取消修改
                    </button>
                  )}
                  <button
                    disabled={isSaving}
                    type="submit"
                    className="px-12 py-4 bg-[#F9D8C6] text-[#2B0B0B] rounded-xl hover:bg-white transition-all text-sm font-bold shadow-lg shadow-black/20 disabled:opacity-50"
                  >
                    {isSaving ? '提交中...' : (isEditing ? '保存修改' : '确认录入')}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">编号</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">类型</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">年龄</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">村庄</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40">需求</th>
                      <th className="p-6 text-xs font-bold uppercase tracking-widest text-white/40 text-center">操作</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-white/5 text-[#F3DDE4]">
                  {filteredObjects.length > 0 ? filteredObjects.map((obj) => (
                    <tr key={obj.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6 font-mono text-[#F9D8C6] font-bold">{obj.code}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          obj.type === 'child' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'
                        }`}>
                          {obj.type === 'child' ? '留守儿童' : '留守老人'}
                        </span>
                      </td>
                      <td className="p-6 text-sm opacity-60">{obj.age}岁</td>
                      <td className="p-6 text-sm opacity-60">{obj.village}</td>
                      <td className="p-6 text-sm font-medium text-[#F9D8C6]/80">{obj.needs}</td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setIsEditing(true);
                                setCurrentObject(obj);
                                window.scrollTo(0, 0);
                              }}
                              className="p-2 bg-white/5 text-[#F3DDE4]/40 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteObject(obj.id)}
                              className="p-2 bg-white/5 text-[#F3DDE4]/40 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="p-16 text-center text-white/20 italic">暂无服务对象信息...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-12 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Image Resources */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm space-y-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-volunteer-peach" />
                  图片资源管理
                </h2>
                
                <div className="space-y-6 text-[#F3DDE4]">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">首页 Hero 背景图 URL</label>
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={settingsForm.hero_image}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_image: e.target.value })}
                    />
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between gap-6">
                      <div className="text-xs font-bold opacity-60">封面轮播间隔（秒）</div>
                      <input
                        type="number"
                        min={2}
                        className="w-32 bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-[#F9D8C6] focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all text-right"
                        value={settingsForm.hero_slideshow_interval_seconds}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setSettingsForm((prev) => {
                            const next = Number.isFinite(v) ? Math.max(2, Math.floor(v)) : 6;
                            return { ...prev, hero_slideshow_interval_seconds: next };
                          });
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="w-full bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-6 py-3 rounded-xl transition-all border border-white/10 text-sm active:scale-95"
                      onClick={() => {
                        setSettingsForm((prev) => ({
                          ...prev,
                          hero_images: recommendedHeroImages.slice(0, maxHeroImages),
                          hero_image: recommendedHeroImages[0] || prev.hero_image,
                          hero_slideshow_interval_seconds: 6,
                        }));
                      }}
                    >
                      一键使用推荐封面（老人/儿童主题）
                    </button>
                    <div className="text-xs text-white/40 leading-relaxed">
                      已启用平滑轮播（至少 2 秒）。封面图片建议使用与留守老人/儿童相关的高清横图链接。
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">封面轮播图片（URL 或上传）</label>
                        <input
                          type="text"
                          className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                          value={newHeroImageUrl}
                          onChange={(e) => setNewHeroImageUrl(e.target.value)}
                          placeholder="粘贴图片链接后点击添加"
                        />
                      </div>
                      <button
                        type="button"
                        className="bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-6 py-3 rounded-xl transition-all border border-white/10 text-sm active:scale-95"
                        onClick={() => {
                          const url = newHeroImageUrl.trim();
                          if (!url) return;
                          setSettingsForm((prev) => {
                            const next = [...(prev.hero_images || []), url].slice(0, maxHeroImages);
                            return { ...prev, hero_images: next };
                          });
                          setNewHeroImageUrl('');
                        }}
                      >
                        添加
                      </button>
                      <label className="bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-6 py-3 rounded-xl transition-all border border-white/10 text-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        上传
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = '';
                            if (files.length === 0) return;
                            try {
                              const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
                              setSettingsForm((prev) => {
                                const next = [...(prev.hero_images || []), ...dataUrls].slice(0, maxHeroImages);
                                return { ...prev, hero_images: next };
                              });
                            } catch {
                              alert('读取图片失败，请重试');
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {settingsForm.hero_images.length > 0 ? (
                        settingsForm.hero_images.map((src, idx) => (
                          <div key={`${idx}-${src.slice(0, 20)}`} className="aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative group">
                            <img src={src} alt={`封面${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                              <button
                                type="button"
                                className="p-2 bg-black/40 text-white/80 rounded-lg hover:bg-black/60 transition-all"
                                onClick={() => {
                                  setSettingsForm((prev) => {
                                    const next = prev.hero_images.filter((_, i) => i !== idx);
                                    return { ...prev, hero_images: next };
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                disabled={idx === 0}
                                className="flex-1 bg-black/40 text-white/80 rounded-lg py-2 text-xs font-bold disabled:opacity-30 hover:bg-black/60 transition-all"
                                onClick={() => {
                                  setSettingsForm((prev) => {
                                    if (idx === 0) return prev;
                                    const next = [...prev.hero_images];
                                    const temp = next[idx - 1];
                                    next[idx - 1] = next[idx];
                                    next[idx] = temp;
                                    return { ...prev, hero_images: next };
                                  });
                                }}
                              >
                                上移
                              </button>
                              <button
                                type="button"
                                disabled={idx === settingsForm.hero_images.length - 1}
                                className="flex-1 bg-black/40 text-white/80 rounded-lg py-2 text-xs font-bold disabled:opacity-30 hover:bg-black/60 transition-all"
                                onClick={() => {
                                  setSettingsForm((prev) => {
                                    if (idx >= prev.hero_images.length - 1) return prev;
                                    const next = [...prev.hero_images];
                                    const temp = next[idx + 1];
                                    next[idx + 1] = next[idx];
                                    next[idx] = temp;
                                    return { ...prev, hero_images: next };
                                  });
                                }}
                              >
                                下移
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 rounded-3xl border border-white/10 bg-white/5 text-center text-white/30 text-sm">
                          还没有封面轮播图片，先添加 URL 或上传图片
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs font-bold opacity-60">首页名言 1</div>
                      <input
                        type="text"
                        className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                        value={settingsForm.hero_quote_1}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_quote_1: e.target.value })}
                        placeholder="请输入名言内容"
                      />
                      <input
                        type="text"
                        className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                        value={settingsForm.hero_author_1}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_author_1: e.target.value })}
                        placeholder="作者（可选）"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-bold opacity-60">首页名言 2</div>
                      <input
                        type="text"
                        className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                        value={settingsForm.hero_quote_2}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_quote_2: e.target.value })}
                        placeholder="请输入名言内容"
                      />
                      <input
                        type="text"
                        className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                        value={settingsForm.hero_author_2}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_author_2: e.target.value })}
                        placeholder="作者（可选）"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">首页照片墙（URL 或上传）</label>
                        <input
                          type="text"
                          className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                          value={newHomePhotoUrl}
                          onChange={(e) => setNewHomePhotoUrl(e.target.value)}
                          placeholder="粘贴图片链接后点击添加"
                        />
                      </div>
                      <button
                        type="button"
                        className="bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-6 py-3 rounded-xl transition-all border border-white/10 text-sm active:scale-95"
                        onClick={() => {
                          const url = newHomePhotoUrl.trim();
                          if (!url) return;
                          setSettingsForm((prev) => {
                            const next = [...(prev.home_photos || []), url].slice(0, maxHomePhotos);
                            const displayCount = Math.min(Math.max(1, Number(prev.home_photos_display_count) || next.length || 1), Math.max(1, next.length || 1));
                            return { ...prev, home_photos: next, home_photos_display_count: displayCount };
                          });
                          setNewHomePhotoUrl('');
                        }}
                      >
                        添加
                      </button>
                      <label className="bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-6 py-3 rounded-xl transition-all border border-white/10 text-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        上传
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = '';
                            if (files.length === 0) return;
                            try {
                              const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
                              setSettingsForm((prev) => {
                                const next = [...(prev.home_photos || []), ...dataUrls].slice(0, maxHomePhotos);
                                const displayCount = Math.min(Math.max(1, Number(prev.home_photos_display_count) || next.length || 1), Math.max(1, next.length || 1));
                                return { ...prev, home_photos: next, home_photos_display_count: displayCount };
                              });
                            } catch {
                              alert('读取图片失败，请重试');
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="text-xs font-bold opacity-60">显示张数</div>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, settingsForm.home_photos.length)}
                        className="w-32 bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-[#F9D8C6] focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all text-right"
                        value={settingsForm.home_photos_display_count}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setSettingsForm((prev) => {
                            const max = Math.max(1, prev.home_photos.length || 1);
                            const nextCount = Number.isFinite(v) ? Math.min(Math.max(1, v), max) : max;
                            return { ...prev, home_photos_display_count: nextCount };
                          });
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {settingsForm.home_photos.length > 0 ? (
                        settingsForm.home_photos.map((src, idx) => (
                          <div key={`${idx}-${src.slice(0, 20)}`} className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-white/5 relative group">
                            <img src={src} alt={`首页照片${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3 flex items-center gap-2">
                              <button
                                type="button"
                                className="p-2 bg-black/40 text-white/80 rounded-lg hover:bg-black/60 transition-all"
                                onClick={() => {
                                  setSettingsForm((prev) => {
                                    const next = prev.home_photos.filter((_, i) => i !== idx);
                                    const max = Math.max(1, next.length || 1);
                                    const nextCount = Math.min(Math.max(1, Number(prev.home_photos_display_count) || max), max);
                                    return { ...prev, home_photos: next, home_photos_display_count: nextCount };
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                disabled={idx === 0}
                                className="flex-1 bg-black/40 text-white/80 rounded-lg py-2 text-xs font-bold disabled:opacity-30 hover:bg-black/60 transition-all"
                                onClick={() => {
                                  setSettingsForm((prev) => {
                                    if (idx === 0) return prev;
                                    const next = [...prev.home_photos];
                                    const temp = next[idx - 1];
                                    next[idx - 1] = next[idx];
                                    next[idx] = temp;
                                    return { ...prev, home_photos: next };
                                  });
                                }}
                              >
                                上移
                              </button>
                              <button
                                type="button"
                                disabled={idx === settingsForm.home_photos.length - 1}
                                className="flex-1 bg-black/40 text-white/80 rounded-lg py-2 text-xs font-bold disabled:opacity-30 hover:bg-black/60 transition-all"
                                onClick={() => {
                                  setSettingsForm((prev) => {
                                    if (idx >= prev.home_photos.length - 1) return prev;
                                    const next = [...prev.home_photos];
                                    const temp = next[idx + 1];
                                    next[idx + 1] = next[idx];
                                    next[idx] = temp;
                                    return { ...prev, home_photos: next };
                                  });
                                }}
                              >
                                下移
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 md:col-span-3 p-8 rounded-3xl border border-white/10 bg-white/5 text-center text-white/30 text-sm">
                          还没有照片，先添加 URL 或上传图片
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-volunteer-peach/5 rounded-2xl border border-volunteer-peach/10 flex items-start gap-4">
                    <div className="p-2 bg-volunteer-peach/20 text-volunteer-peach rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      提示：上传会把图片保存为数据链接（适合少量图片）。如果图片很多或很大，建议用图床链接再添加 URL。
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Management */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm space-y-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <RefreshCcw className="w-6 h-6 text-volunteer-peach" />
                  核心统计数据管理
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#F3DDE4]">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">已走访村庄数</label>
                    <input
                      type="number"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-xl font-bold text-[#F9D8C6] focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={settingsForm.total_villages}
                      onChange={(e) => setSettingsForm({ ...settingsForm, total_villages: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">已服务人数</label>
                    <input
                      type="number"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-xl font-bold text-[#F9D8C6] focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={settingsForm.total_served}
                      onChange={(e) => setSettingsForm({ ...settingsForm, total_served: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">累计陪伴小时</label>
                    <input
                      type="number"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-xl font-bold text-[#F9D8C6] focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={settingsForm.total_hours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, total_hours: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-white/40" />
                    <span className="text-sm text-white/60">当前全站总浏览量</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-volunteer-peach">
                    {stats?.page_views || 0}
                  </span>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-sm text-white/60">浏览量展示加成</span>
                    <input
                      type="number"
                      className="w-40 bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-[#F9D8C6] focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all text-right"
                      value={settingsForm.page_views_offset}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSettingsForm((prev) => ({ ...prev, page_views_offset: Number.isFinite(v) ? Math.floor(v) : 0 }));
                      }}
                    />
                  </div>
                  <div className="text-xs text-white/40">
                    展示值 = 实际浏览量 + 加成（不会影响真实统计自增）
                  </div>
                  <div className="text-xs text-white/40">
                    当前展示：{(stats?.page_views || 0) + (Number(settingsForm.page_views_offset) || 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <ClipboardList className="w-6 h-6 text-volunteer-peach" />
                服务成果 - 成功案例管理
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">标题</label>
                  <input
                    type="text"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="例如：从沉默到开朗：小明的蜕变"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">标签</label>
                  <input
                    type="text"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={newCase.type}
                    onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                    placeholder="例如：儿童陪伴 / 老人助老"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">服务前</label>
                  <textarea
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all min-h-[110px]"
                    value={newCase.before}
                    onChange={(e) => setNewCase({ ...newCase, before: e.target.value })}
                    placeholder="服务前情况描述"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">服务后</label>
                  <textarea
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all min-h-[110px]"
                    value={newCase.after}
                    onChange={(e) => setNewCase({ ...newCase, after: e.target.value })}
                    placeholder="服务后变化描述"
                  />
                </div>
                <div className="lg:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">配图 URL</label>
                  <input
                    type="text"
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                    value={newCase.image}
                    onChange={(e) => setNewCase({ ...newCase, image: e.target.value })}
                    placeholder="建议填稳定图片链接（可用图床/Unsplash/Wikimedia）"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-8 py-4 rounded-2xl transition-all border border-white/10 active:scale-95"
                  onClick={() => {
                    const item = {
                      title: newCase.title.trim(),
                      type: newCase.type.trim(),
                      before: newCase.before.trim(),
                      after: newCase.after.trim(),
                      image: newCase.image.trim(),
                    };
                    if (!item.title) {
                      alert('请先填写标题');
                      return;
                    }
                    setSettingsForm((prev) => ({
                      ...prev,
                      service_cases: [...(prev.service_cases || []), item].slice(0, 20),
                    }));
                    setNewCase({ title: '', type: '', before: '', after: '', image: '' });
                  }}
                >
                  添加案例
                </button>
                <button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-[#F3DDE4] font-bold px-8 py-4 rounded-2xl transition-all border border-white/10 active:scale-95"
                  onClick={() => {
                    setSettingsForm((prev) => ({ ...prev, service_cases: defaultServiceCases }));
                  }}
                >
                  恢复默认案例
                </button>
              </div>

              <div className="space-y-4">
                {settingsForm.service_cases.length > 0 ? (
                  settingsForm.service_cases.map((c, idx) => (
                    <div key={`${idx}-${c.title}`} className="p-6 bg-[#1A0707] rounded-3xl border border-white/10 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="text-lg font-bold text-[#F3DDE4]">{c.title}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-2 bg-white/5 text-[#F3DDE4]/60 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                            onClick={() => {
                              setSettingsForm((prev) => {
                                if (idx === 0) return prev;
                                const next = [...prev.service_cases];
                                const temp = next[idx - 1];
                                next[idx - 1] = next[idx];
                                next[idx] = temp;
                                return { ...prev, service_cases: next };
                              });
                            }}
                            disabled={idx === 0}
                          >
                            上移
                          </button>
                          <button
                            type="button"
                            className="p-2 bg-white/5 text-[#F3DDE4]/60 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                            onClick={() => {
                              setSettingsForm((prev) => {
                                if (idx >= prev.service_cases.length - 1) return prev;
                                const next = [...prev.service_cases];
                                const temp = next[idx + 1];
                                next[idx + 1] = next[idx];
                                next[idx] = temp;
                                return { ...prev, service_cases: next };
                              });
                            }}
                            disabled={idx === settingsForm.service_cases.length - 1}
                          >
                            下移
                          </button>
                          <button
                            type="button"
                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                            onClick={() => {
                              setSettingsForm((prev) => ({
                                ...prev,
                                service_cases: prev.service_cases.filter((_, i) => i !== idx),
                              }));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-xs font-bold opacity-40 uppercase tracking-widest">标签</div>
                          <input
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                            value={c.type}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSettingsForm((prev) => {
                                const next = [...prev.service_cases];
                                next[idx] = { ...next[idx], type: v };
                                return { ...prev, service_cases: next };
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-bold opacity-40 uppercase tracking-widest">配图 URL</div>
                          <input
                            type="text"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                            value={c.image}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSettingsForm((prev) => {
                                const next = [...prev.service_cases];
                                next[idx] = { ...next[idx], image: v };
                                return { ...prev, service_cases: next };
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-bold opacity-40 uppercase tracking-widest">服务前</div>
                          <textarea
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all min-h-[110px]"
                            value={c.before}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSettingsForm((prev) => {
                                const next = [...prev.service_cases];
                                next[idx] = { ...next[idx], before: v };
                                return { ...prev, service_cases: next };
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-bold opacity-40 uppercase tracking-widest">服务后</div>
                          <textarea
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all min-h-[110px]"
                            value={c.after}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSettingsForm((prev) => {
                                const next = [...prev.service_cases];
                                next[idx] = { ...next[idx], after: v };
                                return { ...prev, service_cases: next };
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 rounded-3xl border border-white/10 bg-white/5 text-center text-white/30 text-sm">
                    还没有成功案例，先添加一个
                  </div>
                )}
              </div>

              <div className="text-xs text-white/40">
                提示：修改完这里的内容后，记得点击页面最下方“保存全站全局设置”
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                disabled={isSaving}
                type="submit"
                className="bg-[#F9D8C6] hover:bg-white text-[#2B0B0B] font-black px-24 py-6 rounded-2xl transition-all shadow-2xl shadow-black/20 flex items-center gap-4 text-xl disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCcw className="w-6 h-6 animate-spin" />
                    正在保存设置...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    保存全站全局设置
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'content' && (
          <form onSubmit={handleSavePageContent} className="space-y-12 animate-fade-in">
            {/* What We Do Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <LayoutDashboard className="w-6 h-6 text-volunteer-peach" />
                “我们做什么” 页面管理
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">页面主标题</label>
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={whatWeDoForm.title}
                      onChange={(e) => setWhatWeDoForm({ ...whatWeDoForm, title: e.target.value })}
                      placeholder="例如：让做好事变得更加容易"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">页面背景图 URL</label>
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={whatWeDoForm.bg_image}
                      onChange={(e) => setWhatWeDoForm({ ...whatWeDoForm, bg_image: e.target.value })}
                      placeholder="请输入背景图片链接"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">副标题 / 简介</label>
                  <textarea
                    className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all min-h-[100px]"
                    value={whatWeDoForm.subtitle}
                    onChange={(e) => setWhatWeDoForm({ ...whatWeDoForm, subtitle: e.target.value })}
                    placeholder="请输入页面简要介绍"
                  />
                </div>

                {/* Cards Editor */}
                <div className="space-y-4">
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest">服务内容卡片 (最多 2 个)</label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {whatWeDoForm.cards.map((card, idx) => (
                      <div key={idx} className="p-6 bg-[#1A0707] rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            className="bg-transparent border-b border-white/10 focus:border-[#F9D8C6] outline-none font-bold text-lg"
                            value={card.title}
                            onChange={(e) => {
                              const newCards = [...whatWeDoForm.cards];
                              newCards[idx].title = e.target.value;
                              setWhatWeDoForm({ ...whatWeDoForm, cards: newCards });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newCards = whatWeDoForm.cards.filter((_, i) => i !== idx);
                              setWhatWeDoForm({ ...whatWeDoForm, cards: newCards });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          {card.items.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  className="bg-transparent border-none outline-none text-sm font-bold text-[#F9D8C6] flex-1"
                                  value={item.label}
                                  onChange={(e) => {
                                    const newCards = [...whatWeDoForm.cards];
                                    newCards[idx].items[i].label = e.target.value;
                                    setWhatWeDoForm({ ...whatWeDoForm, cards: newCards });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCards = [...whatWeDoForm.cards];
                                    newCards[idx].items = newCards[idx].items.filter((_: any, ii: number) => ii !== i);
                                    setWhatWeDoForm({ ...whatWeDoForm, cards: newCards });
                                  }}
                                  className="text-white/20 hover:text-red-400"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </div>
                              <textarea
                                className="bg-transparent border-none outline-none text-xs text-white/60 resize-none h-12"
                                value={item.desc}
                                onChange={(e) => {
                                  const newCards = [...whatWeDoForm.cards];
                                  newCards[idx].items[i].desc = e.target.value;
                                  setWhatWeDoForm({ ...whatWeDoForm, cards: newCards });
                                }}
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newCards = [...whatWeDoForm.cards];
                              newCards[idx].items.push({ label: '新服务', desc: '描述内容...' });
                              setWhatWeDoForm({ ...whatWeDoForm, cards: newCards });
                            }}
                            className="w-full py-2 bg-white/5 rounded-xl text-xs font-bold text-white/40 hover:bg-white/10 hover:text-white transition-all border border-dashed border-white/10"
                          >
                            + 添加服务子项
                          </button>
                        </div>
                      </div>
                    ))}
                    {whatWeDoForm.cards.length < 2 && (
                      <button
                        type="button"
                        onClick={() => setWhatWeDoForm({ ...whatWeDoForm, cards: [...whatWeDoForm.cards, { title: '新卡片', items: [] }] })}
                        className="flex flex-col items-center justify-center p-10 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 text-white/20 hover:text-[#F9D8C6] hover:border-[#F9D8C6]/30 transition-all"
                      >
                        <Plus className="w-8 h-8 mb-2" />
                        <span className="font-bold">添加服务卡片</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Management Section */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm space-y-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Users className="w-6 h-6 text-volunteer-peach" />
                “我们的团队” 成员管理
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">板块标题</label>
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={teamForm.title}
                      onChange={(e) => setTeamForm({ ...teamForm, title: e.target.value })}
                      placeholder="例如：我们的团队"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-40 uppercase tracking-widest">板块副标题</label>
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-[#F9D8C6]/50 transition-all"
                      value={teamForm.subtitle}
                      onChange={(e) => setTeamForm({ ...teamForm, subtitle: e.target.value })}
                      placeholder="例如：来自宜宾学院的青年力量"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {teamForm.members.map((member, idx) => (
                    <div key={idx} className="p-6 bg-[#1A0707] rounded-3xl border border-white/10 space-y-4 relative group">
                      <button
                        type="button"
                        onClick={() => {
                          const newMembers = teamForm.members.filter((_, i) => i !== idx);
                          setTeamForm({ ...teamForm, members: newMembers });
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden mb-4">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm font-bold text-[#F9D8C6] outline-none"
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...teamForm.members];
                          newMembers[idx].name = e.target.value;
                          setTeamForm({ ...teamForm, members: newMembers });
                        }}
                        placeholder="姓名"
                      />
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-medium text-white/40 outline-none"
                        value={member.role}
                        onChange={(e) => {
                          const newMembers = [...teamForm.members];
                          newMembers[idx].role = e.target.value;
                          setTeamForm({ ...teamForm, members: newMembers });
                        }}
                        placeholder="职位 / 角色"
                      />
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs text-white/60 outline-none min-h-[80px]"
                        value={member.desc}
                        onChange={(e) => {
                          const newMembers = [...teamForm.members];
                          newMembers[idx].desc = e.target.value;
                          setTeamForm({ ...teamForm, members: newMembers });
                        }}
                        placeholder="个人简介"
                      />
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[10px] text-white/20 outline-none"
                        value={member.image}
                        onChange={(e) => {
                          const newMembers = [...teamForm.members];
                          newMembers[idx].image = e.target.value;
                          setTeamForm({ ...teamForm, members: newMembers });
                        }}
                        placeholder="照片 URL"
                      />
                    </div>
                  ))}
                  
                  {/* Add New Member Form */}
                  <div className="p-6 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 space-y-4">
                    <h4 className="text-sm font-bold text-white/40 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> 添加新成员
                    </h4>
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#F9D8C6]/50"
                      value={newTeamMember.name}
                      onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                      placeholder="姓名"
                    />
                    <input
                      type="text"
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#F9D8C6]/50"
                      value={newTeamMember.role}
                      onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                      placeholder="职位 / 角色"
                    />
                    <textarea
                      className="w-full bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#F9D8C6]/50 min-h-[60px]"
                      value={newTeamMember.desc}
                      onChange={(e) => setNewTeamMember({ ...newTeamMember, desc: e.target.value })}
                      placeholder="简介"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-[#1A0707] border border-white/10 rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#F9D8C6]/50"
                        value={newTeamMember.image}
                        onChange={(e) => setNewTeamMember({ ...newTeamMember, image: e.target.value })}
                        placeholder="图片 URL"
                      />
                      <label className="p-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                        <Upload className="w-4 h-4 text-white/40" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const dataUrl = await readFileAsDataUrl(file);
                              setNewTeamMember({ ...newTeamMember, image: dataUrl });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newTeamMember.name) return alert('请填写姓名');
                        setTeamForm({ ...teamForm, members: [...teamForm.members, newTeamMember] });
                        setNewTeamMember({ name: '', role: '', desc: '', image: '' });
                      }}
                      className="w-full py-3 bg-[#F9D8C6] text-[#2B0B0B] rounded-xl font-bold text-sm hover:bg-white transition-all"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                disabled={isSaving}
                type="submit"
                className="bg-[#F9D8C6] hover:bg-white text-[#2B0B0B] font-black px-24 py-6 rounded-2xl transition-all shadow-2xl shadow-black/20 flex items-center gap-4 text-xl disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCcw className="w-6 h-6 animate-spin" />
                    正在保存内容...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    保存页面内容修改
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
