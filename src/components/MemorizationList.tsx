'use client';

import { useState, useEffect } from 'react';
import { MemorizationItem } from '@/lib/spacedRepetition';
import { getAllMemorizationItems, removeMemorizationItem } from '@/lib/storage';
import { getDueItems, getUpcomingReviews } from '@/lib/spacedRepetition';
import { formatAyahRange, getSurahName } from '@/lib/quran';
import { FILTER_TYPES, SORT_TYPES, DATE_FORMAT } from '@/lib/constants';
import { getTodayISODate } from '@/lib/utils';

interface MemorizationListProps {
  onReview: (item: MemorizationItem) => void;
  onRefresh: () => void;
}

export default function MemorizationList({ onReview, onRefresh }: MemorizationListProps) {
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'nextReview' | 'createdAt' | 'reviewCount'>('nextReview');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    const allItems = getAllMemorizationItems();
    setItems(allItems);
  };

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to remove this memorization item?')) {
      removeMemorizationItem(id);
      loadItems();
      onRefresh();
    }
  };

  const getFilteredItems = () => {
    let filtered = items;

    switch (filter) {
      case 'due':
        filtered = getDueItems(items);
        break;
      case 'upcoming':
        filtered = getUpcomingReviews(items, 7);
        break;
      default:
        filtered = items;
    }

    // Sort items
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nextReview':
          return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'reviewCount':
          return b.reviewCount - a.reviewCount;
        default:
          return 0;
      }
    });
  };

  const getStatusColor = (item: MemorizationItem) => {
    const today = getTodayISODate();
    const reviewDate = new Date(item.nextReview);
    const daysUntilReview = Math.ceil((reviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (item.nextReview <= today) {
      return 'text-red-600 dark:text-red-400';
    } else if (daysUntilReview <= 3) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-green-600 dark:text-green-400';
    }
  };

  const getStatusText = (item: MemorizationItem) => {
    const today = getTodayISODate();
    const reviewDate = new Date(item.nextReview);
    const daysUntilReview = Math.ceil((reviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (item.nextReview <= today) {
      return 'Due for review';
    } else if (daysUntilReview === 1) {
      return 'Due tomorrow';
    } else if (daysUntilReview <= 7) {
      return `Due in ${daysUntilReview} days`;
    } else {
      return `Due in ${daysUntilReview} days`;
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="quran-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Memorization List ({filteredItems.length})
        </h2>
        <button
          onClick={loadItems}
          className="btn-secondary text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters and Sort */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Items</option>
            <option value="due">Due for Review</option>
            <option value="upcoming">Upcoming (7 days)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="nextReview">Next Review</option>
            <option value="createdAt">Date Added</option>
            <option value="reviewCount">Review Count</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No memorization items found</p>
          <p className="text-sm">Add some Quran passages to start memorizing!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {getSurahName(item.surah)} • {item.ayahEnd - item.ayahStart + 1} ayahs
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={getStatusColor(item)}>
                      {getStatusText(item)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Reviews: {item.reviewCount}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Interval: {item.interval} days
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.nextReview <= getTodayISODate() && (
                    <button
                      onClick={() => onReview(item)}
                      className="btn-primary text-sm"
                    >
                      Review Now
                    </button>
                  )}
                  <button
                    onClick={() => onReview(item)}
                    className="btn-secondary text-sm"
                  >
                    Practice
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="btn-danger text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 