import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = {
  _id?: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason?: string;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('mona@example.com');

  useEffect(() => {
    const encodedEmail = encodeURIComponent(userEmail);
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodedEmail}`)
      .then((data) => {
        setWorkouts(data.suggestions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load workout suggestions');
        setLoading(false);
      });
  }, [userEmail]);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p role="alert" className="text-danger">
            Unable to load workout suggestions: {error}
          </p>
        </div>
      </section>
    );
  }

  if (workouts.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Workout suggestions</h2>
          <p>Recommend workouts from activity patterns.</p>
          <p role="status">No workout suggestions available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        <div className="mb-3">
          <label htmlFor="user-email" className="form-label">
            User Email:
          </label>
          <input
            id="user-email"
            type="email"
            className="form-control"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </div>
        <div className="list-group">
          {workouts.map((workout, idx) => (
            <div key={workout._id || idx} className="list-group-item">
              <h5 className="mb-2">{workout.title}</h5>
              <p className="mb-2">
                <strong>Focus:</strong> {workout.focus}
              </p>
              <p className="mb-2">
                <strong>Duration:</strong> {workout.minutes} minutes
              </p>
              <p className="mb-2">
                <strong>Difficulty:</strong> {workout.difficulty}
              </p>
              {workout.reason && (
                <p className="mb-0">
                  <strong>Reason:</strong> {workout.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
