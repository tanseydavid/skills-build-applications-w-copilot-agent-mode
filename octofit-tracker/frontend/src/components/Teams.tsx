import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        setTeams(data.teams);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="alert" className="text-danger">
            Unable to load teams: {error}
          </p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Teams</h2>
          <p>Manage teams and members.</p>
          <p role="status">No teams yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        <div className="list-group">
          {teams.map((team, idx) => (
            <div key={team._id || idx} className="list-group-item">
              <h5 className="mb-2">{team.name}</h5>
              <p className="mb-2">
                <strong>Mascot:</strong> {team.mascot}
              </p>
              <p className="mb-0">
                <strong>Members:</strong> {team.members.length > 0 ? team.members.join(', ') : 'None'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
