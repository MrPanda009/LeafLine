'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRole } from '@/hooks/useRole'
import Header from '@/components/Header'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

// Development backdoor
const DEV_BACKDOOR = true

// Hardcoded data for the dashboard
const dashboardData = {
  totalReports: 24,
  inProgress: 8,
  resolved: 13,
  pending: 3,
  responseRate: 87,
  averageResolutionTime: 4.5,
  
  categoryDistribution: [
    { name: 'Waste Management', value: 35, color: '#00DF81' },
    { name: 'Street Lights', value: 20, color: '#829c86' },
    { name: 'Road Damage', value: 25, color: '#FFB800' },
    { name: 'Water Supply', value: 10, color: '#00A8E8' },
    { name: 'Other', value: 10, color: '#032221' },
  ],
  
  monthlyTrend: [
    { month: 'Aug', reports: 12, resolved: 10 },
    { month: 'Sep', reports: 18, resolved: 14 },
    { month: 'Oct', reports: 22, resolved: 18 },
    { month: 'Nov', reports: 28, resolved: 24 },
    { month: 'Dec', reports: 24, resolved: 20 },
    { month: 'Jan', reports: 30, resolved: 26 },
  ],
  
  recentActivity: [
    { id: 'CLV-2024-024', type: 'Resolved', category: 'Waste Management', location: 'Connaught Place', date: '2 hours ago', status: 'resolved' },
    { id: 'CLV-2024-023', type: 'In Progress', category: 'Street Light', location: 'Karol Bagh', date: '5 hours ago', status: 'progress' },
    { id: 'CLV-2024-022', type: 'Submitted', category: 'Road Damage', location: 'Dwarka Sector 12', date: '1 day ago', status: 'pending' },
    { id: 'CLV-2024-021', type: 'Resolved', category: 'Water Supply', location: 'Rohini Sector 7', date: '2 days ago', status: 'resolved' },
  ],
  
  impactScore: 92,
  contributionRank: 'Top 15%',
}

export default function CitizenDashboard() {
  const router = useRouter()
  const { role, loading, user } = useRole()
  const [activeTab, setActiveTab] = useState<'overview' | 'map'>('overview')

  useEffect(() => {
    if (!DEV_BACKDOOR && !loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (!DEV_BACKDOOR && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!DEV_BACKDOOR && !user) return null

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#FDFBD4] to-[#F1F5F9] pt-24">
        <main className="max-w-7xl mx-auto py-8 px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-[#032221] mb-2">Your Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's your civic engagement overview</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Impact Score</div>
                  <div className="text-3xl font-bold text-[#00DF81]">{dashboardData.impactScore}</div>
                </div>
                <div className="w-20 h-20">
                  <svg className="transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#00DF81"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - dashboardData.impactScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'overview'
                    ? 'text-[#00DF81] border-b-2 border-[#00DF81]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === 'map'
                    ? 'text-[#00DF81] border-b-2 border-[#00DF81]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Map View
              </button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#00DF81] hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                      <p className="text-3xl font-bold text-[#032221]">{dashboardData.totalReports}</p>
                      <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-[#00DF81]/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#00DF81]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">In Progress</p>
                      <p className="text-3xl font-bold text-[#032221]">{dashboardData.inProgress}</p>
                      <p className="text-xs text-blue-600 mt-1">{((dashboardData.inProgress/dashboardData.totalReports)*100).toFixed(0)}% of total</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Resolved</p>
                      <p className="text-3xl font-bold text-[#032221]">{dashboardData.resolved}</p>
                      <p className="text-xs text-green-600 mt-1">{((dashboardData.resolved/dashboardData.totalReports)*100).toFixed(0)}% success rate</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#FFB800] hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Resolution</p>
                      <p className="text-3xl font-bold text-[#032221]">{dashboardData.averageResolutionTime}d</p>
                      <p className="text-xs text-[#FFB800] mt-1">Days to resolve</p>
                    </div>
                    <div className="w-12 h-12 bg-[#FFB800]/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#FFB800]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Monthly Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-[#032221] mb-6">Monthly Activity Trend</h3>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {dashboardData.monthlyTrend.map((data, index) => {
                      const maxValue = Math.max(...dashboardData.monthlyTrend.map(d => d.reports))
                      const reportsHeight = (data.reports / maxValue) * 100
                      const resolvedHeight = (data.resolved / maxValue) * 100
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex items-end justify-center space-x-1 mb-2" style={{ height: '200px' }}>
                            <div className="relative group flex-1">
                              <div
                                className="w-full bg-[#00DF81] rounded-t-lg transition-all hover:opacity-80"
                                style={{ height: `${reportsHeight}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-[#032221] opacity-0 group-hover:opacity-100 transition-opacity">
                                  {data.reports}
                                </span>
                              </div>
                            </div>
                            <div className="relative group flex-1">
                              <div
                                className="w-full bg-[#829c86] rounded-t-lg transition-all hover:opacity-80"
                                style={{ height: `${resolvedHeight}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-[#032221] opacity-0 group-hover:opacity-100 transition-opacity">
                                  {data.resolved}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-gray-600">{data.month}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#00DF81] rounded"></div>
                      <span className="text-sm text-gray-600">Reported</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#829c86] rounded"></div>
                      <span className="text-sm text-gray-600">Resolved</span>
                    </div>
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-[#032221] mb-6">Issues by Category</h3>
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-48 h-48">
                      <svg className="transform -rotate-90" viewBox="0 0 100 100">
                        {dashboardData.categoryDistribution.map((cat, index) => {
                          const total = dashboardData.categoryDistribution.reduce((sum, c) => sum + c.value, 0)
                          const startAngle = dashboardData.categoryDistribution.slice(0, index).reduce((sum, c) => sum + (c.value / total) * 360, 0)
                          const angle = (cat.value / total) * 360
                          const radius = 40
                          const circumference = 2 * Math.PI * radius
                          const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`
                          const strokeDashoffset = -((startAngle / 360) * circumference)
                          
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke={cat.color}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                            />
                          )
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#032221]">100%</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dashboardData.categoryDistribution.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-gray-700">{cat.name}</span>
                        </div>
                        <span className="font-bold text-[#032221]">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#032221]">Recent Activity</h3>
                    <Link href="/citizen-app/my-reports" className="text-sm text-[#00DF81] hover:underline font-medium">
                      View All →
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {dashboardData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'resolved' ? 'bg-green-500' :
                            activity.status === 'progress' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}></div>
                          <div>
                            <p className="font-bold text-[#032221] text-sm">{activity.id}</p>
                            <p className="text-xs text-gray-600">{activity.category} • {activity.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            activity.status === 'resolved' ? 'text-green-600' :
                            activity.status === 'progress' ? 'text-blue-600' : 'text-yellow-600'
                          }`}>
                            {activity.type}
                          </p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions & Stats */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-[#00DF81] to-[#00c972] rounded-xl shadow-lg p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Link href="/citizen-app/report" className="block bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-3 transition-all">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="font-medium">New Report</span>
                        </div>
                      </Link>
                      <Link href="/citizen-app/my-reports" className="block bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-3 transition-all">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium">My Reports</span>
                        </div>
                      </Link>
                      <Link href="/citizen-app/about" className="block bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg p-3 transition-all">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">My Profile</span>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Contribution Stats */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-[#032221] mb-4">Your Impact</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Response Rate</span>
                          <span className="text-sm font-bold text-[#032221]">{dashboardData.responseRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00DF81] rounded-full" style={{ width: `${dashboardData.responseRate}%` }}></div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-1">Community Rank</p>
                        <p className="text-2xl font-bold text-[#00DF81]">{dashboardData.contributionRank}</p>
                        <p className="text-xs text-gray-500 mt-1">Keep up the great work! 🎉</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-[#032221] mb-4">Civic Issues Map</h3>
              <MapComponent />
            </div>
          )}
        </main>
      </div>
    </>
  )
}
