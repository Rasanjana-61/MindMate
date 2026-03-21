import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { changePassword, updateProfile, uploadProfileAvatar } from '../lib/auth';

export function Profile({ user, onLogout, onUserUpdate }) {
  const [profileForm, setProfileForm] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    bio: user.bio || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setProfileForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
  }, [user]);

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileMessage('');
    setProfileError('');
  };

  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const response = await updateProfile({
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        bio: profileForm.bio,
      });
      onUserUpdate(response.user);
      setProfileMessage(response.message);
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    setIsSavingPassword(true);
    setPasswordMessage('');
    setPasswordError('');

    try {
      const response = await changePassword(passwordForm);
      setPasswordMessage(response.message);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const response = await uploadProfileAvatar(file);
      onUserUpdate(response.user);
      setProfileMessage(response.message);
    } catch (error) {
      setProfileError(error.message || 'Failed to upload image.');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-5xl mx-auto">
      <div className="md:hidden mb-4">
        <h2 className="text-2xl font-bold text-wellness-text">Profile & Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <motion.div variants={itemVariants} className="card p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-wellness-blue to-blue-500"></div>

            <div className="relative z-10">
              <div className="w-28 h-28 bg-white rounded-full mx-auto flex items-center justify-center mb-5 border-4 border-white shadow-xl relative group overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-wellness-blue-light to-wellness-blue-mid flex items-center justify-center">
                    <span className="text-4xl font-bold text-wellness-blue">{user.avatar}</span>
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-white text-xs font-bold flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      Change
                    </span>
                  )}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

              <h2 className="text-2xl font-bold text-wellness-text mb-1">{user.name}</h2>
              <div className="flex justify-center mb-2">
                <span className="bg-wellness-blue-light text-wellness-blue text-xs font-bold px-3 py-1 rounded-full">{user.faculty}</span>
              </div>
              <p className="text-sm font-medium text-wellness-text-sec mb-8">{user.email}</p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                <span className="bg-wellness-bg text-wellness-text-sec text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">{user.role}</span>
                <span className="bg-wellness-bg text-wellness-text-sec text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">{user.year}</span>
                <span className="bg-wellness-bg text-wellness-text-sec text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">{user.semester}</span>
              </div>

              <div className="space-y-3">
                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary w-full py-3 flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  Update Photo
                </button>
                <button onClick={onLogout} className="w-full py-3 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        <div className="lg:col-span-8 space-y-6">
          <motion.div variants={itemVariants} className="card p-6 md:p-8">
            <h3 className="text-xl font-bold text-wellness-text mb-6 flex items-center gap-3">
              <div className="bg-wellness-blue-light p-2 rounded-lg">
                <UserCircle2 className="w-5 h-5 text-wellness-blue" />
              </div>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">Full Name</label>
                <input
                  value={profileForm.fullName}
                  onChange={(e) => handleProfileFieldChange('fullName', e.target.value)}
                  className="w-full p-3.5 bg-wellness-bg border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-wellness-blue/20 focus:border-wellness-blue outline-none text-sm transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-wellness-text-muted" />
                  <input
                    value={profileForm.phone}
                    onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                    className="w-full pl-10 p-3.5 bg-wellness-bg border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-wellness-blue/20 focus:border-wellness-blue outline-none text-sm transition-all"
                    placeholder="Optional phone number"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">University Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-wellness-text-muted" />
                  <input value={user.email} disabled className="w-full pl-10 p-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-wellness-text-sec" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">Academic Access</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-wellness-bg rounded-xl text-center text-xs font-bold text-wellness-text-sec">{user.faculty}</div>
                  <div className="p-3 bg-wellness-bg rounded-xl text-center text-xs font-bold text-wellness-text-sec">{user.year}</div>
                  <div className="p-3 bg-wellness-bg rounded-xl text-center text-xs font-bold text-wellness-text-sec">{user.semester}</div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-bold text-wellness-text mb-2">Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => handleProfileFieldChange('bio', e.target.value)}
                maxLength={300}
                className="w-full p-4 min-h-28 bg-wellness-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-wellness-blue/20 focus:border-wellness-blue outline-none text-sm transition-all resize-none"
                placeholder="Tell other students a little about yourself"
              />
              <p className="mt-2 text-xs text-wellness-text-muted text-right">{profileForm.bio.length}/300</p>
            </div>

            {(profileMessage || profileError) && (
              <div className={`mb-4 p-3 rounded-xl text-sm border ${profileError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                {profileError || profileMessage}
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="card p-6 md:p-8">
            <h3 className="text-xl font-bold text-wellness-text mb-6 flex items-center gap-3">
              <div className="bg-wellness-peach-light/50 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-wellness-peach" />
              </div>
              Security
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">Current Password</label>
                <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full p-3.5 bg-wellness-bg border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-wellness-blue/20 focus:border-wellness-blue outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">New Password</label>
                <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="w-full p-3.5 bg-wellness-bg border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-wellness-blue/20 focus:border-wellness-blue outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-wellness-text mb-2">Confirm New Password</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full p-3.5 bg-wellness-bg border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-wellness-blue/20 focus:border-wellness-blue outline-none text-sm transition-all" />
              </div>
            </div>

            {(passwordMessage || passwordError) && (
              <div className={`mt-5 p-3 rounded-xl text-sm border ${passwordError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                {passwordError || passwordMessage}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={handlePasswordSave} disabled={isSavingPassword} className="btn-secondary px-6 py-3 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end pt-2">
            <button onClick={handleProfileSave} disabled={isSavingProfile} className="btn-primary px-10 py-3.5 shadow-lg shadow-wellness-blue/20 text-base flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
