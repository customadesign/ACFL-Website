'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import {
  User,
  Upload,
  X,
  Save,
  Mail,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function AdminProfile() {
  const API_URL = getApiUrl();
  const [adminProfile, setAdminProfile] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    profile_photo?: string | null;
  } | null>(null);
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAdminProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
    }
  };

  const handleProfilePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage({ type: 'error', message: 'File size must be less than 5MB' });
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        setSaveMessage({ type: 'error', message: 'Please select an image file' });
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }
      setSelectedProfilePhoto(file);
    }
  };

  const handleProfilePhotoUpload = async () => {
    if (!selectedProfilePhoto) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('attachment', selectedProfilePhoto);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/upload-attachment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        // Update profile with new photo URL
        const updateResponse = await fetch(`${API_URL}/api/admin/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profile_photo: result.data.url })
        });

        const updateResult = await updateResponse.json();
        if (updateResult.success) {
          setAdminProfile(prev => prev ? { ...prev, profile_photo: result.data.url } : null);
          setSelectedProfilePhoto(null);
          setSaveMessage({ type: 'success', message: 'Profile photo updated successfully!' });
          setTimeout(() => setSaveMessage(null), 3000);
        } else {
          throw new Error(updateResult.message || 'Failed to update profile photo');
        }
      } else {
        throw new Error(result.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Profile photo upload error:', error);
      setSaveMessage({ type: 'error', message: 'Failed to upload profile photo. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const updateAdminProfile = (field: string, value: string) => {
    setAdminProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const saveAdminProfile = async () => {
    if (!adminProfile) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: adminProfile.first_name,
          last_name: adminProfile.last_name
        })
      });

      const result = await response.json();
      if (result.success) {
        setSaveMessage({ type: 'success', message: 'Profile updated successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setSaveMessage({ type: 'error', message: 'Failed to update profile. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage your personal information and profile settings</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className={`p-4 rounded-xl border ${
            saveMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {saveMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <p className={`text-sm font-medium ${
                saveMessage.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {saveMessage.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Profile Photo Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Profile Photo
              </h3>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Current Photo */}
                <div className="flex-shrink-0">
                  {adminProfile?.profile_photo ? (
                    <img
                      src={adminProfile.profile_photo}
                      alt="Admin Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                      <User className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Photo Upload Controls */}
                <div className="flex-1 min-w-0 space-y-4">
                  {selectedProfilePhoto ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm text-blue-800 dark:text-blue-200 flex-1 truncate">
                          Selected: {selectedProfilePhoto.name}
                        </div>
                        <button
                          onClick={() => setSelectedProfilePhoto(null)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleProfilePhotoUpload}
                          disabled={uploadingPhoto}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {uploadingPhoto ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {uploadingPhoto ? 'Uploading...' : 'Upload'}
                        </button>
                        <button
                          onClick={() => setSelectedProfilePhoto(null)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload a new profile photo. Max size: 5MB. Accepted formats: JPG, PNG, GIF
                      </p>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoSelect}
                          className="hidden"
                        />
                        <div className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                          <Upload className="w-4 h-4" />
                          Choose Photo
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={adminProfile?.first_name || ''}
                    onChange={(e) => updateAdminProfile('first_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter your first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={adminProfile?.last_name || ''}
                    onChange={(e) => updateAdminProfile('last_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={adminProfile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Email address cannot be changed
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={saveAdminProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
