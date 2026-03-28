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
  const [activeTab, setActiveTab] = useState<'applications' | 'requests' | 'objects' | 'settings'>('applications');
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
    home_photos: [] as string[],
    home_photos_display_count: 0
  });
  const [newHomePhotoUrl, setNewHomePhotoUrl] = useState('');

  const maxHomePhotos = 20;

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

      const homePhotos = getHomePhotosFromContent(content);
      const displayCountRaw = Number(content?.home_photos_display_count);
      const displayCount = Number.isFinite(displayCountRaw) && displayCountRaw > 0
        ? Math.min(displayCountRaw, Math.max(homePhotos.length, 1))
        : Math.max(homePhotos.length, 1);

      setSettingsForm({
        total_served: statsData.total_served || 0,
        total_hours: statsData.total_hours || 0,
        total_villages: statsData.total_villages || 0,
        hero_image: content.hero_image || '',
        home_photos: homePhotos,
        home_photos_display_count: displayCount
      });
    } catch (err) {
      console.error('Critical error in dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (!isAdmin) {
      window.location.href = '/admin/login';
      return;
    }
    fetchData();
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
      const homePhotos = (settingsForm.home_photos || []).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).slice(0, maxHomePhotos);
      const displayCount = Math.min(
        Math.max(1, Number(settingsForm.home_photos_display_count) || homePhotos.length || 1),
        Math.max(1, homePhotos.length || 1),
      );

      await Promise.all([
        api.updateGlobalStats({
          total_served: settingsForm.total_served,
          total_hours: settingsForm.total_hours,
          total_villages: settingsForm.total_villages
        }),
        api.updateSiteContent('hero_image', settingsForm.hero_image),
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
            </h1>
            <p className="text-lg text-[#F3DDE4]/40">
              {activeTab === 'applications' && `共有 ${applications.length} 名申请者，请及时审核并联系`}
              {activeTab === 'requests' && `共有 ${requests.length} 条对象申请，请审核后再公开展示`}
              {activeTab === 'objects' && `管理已录入的 ${objects.length} 位留守群体信息`}
              {activeTab === 'settings' && '自定义网页背景图、统计数据等核心内容'}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
