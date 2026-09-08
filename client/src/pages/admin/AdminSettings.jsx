import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    appName: '',
    maintenance: false,
    emailUser: '',
    emailPass: '',
    emailFromName: ''
  });

  useEffect(() => {
    let mounted = true;
    adminAPI.getSettings()
      .then(res => {
        if (!mounted) return;
        const settings = res.data?.settings || {};
        setForm(prev => ({
          ...prev,
          appName: settings.appName || prev.appName,
          maintenance: settings.maintenance === 'true' || settings.maintenance === true,
          emailUser: settings.emailUser || prev.emailUser,
          emailPass: settings.emailPass || prev.emailPass,
          emailFromName: settings.emailFromName || prev.emailFromName
        }));
      })
      .catch(err => console.error(err))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // send only changed/needed fields
      const payload = {
        appName: form.appName,
        maintenance: form.maintenance,
        emailUser: form.emailUser,
        emailPass: form.emailPass,
        emailFromName: form.emailFromName
      };
      // client-side validation
      if (!payload.appName || payload.appName.trim().length < 2) {
        toast.error('App Name is required');
        setSaving(false);
        return;
      }
      if (payload.emailUser && !/^\S+@\S+\.\S+$/.test(payload.emailUser)) {
        toast.error('Email User must be a valid email');
        setSaving(false);
        return;
      }
      if (payload.emailPass && payload.emailPass.length > 0 && payload.emailPass.length < 8) {
        toast.error('Email password must be at least 8 characters');
        setSaving(false);
        return;
      }

      await adminAPI.updateSettings(payload);
      toast.success('Settings saved');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.msg || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const [showPass, setShowPass] = useState(false);

  if (loading) return <div>Loading settings...</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">App Name</label>
          <input name="appName" value={form.appName} onChange={handleChange} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="inline-flex items-center">
            <input name="maintenance" type="checkbox" checked={form.maintenance} onChange={handleChange} className="mr-2" />
            <span>Maintenance Mode</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">Email User</label>
          <input name="emailUser" value={form.emailUser} onChange={handleChange} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium">Email Password (app password)</label>
          <div className="mt-1 relative">
            <input name="emailPass" type={showPass ? 'text' : 'password'} value={form.emailPass} onChange={handleChange} className="block w-full rounded border px-3 py-2" />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-2 top-2 text-sm text-gray-600">
              {showPass ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Store an app password for sending emails (optional in dev).</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Email From Name</label>
          <input name="emailFromName" value={form.emailFromName} onChange={handleChange} className="mt-1 block w-full rounded border px-3 py-2" />
        </div>

        <div>
          <button disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
