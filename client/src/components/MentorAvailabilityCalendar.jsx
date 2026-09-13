import { useMemo, useState } from 'react';

const bookedStatuses = new Set(['scheduled', 'in-progress']);
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatMonth = (date) => date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
});

const sameDay = (first, second) => (
    first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate()
);

export default function MentorAvailabilityCalendar({ sessions }) {
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
    const today = new Date();

    const calendarDays = useMemo(() => {
        const firstDay = startOfMonth(visibleMonth);
        const lastDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
        const leadingDays = firstDay.getDay();
        const totalDays = Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7;

        return Array.from({ length: totalDays }, (_, index) => {
            const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - leadingDays + 1);
            return { date, inMonth: date.getMonth() === visibleMonth.getMonth() };
        });
    }, [visibleMonth]);

    const sessionsByDay = useMemo(() => {
        const grouped = new Map();
        sessions.filter((session) => bookedStatuses.has(session.status) && session.scheduledAt).forEach((session) => {
            const date = new Date(session.scheduledAt);
            const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const daySessions = grouped.get(key) || [];
            daySessions.push(session);
            grouped.set(key, daySessions);
        });
        return grouped;
    }, [sessions]);

    const getSessionsForDay = (date) => (
        sessionsByDay.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`) || []
    );

    const moveMonth = (offset) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Session availability</h3>
                    <p className="text-sm text-slate-500">Booked time from your scheduled sessions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-50">&lt;</button>
                    <div className="min-w-36 text-center text-sm font-semibold text-slate-800">{formatMonth(visibleMonth)}</div>
                    <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:bg-slate-50">&gt;</button>
                    <button type="button" onClick={() => setVisibleMonth(startOfMonth(new Date()))} className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-200">Today</button>
                </div>
            </div>

            <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-slate-200">
                {weekDays.map((day) => (
                    <div key={day} className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500">{day}</div>
                ))}
                {calendarDays.map(({ date, inMonth }) => {
                    const daySessions = getSessionsForDay(date);
                    return (
                        <div key={date.toISOString()} className={`min-h-28 border-b border-r border-slate-200 p-2 ${inMonth ? 'bg-white' : 'bg-slate-50/70'}`}>
                            <div className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs ${sameDay(date, today) ? 'bg-indigo-600 font-semibold text-white shadow-sm' : inMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                                {date.getDate()}
                            </div>
                            <div className="space-y-1.5">
                                {daySessions.map((session) => (
                                    <div
                                        key={session._id}
                                        title={`${session.learner?.name || 'Learner'} - ${session.skillTopic?.skillName || 'Session'}`}
                                        className={`truncate rounded-lg px-1.5 py-1 text-[11px] font-medium ${session.status === 'in-progress' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}
                                    >
                                        {new Date(session.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {session.learner?.name || 'Session'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Scheduled</span>
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />In progress</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{sessions.filter((session) => bookedStatuses.has(session.status) && session.scheduledAt).length} booked sessions</span>
            </div>
        </section>
    );
}