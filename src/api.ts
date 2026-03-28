import { supabase } from './lib/supabase';

export const api = {
  // Auth
  login: async ({ username, password }: any) => {
    // For this specific project requirement, we use the provided credentials
    if (username === 'xiangzhuqiao' && password === 'xiangzhuqiao') {
      // Mock a successful login by setting a flag in localStorage
      localStorage.setItem('isAdminLoggedIn', 'true');
      return { user: { role: 'admin' }, token: 'mock-admin-token' };
    }
    throw new Error('账号或密码错误');
  },

  logout: async () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminToken');
  },

  checkAuth: () => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  },

  // Stats
  incrementView: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have stats for today
    const { data: existingStats, error: fetchError } = await supabase
      .from('website_stats')
      .select('*')
      .eq('stat_date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching stats:', fetchError);
      return;
    }

    if (existingStats) {
      // Update existing
      await supabase
        .from('website_stats')
        .update({ page_views: (existingStats.page_views || 0) + 1 })
        .eq('stat_date', today);
    } else {
      // Create new for today
      await supabase
        .from('website_stats')
        .insert({ stat_date: today, page_views: 1 });
    }
  },

  getStats: async () => {
    const { data, error } = await supabase
      .from('website_stats')
      .select('*')
      .order('stat_date', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    // Fallback to defaults if no data found
    return data?.[0] || { total_served: 156, total_hours: 2340, total_villages: 12, page_views: 0 };
  },

  // Site Content
  getSiteContent: async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('*');
    if (error) throw error;
    
    // Convert to object for easier access
    return data.reduce((acc: any, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  },

  updateSiteContent: async (key: string, value: string) => {
    const { data, error } = await supabase
      .from('site_content')
      .upsert({ key, value }, { onConflict: 'key' })
      .select();
    if (error) throw error;
    return data?.[0];
  },

  updateGlobalStats: async (stats: { total_served: number, total_hours: number, total_villages: number }) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('website_stats')
      .update(stats)
      .eq('stat_date', today)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  // Service Objects
  getObjects: async () => {
    const { data, error } = await supabase
      .from('service_objects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createObject: async (data: any) => {
    const { data: result, error } = await supabase
      .from('service_objects')
      .insert(data)
      .select();
    if (error) throw error;
    return result?.[0];
  },

  updateObject: async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('service_objects')
      .update(data)
      .eq('id', id)
      .select();
    if (error) throw error;
    return result?.[0];
  },

  deleteObject: async (id: string) => {
    const { error } = await supabase
      .from('service_objects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Applications
  getApplications: async () => {
    const { data, error } = await supabase
      .from('volunteer_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  submitApplication: async (data: any) => {
    const { data: result, error } = await supabase
      .from('volunteer_applications')
      .insert(data)
      .select();
    if (error) throw error;
    return result?.[0];
  },

  updateApplicationStatus: async (id: string, status: string) => {
    const { data: result, error } = await supabase
      .from('volunteer_applications')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return result?.[0];
  },

  deleteApplication: async (id: string) => {
    const { error } = await supabase
      .from('volunteer_applications')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Service Object Requests (public submissions)
  submitObjectRequest: async (data: any) => {
    const { data: result, error } = await supabase
      .from('service_object_requests')
      .insert(data)
      .select();
    if (error) throw error;
    return result?.[0];
  },

  getObjectRequests: async () => {
    const { data, error } = await supabase
      .from('service_object_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  updateObjectRequest: async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('service_object_requests')
      .update(data)
      .eq('id', id)
      .select();
    if (error) throw error;
    return result?.[0];
  },

  deleteObjectRequest: async (id: string) => {
    const { error } = await supabase
      .from('service_object_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  getNextServiceObjectCode: async () => {
    const { data, error } = await supabase
      .from('service_objects')
      .select('code')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const codes = (data || []).map((x: any) => String(x.code || '')).filter(Boolean);
    let max = 0;
    for (const c of codes) {
      const m = c.match(/(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n)) max = Math.max(max, n);
      }
    }
    const next = max + 1;
    return `S${String(next).padStart(3, '0')}`;
  },
};
