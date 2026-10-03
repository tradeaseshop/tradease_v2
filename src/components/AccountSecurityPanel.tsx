import React, { useState, useRef } from 'react';
import { User, Lock, Camera, ShieldCheck, Mail, Smartphone, Check, X, Loader2, Store } from 'lucide-react';
import { UserSession } from '../types';
import * as api from '../api';

interface AccountSecurityPanelProps {
  currentUser: UserSession;
  onUserUpdated: (updates: Partial<UserSession>) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
  showStoreLogo?: boolean; // vendor only
}

export default function AccountSecurityPanel({ currentUser, onUserUpdated, onToast, showStoreLogo }: AccountSecurityPanelProps) {
  // ---------- Profile ----------
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await api.updateMyProfile({ name: name.trim(), phone: phone.trim() });
      onUserUpdated({ name: updated.name, phone: updated.phone });
      onToast('Profile updated.', 'success');
    } catch (e: any) {
      onToast(e.message || 'Could not update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- Avatar ----------
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarSelected = async (file: File | undefined) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { avatar } = await api.uploadMyAvatar(file);
      onUserUpdated({ avatar });
      onToast('Profile picture updated.', 'success');
    } catch (e: any) {
      onToast(e.message || 'Could not upload image.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ---------- Store logo (vendor only) ----------
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  const handleLogoSelected = async (file: File | undefined) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { logo } = await api.uploadMyStoreLogo(file);
      setStoreLogo(logo);
      onToast('Store logo updated.', 'success');
    } catch (e: any) {
      onToast(e.message || 'Could not upload logo.', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ---------- Password ----------
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return onToast('New password must be at least 6 characters.', 'error');
    if (newPassword !== confirmPassword) return onToast("New passwords don't match.", 'error');
    setSavingPassword(true);
    try {
      await api.changeMyPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast('Password changed.', 'success');
    } catch (e: any) {
      onToast(e.message || 'Could not change password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // ---------- Email verification ----------
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleRequestCode = async () => {
    setSendingCode(true);
    try {
      const result = await api.requestEmailVerification();
      if (result.alreadyVerified) {
        onUserUpdated({ emailVerified: true });
      } else {
        setCodeSent(true);
        onToast(result.delivered ? 'Verification code sent to your email.' : "Verification code generated (check with support if you don't receive an email).", 'success');
      }
    } catch (e: any) {
      onToast(e.message || 'Could not send verification code.', 'error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    setVerifying(true);
    try {
      await api.confirmEmailVerification(verifyCode.trim());
      onUserUpdated({ emailVerified: true });
      setCodeSent(false);
      onToast('Email verified!', 'success');
    } catch (e: any) {
      onToast(e.message || 'Incorrect code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // ---------- 2FA ----------
  const [totpEnabled, setTotpEnabled] = useState(!!currentUser.totpEnabled);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [totpSetupCode, setTotpSetupCode] = useState('');
  const [totpBusy, setTotpBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  const handleStart2FASetup = async () => {
    setTotpBusy(true);
    try {
      const data = await api.setup2FA();
      setSetupData(data);
    } catch (e: any) {
      onToast(e.message || 'Could not start 2FA setup.', 'error');
    } finally {
      setTotpBusy(false);
    }
  };

  const handleConfirm2FA = async () => {
    setTotpBusy(true);
    try {
      await api.enable2FA(totpSetupCode.trim());
      setTotpEnabled(true);
      setSetupData(null);
      setTotpSetupCode('');
      onUserUpdated({ totpEnabled: true });
      onToast('Two-factor authentication enabled.', 'success');
    } catch (e: any) {
      onToast(e.message || 'Incorrect code.', 'error');
    } finally {
      setTotpBusy(false);
    }
  };

  const handleDisable2FA = async () => {
    setTotpBusy(true);
    try {
      await api.disable2FA(disablePassword);
      setTotpEnabled(false);
      setShowDisableForm(false);
      setDisablePassword('');
      onUserUpdated({ totpEnabled: false });
      onToast('Two-factor authentication turned off.', 'success');
    } catch (e: any) {
      onToast(e.message || 'Incorrect password.', 'error');
    } finally {
      setTotpBusy(false);
    }
  };

  const inputClass = "w-full p-2.5 rounded-xl border border-gray-250 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-950 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold text-xs";
  const labelClass = "text-[10px] font-bold text-gray-400 uppercase block mb-1";

  return (
    <div className="space-y-4">
      {/* Profile photo + basic info */}
      <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-4">
        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Profile</h4>

        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-800" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl font-black">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md"
            >
              {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleAvatarSelected(e.target.files?.[0])}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="font-bold text-gray-900 dark:text-white">{currentUser.name}</p>
            <p>{currentUser.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 812 345 6789" className={inputClass} />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Store logo (vendor only) */}
      {showStoreLogo && (
        <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" /> Store Brand Image
          </h4>
          <p className="text-[10px] text-gray-400">This is your store's logo, shown to buyers browsing your products — separate from your personal profile picture above.</p>
          <div className="flex items-center gap-3">
            {storeLogo ? (
              <img src={storeLogo} alt="Store logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-800" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-gray-400">
                <Store className="w-6 h-6" />
              </div>
            )}
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="px-3 py-2 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer"
            >
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleLogoSelected(e.target.files?.[0])}
            />
          </div>
        </div>
      )}

      {/* Email verification */}
      <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Email Verification
        </h4>
        {currentUser.emailVerified ? (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
            <Check className="w-4 h-4" /> Verified
          </div>
        ) : codeSent ? (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400">Enter the 6-digit code sent to {currentUser.email}.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={`${inputClass} text-center tracking-[0.3em]`}
            />
            <button
              onClick={handleConfirmCode}
              disabled={verifying || verifyCode.length !== 6}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              {verifying ? 'Verifying...' : 'Confirm Code'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleRequestCode}
            disabled={sendingCode}
            className="px-3 py-2 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer"
          >
            {sendingCode ? 'Sending...' : 'Verify My Email'}
          </button>
        )}
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Change Password
        </h4>
        <div className="space-y-2">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className={inputClass} />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className={inputClass} />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={inputClass} />
          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="w-full py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            {savingPassword ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white dark:bg-slate-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-3">
        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Two-Factor Authentication
        </h4>

        {totpEnabled ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
              <Check className="w-4 h-4" /> Enabled
            </div>
            {showDisableForm ? (
              <div className="space-y-2">
                <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="Confirm your password" className={inputClass} />
                <div className="flex gap-2">
                  <button onClick={handleDisable2FA} disabled={totpBusy || !disablePassword} className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer">
                    {totpBusy ? 'Please wait...' : 'Turn Off 2FA'}
                  </button>
                  <button onClick={() => setShowDisableForm(false)} className="px-3 py-2 bg-gray-100 dark:bg-slate-900 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDisableForm(true)} className="text-[11px] text-red-500 font-bold cursor-pointer">Turn off 2FA</button>
            )}
          </div>
        ) : setupData ? (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-400">Scan this QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code it shows.</p>
            <img src={setupData.qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40 mx-auto rounded-xl border border-gray-200 dark:border-gray-800" />
            <p className="text-[9px] text-gray-400 text-center font-mono break-all">Can't scan? Enter manually: {setupData.secret}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpSetupCode}
              onChange={(e) => setTotpSetupCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className={`${inputClass} text-center tracking-[0.3em]`}
            />
            <div className="flex gap-2">
              <button onClick={handleConfirm2FA} disabled={totpBusy || totpSetupCode.length !== 6} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer">
                {totpBusy ? 'Verifying...' : 'Confirm & Enable'}
              </button>
              <button onClick={() => setSetupData(null)} className="px-3 py-2 bg-gray-100 dark:bg-slate-900 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleStart2FASetup}
            disabled={totpBusy}
            className="px-3 py-2 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-800 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {totpBusy ? 'Loading...' : 'Set Up 2FA'}
          </button>
        )}
      </div>
    </div>
  );
}
