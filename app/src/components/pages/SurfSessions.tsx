import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessionsHashes } from '../../contracts/AlohaToken';
import { MinimalSurfSessionInfo } from '../../types/aloha';
import Loading from '../common/Loading';
import { useNotify } from '../../hooks/useNotify';
import { AppContext } from '../../context/AppContextProvider';

const SurfSessions = () => {
  const [sessions, setSessions] = useState<MinimalSurfSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const { surferAccount } = useContext(AppContext);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionHashes = await fetchSessionsHashes();
        setSessions(sessionHashes);
      } catch (error) {
        notify.error("Failed to fetch surf sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading) {
    return <Loading/>;
  }

  return (
    <div className="surf-container">
      <div className="page-header">
        <h2>🏄‍♂️ Surf Sessions</h2>
        <p className="page-subtitle">Browse all active surf sessions</p>
      </div>
      
      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌊</div>
          <h3>No surf sessions found</h3>
          <p>Be the first to create a surf session!</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions.map((session, index) => (
            <div key={session.id} className="session-card">
              <div className="session-card-header">
                <span className="session-number">#{index + 1}</span>
                <span className="session-status">Active</span>
              </div>
              <div className="session-card-body">
                <div className="session-id">
                  <label>Session ID:</label>
                  <code>{`${session.id.slice(0, 8)}...${session.id.slice(-8)}`}</code>
                </div>
              </div>
              <div className="session-card-footer">
                <Link 
                  to={`/session/${session.id}`} 
                  className="btn btn-primary btn-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SurfSessions;
