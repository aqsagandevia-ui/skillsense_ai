import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reviewAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ReviewCard from '../components/ui/ReviewCard';

export default function MentorReviews() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [ratingFilter, setRatingFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'mentor') {
      navigate('/');
      return;
    }
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');

    try {
      const rating = ratingFilter === 'all' ? null : Number(ratingFilter);
      const [reviewsRes, statsRes] = await Promise.all([
        reviewAPI.getMentorReviews('me', rating),
        reviewAPI.getMentorStats('me')
      ]);

      setReviews(reviewsRes.data.reviews || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Fetch mentor reviews error', err);
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mentor Reviews</h1>
            <p className="text-slate-500 mt-1">See all of your learner feedback and rating trends.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/mentor-dashboard')} className="bg-white text-slate-700 border border-slate-300">Back to Dashboard</Button>
            <Button onClick={() => setRatingFilter('all')} className={ratingFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'}>All</Button>
            {[5,4,3,2,1].map((value) => (
              <Button
                key={value}
                onClick={() => setRatingFilter(value.toString())}
                className={ratingFilter === String(value) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'}
              >
                {value}★
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <Card>
              <div className="space-y-2">
                <div className="text-sm text-slate-500">Average Rating</div>
                <div className="text-4xl font-bold text-slate-900">{stats?.averageRating ?? 'N/A'}★</div>
                <div className="text-sm text-slate-500">{stats?.totalReviews ?? 0} reviews</div>
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-3">Rating Distribution</h2>
              <div className="space-y-3">
                {stats?.ratingDistribution?.map((item) => (
                  <div key={item.rating} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-slate-600">{item.rating}★</div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${stats.totalReviews ? (item.count / stats.totalReviews) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm text-slate-500">{item.count}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">All Reviews</h2>
                  <p className="text-sm text-slate-500">Sorted newest first.</p>
                </div>
                <div className="text-sm text-slate-500">{reviews.length} results</div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-slate-500">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="py-16 text-center text-slate-500">No reviews available.</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
