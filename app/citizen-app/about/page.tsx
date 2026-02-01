'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRole } from '@/hooks/useRole'

interface UserProfile {
  id: string
  email: string
  role: string
  phone_number: string | null
  kyc_verified: boolean
  is_blocked: boolean
  spam_strikes: number
  house_no: string | null
  colony_name: string | null
  pincode: string | null
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useRole()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    phone_number: '',
    house_no: '',
    colony_name: '',
    pincode: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data as UserProfile)
      setFormData({
        phone_number: data.phone_number || '',
        house_no: data.house_no || '',
        colony_name: data.colony_name || '',
        pincode: data.pincode || ''
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile')
        return
      }

      alert('Profile updated successfully!')
      setEditing(false)
      fetchProfile()
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBD4] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00DF81]"></div>
          <p className="text-gray-700 mt-4">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FDFBD4] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Profile not found</p>
          <button
            onClick={() => router.push('/citizen-app')}
            className="mt-4 px-6 py-2 bg-[#00DF81] text-[#032221] rounded-lg hover:bg-[#00c972]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBD4] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/citizen-app')}
            className="text-[#032221] hover:text-[#00DF81] mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Account Status */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.kyc_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.kyc_verified ? '✓ KYC Verified' : '⚠ KYC Pending'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_blocked 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {profile.is_blocked ? '🚫 Blocked' : '✓ Active'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Role: {profile.role}
                </span>
              </div>
            </div>
            {profile.spam_strikes > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  ⚠️ Spam Strikes: {profile.spam_strikes}/3
                </p>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-[#00DF81] text-[#032221] rounded-lg hover:bg-[#00c972] transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  disabled={!editing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House/Flat No.</label>
                <input
                  type="text"
                  value={formData.house_no}
                  onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
                  disabled={!editing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Enter house/flat number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colony/Area Name</label>
                <input
                  type="text"
                  value={formData.colony_name}
                  onChange={(e) => setFormData({ ...formData, colony_name: e.target.value })}
                  disabled={!editing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Enter colony/area name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  disabled={!editing}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                    editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                  }`}
                  placeholder="Enter pincode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <input
                  type="text"
                  value={new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            {editing && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-[#00DF81] text-[#032221] font-medium rounded-lg hover:bg-[#00c972] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      phone_number: profile.phone_number || '',
                      house_no: profile.house_no || '',
                      colony_name: profile.colony_name || '',
                      pincode: profile.pincode || ''
                    })
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
