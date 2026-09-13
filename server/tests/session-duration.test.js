const test = require('node:test');
const assert = require('node:assert/strict');
const { getSessionWindowState, normalizeDurationMinutes, buildSessionWindow, getSessionLearnerIds, isSessionParticipant } = require('../controllers/sessionController');

test('normalizeDurationMinutes rejects missing duration selection during scheduling', () => {
    assert.equal(normalizeDurationMinutes(undefined), null);
    assert.equal(normalizeDurationMinutes(0), null);
    assert.equal(normalizeDurationMinutes(45), 45);
});

test('buildSessionWindow keeps the join window inside the mentor-selected duration', () => {
    const start = new Date('2025-01-15T10:00:00Z');
    const duration = 45;
    const now = new Date('2025-01-15T10:30:00Z');

    const windowState = buildSessionWindow({ startTime: start, endTime: new Date(start.getTime() + duration * 60 * 1000) }, now);

    assert.equal(windowState.isLive, true);
    assert.equal(windowState.isUpcoming, false);
    assert.equal(windowState.isCompleted, false);
    assert.equal(windowState.joinAllowed, true);

    const afterEnd = buildSessionWindow({ startTime: start, endTime: new Date(start.getTime() + duration * 60 * 1000) }, new Date('2025-01-15T10:46:00Z'));
    assert.equal(afterEnd.joinAllowed, false);
});

test('multi-learner sessions treat all selected learners as valid participants', () => {
    const session = {
        mentor: 'mentor_123',
        learner: 'learner_1',
        learners: ['learner_1', 'learner_2', 'learner_3']
    };

    assert.deepEqual(getSessionLearnerIds(session), ['learner_1', 'learner_2', 'learner_3']);
    assert.equal(isSessionParticipant(session, 'learner_2'), true);
    assert.equal(isSessionParticipant(session, 'mentor_123'), true);
    assert.equal(isSessionParticipant(session, 'learner_99'), false);
});
