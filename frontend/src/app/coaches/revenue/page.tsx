"use client"

import { useState, useEffect } from 'react'
import CoachPageWrapper from '@/components/CoachPageWrapper'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Star,
  Target,
  BarChart3
} from 'lucide-react'
import axios from 'axios'

export default function CoachRevenuePage() {
  const [revenueData, setRevenueData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const API_URL = getApiUrl()

  useEffect(() => {
    loadRevenueData()
  }, [selectedPeriod])

  const loadRevenueData = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`${API_URL}/api/coach/revenue?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setRevenueData(response.data.data)
      }
    } catch (error) {
      console.error('Error loading revenue data:', error)
      setError('Failed to load revenue data')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <CoachPageWrapper title="Revenue & Performance" description="Track your earnings and performance metrics">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      </CoachPageWrapper>
    )
  }

  const stats = revenueData?.stats || {}
  const trends = revenueData?.trends || {}

  return (
    <CoachPageWrapper title="Revenue & Performance" description="Track your earnings and performance metrics">
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2 dark:text-white">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'quarter', label: 'This Quarter' },
            { key: 'year', label: 'This Year' }
          ].map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key)}
            >
              {period.label}
            </Button>
          ))}
        </div>
        
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue || '0.00'}</div>
            <div className={`text-xs flex items-center ${
              (trends.revenueChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(trends.revenueChange || 0) >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trends.revenueChange || 0)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessionsCompleted || 0}</div>
            <div className={`text-xs flex items-center ${
              (trends.sessionsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(trends.sessionsChange || 0) >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trends.sessionsChange || 0)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating || '0.0'}</div>
            <div className="text-xs text-muted-foreground">
              Based on {stats.totalReviews || 0} reviews
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients || 0}</div>
            <div className={`text-xs flex items-center ${
              (trends.clientsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(trends.clientsChange || 0) >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trends.clientsChange || 0)}% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Session Completion Rate</span>
              <span className="text-sm font-bold">{stats.completionRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.completionRate || 0}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Client Retention Rate</span>
              <span className="text-sm font-bold">{stats.retentionRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${stats.retentionRate || 0}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">On-Time Performance</span>
              <span className="text-sm font-bold">{stats.onTimeRate || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${stats.onTimeRate || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Key Performance Indicators</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm font-medium text-green-700">Revenue Goal Progress</div>
              <div className="text-lg font-bold">${stats.totalRevenue || 0} / ${stats.revenueGoal || 5000}</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(((stats.totalRevenue || 0) / (stats.revenueGoal || 5000)) * 100)}% of goal achieved
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm font-medium text-blue-700">Average Session Revenue</div>
              <div className="text-lg font-bold">${stats.avgSessionRevenue || '0.00'}</div>
              <div className="text-xs text-muted-foreground">
                Per completed session
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm font-medium text-purple-700">Total Hours Coached</div>
              <div className="text-lg font-bold">{stats.totalHours || 0}h</div>
              <div className="text-xs text-muted-foreground">
                This {selectedPeriod}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Revenue Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading recent activity...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(revenueData?.recentActivity || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Complete sessions to see revenue activity</p>
                </div>
              ) : (
                (revenueData?.recentActivity || []).map((activity: any, index: number) => {
                  const isRefunded = activity.status === 'refunded' || activity.status === 'partially_refunded';
                  const refundAmount = activity.refundAmount || 0;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          isRefunded
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                          <DollarSign className={`w-4 h-4 ${
                            isRefunded
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Session with {activity.clientName}
                            {isRefunded && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                                {activity.status === 'partially_refunded' ? 'Partially Refunded' : 'Refunded'}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isRefunded ? (
                          <>
                            <p className="font-bold text-red-600 line-through">+${activity.amount}</p>
                            {refundAmount > 0 && (
                              <p className="text-xs text-red-600">-${refundAmount} refunded</p>
                            )}
                          </>
                        ) : (
                          <p className="font-bold text-green-600">+${activity.amount}</p>
                        )}
                        <p className="text-xs text-gray-500">{activity.duration}min</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </CoachPageWrapper>
  )
}