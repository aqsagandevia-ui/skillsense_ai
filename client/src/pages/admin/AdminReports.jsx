import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const StatCard = ({ title, value, color }) => (
  <div className={`rounded-2xl p-5 shadow-sm ${color}`}>
    <div className="text-sm text-white/80">{title}</div>
    <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
  </div>
);

const ChartBar = ({ label, value, max }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-700">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
const AdminReports = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getReviewAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  const {
    totalReviews,
    averageRating,
    ratingDistribution,
    sentimentDistribution,
    monthlyReviews,
    topMentors,
    topStrengths,
    areasOfImprovement,
    frequentlyMentionedSkills,
    positiveReviewPercentage,
    negativeReviewPercentage,
    overallSummary,
  } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
        <StatCard title="Total Reviews" value={totalReviews} color="bg-indigo-600" />
        <StatCard title="Average Rating" value={averageRating.toFixed(1)} color="bg-green-600" />
        <StatCard title="Positive %" value={`${positiveReviewPercentage}%`} color="bg-blue-600" />
        <StatCard title="Negative %" value={`${negativeReviewPercentage}%`} color="bg-red-600" />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-3">Review Summary</h3>
        <p className="text-slate-600">{overallSummary}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Rating Distribution</h4>
          <div className="space-y-3">
            {ratingDistribution.map((item) => (
              <ChartBar key={item.rating} label={`${item.rating} ★`} value={item.count} max={Math.max(...ratingDistribution.map((i) => i.count), 1)} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Sentiment Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(sentimentDistribution).map(([sentiment, count]) => (
              <ChartBar key={sentiment} label={sentiment} value={count} max={Math.max(...Object.values(sentimentDistribution), 1)} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Monthly Reviews</h4>
          <div className="space-y-3">
            {monthlyReviews.map((item) => (
              <ChartBar key={item.label} label={item.label} value={item.count} max={Math.max(...monthlyReviews.map((i) => i.count), 1)} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Top Strengths</h4>
          <ul className="space-y-2 text-slate-700">
            {topStrengths.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Areas of Improvement</h4>
          <ul className="space-y-2 text-slate-700">
            {areasOfImprovement.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Frequently Mentioned Keywords</h4>
          <ul className="space-y-2 text-slate-700">
            {frequentlyMentionedSkills.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h4 className="text-lg font-semibold mb-4">Top Mentors by Reviews</h4>
        <div className="space-y-3">
          {topMentors.map((mentor) => (
            <div key={mentor._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{mentor.name}</div>
                  <div className="text-sm text-slate-500">{mentor.reviewCount} reviews</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900">{mentor.averageRating} ★</div>
                  <div className="text-sm text-slate-500">{mentor.positiveReviewRate}% positive</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
