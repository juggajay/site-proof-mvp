'use client'

import { useState } from 'react'
import { Building2, Save, Edit3, Users, MapPin, Globe, Mail } from 'lucide-react'

export default function OrganizationSettingsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [orgData, setOrgData] = useState({
    name: 'Default Organization',
    description: 'Construction quality assurance and inspection management',
    website: 'https://example.com',
    email: 'admin@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Construction Ave, Builder City, BC 12345',
    industry: 'Construction & Engineering',
    size: '50-100 employees',
    timezone: 'UTC-8 (Pacific Time)',
    language: 'English'
  })

  const handleSave = () => {
    // Save organization data
    setIsEditing(false)
    // In real app, this would call an API
    console.log('Saving organization data:', orgData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
                <p className="text-sm text-gray-500">Manage your organization's profile and preferences</p>
              </div>
            </div>
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-6">
        {/* Organization Profile */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Organization Profile</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={orgData.name}
                    onChange={(e) => setOrgData({...orgData, name: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{orgData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                {isEditing ? (
                  <select
                    value={orgData.industry}
                    onChange={(e) => setOrgData({...orgData, industry: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option>Construction & Engineering</option>
                    <option>Architecture</option>
                    <option>Real Estate Development</option>
                    <option>Infrastructure</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">{orgData.industry}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={orgData.description}
                    onChange={(e) => setOrgData({...orgData, description: e.target.value})}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{orgData.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={orgData.email}
                    onChange={(e) => setOrgData({...orgData, email: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{orgData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={orgData.phone}
                    onChange={(e) => setOrgData({...orgData, phone: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{orgData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={orgData.website}
                    onChange={(e) => setOrgData({...orgData, website: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    <a href={orgData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      {orgData.website}
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Size
                </label>
                {isEditing ? (
                  <select
                    value={orgData.size}
                    onChange={(e) => setOrgData({...orgData, size: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>50-100 employees</option>
                    <option>101-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">{orgData.size}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={orgData.address}
                    onChange={(e) => setOrgData({...orgData, address: e.target.value})}
                    rows={2}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{orgData.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              System Preferences
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                {isEditing ? (
                  <select
                    value={orgData.timezone}
                    onChange={(e) => setOrgData({...orgData, timezone: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-7 (Mountain Time)</option>
                    <option>UTC-6 (Central Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">{orgData.timezone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                {isEditing ? (
                  <select
                    value={orgData.language}
                    onChange={(e) => setOrgData({...orgData, language: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">{orgData.language}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}