'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllMemorizationItems, getDailyReviewData, DailyReviewData } from '@/lib/storage';
import { MemorizationItem, getDueItems, getUpcomingReviews, resetDailyCompletions } from '@/lib/spacedRepetition';
import { formatAyahRange } from '@/lib/quran';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, CheckCircle, BookOpen, ArrowLeft, BarChart3, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function StatisticsPage() {
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [dueItems, setDueItems] = useState<MemorizationItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<MemorizationItem[]>([]);
  const [chartData, setChartData] = useState<DailyReviewData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Get all memorization items
    const allItems = getAllMemorizationItems();
    
    // Reset daily completions for items completed on previous days
    const resetItems = resetDailyCompletions(allItems);
    
    const due = getDueItems(resetItems);
    const upcoming = getUpcomingReviews(resetItems, 7); // Next 7 days

    setItems(resetItems);
    setDueItems(due);
    setUpcomingItems(upcoming);
    
    // Load chart data
    const dailyData = getDailyReviewData(30); // Last 30 days
    setChartData(dailyData);
  };

  const totalItems = items.length;
  const completedToday = items.filter(item => item.reviewCount > 0).length;

  const getAverageInterval = () => {
    if (items.length === 0) return 0;
    const totalInterval = items.reduce((sum, item) => sum + item.interval, 0);
    return Math.round(totalInterval / items.length);
  };

  const getMostReviewedSurah = () => {
    if (items.length === 0) return null;
    const surahCounts: { [key: number]: number } = {};
    items.forEach(item => {
      surahCounts[item.surah] = (surahCounts[item.surah] || 0) + item.reviewCount;
    });
    const maxSurah = Object.entries(surahCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    return { surah: parseInt(maxSurah[0]), reviews: maxSurah[1] };
  };

  const getProgressByLevel = () => {
    const levels = {
      new: items.filter(item => item.interval <= 1).length,
      beginner: items.filter(item => item.interval > 1 && item.interval <= 3).length,
      intermediate: items.filter(item => item.interval > 3 && item.interval <= 7).length,
      advanced: items.filter(item => item.interval > 7 && item.interval <= 14).length,
      mastered: items.filter(item => item.interval > 14).length,
    };
    return levels;
  };

  const getRecentActivity = () => {
    return items
      .filter(item => item.reviewCount > 0)
      .sort((a, b) => new Date(b.lastReviewed || '').getTime() - new Date(a.lastReviewed || '').getTime())
      .slice(0, 10);
  };

  const mostReviewed = getMostReviewedSurah();
  const progressByLevel = getProgressByLevel();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Statistics</h1>
                <p className="text-muted-foreground">
                  Track your Quran memorization progress and insights
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Today</p>
                  <p className="text-2xl font-bold">{dueItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">This Week</p>
                  <p className="text-2xl font-bold">{upcomingItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Summary Stats */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Reviews</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {chartData.reduce((sum, day) => sum + day.reviews, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Total Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {chartData.reduce((sum, day) => sum + day.completedItems, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">New Items</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {chartData.reduce((sum, day) => sum + day.newItems, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Active Days</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {chartData.filter(day => day.reviews > 0 || day.completedItems > 0 || day.newItems > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Reviews Per Day Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Daily Activity</span>
              </CardTitle>
              <CardDescription>
                Bar chart showing daily reviews, completions, and new items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        }}
                        formatter={(value, name) => [
                          value, 
                          name === 'reviews' ? 'Reviews' : 
                          name === 'completedItems' ? 'Completed' : 
                          name === 'newItems' ? 'New Items' : name
                        ]}
                      />
                      <Bar dataKey="reviews" fill="#3b82f6" name="reviews" />
                      <Bar dataKey="completedItems" fill="#10b981" name="completedItems" />
                      <Bar dataKey="newItems" fill="#f59e0b" name="newItems" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No review data available</p>
                  <p className="text-xs">Start reviewing your items to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Review Trends</span>
              </CardTitle>
              <CardDescription>
                Line chart showing review trends over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                        }}
                        formatter={(value, name) => [
                          value, 
                          name === 'reviews' ? 'Reviews' : 
                          name === 'completedItems' ? 'Completed' : 
                          name === 'newItems' ? 'New Items' : name
                        ]}
                      />
                      <Line type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} name="reviews" />
                      <Line type="monotone" dataKey="completedItems" stroke="#10b981" strokeWidth={2} name="completedItems" />
                      <Line type="monotone" dataKey="newItems" stroke="#f59e0b" strokeWidth={2} name="newItems" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No review data available</p>
                  <p className="text-xs">Start reviewing your items to see trends here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Progress Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Interval</span>
                <span className="font-medium">{getAverageInterval()} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Reviews</span>
                <span className="font-medium">{items.reduce((sum, item) => sum + item.reviewCount, 0)}</span>
              </div>
              {mostReviewed && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Most Reviewed</span>
                  <span className="font-medium">Surah {mostReviewed.surah} ({mostReviewed.reviews} reviews)</span>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Progress by Level</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">New to Me</span>
                    <Badge variant="outline">{progressByLevel.new}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Beginner</span>
                    <Badge variant="outline">{progressByLevel.beginner}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Intermediate</span>
                    <Badge variant="outline">{progressByLevel.intermediate}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Advanced</span>
                    <Badge variant="outline">{progressByLevel.advanced}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Mastered</span>
                    <Badge variant="outline">{progressByLevel.mastered}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)}</p>
                        <p className="text-xs text-muted-foreground">{item.reviewCount} reviews</p>
                      </div>
                      <Badge variant="secondary">{item.interval}d</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Start reviewing your items to see activity here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
              <CardDescription>
                Comprehensive breakdown of your memorization progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Surah Distribution */}
                <div>
                  <h4 className="font-medium mb-3">Surah Distribution</h4>
                  <div className="space-y-2">
                    {(() => {
                      const surahCounts: { [key: number]: number } = {};
                      items.forEach(item => {
                        surahCounts[item.surah] = (surahCounts[item.surah] || 0) + 1;
                      });
                      return Object.entries(surahCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([surah, count]) => (
                          <div key={surah} className="flex justify-between items-center">
                            <span className="text-sm">Surah {surah}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Review Frequency */}
                <div>
                  <h4 className="font-medium mb-3">Review Frequency</h4>
                  <div className="space-y-2">
                    {(() => {
                      const intervalCounts: { [key: number]: number } = {};
                      items.forEach(item => {
                        intervalCounts[item.interval] = (intervalCounts[item.interval] || 0) + 1;
                      });
                      return Object.entries(intervalCounts)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .slice(0, 5)
                        .map(([interval, count]) => (
                          <div key={interval} className="flex justify-between items-center">
                            <span className="text-sm">{interval} days</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="font-medium mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Items Due</span>
                      <Badge variant="destructive">{dueItems.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Items This Week</span>
                      <Badge variant="secondary">{upcomingItems.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Reviews</span>
                      <Badge variant="outline">
                        {items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item.reviewCount, 0) / items.length) : 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 