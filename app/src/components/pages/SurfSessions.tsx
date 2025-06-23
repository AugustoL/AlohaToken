import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessionsHashes } from '../../contracts/AlohaToken/index';
import { MinimalSurfSessionInfo } from '../../types/types';
import Loading from '../utils/Loading';

const SurfSessions = () => {
    const [sessions, setSessions] = useState<MinimalSurfSessionInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const sessionHashes = await fetchSessionsHashes();
                setSessions(sessionHashes);
            } catch (error) {
                console.error("Error fetching surf sessions:", error);
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
            <table className="surfer-table">
                <thead>
                    <tr>
                        <th>Session</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map((session, index) => (
                        <tr key={index}>
                            <td>{`${session.id.slice(0, 6)}...${session.id.slice(-6)}`}</td>
                            <td>
                                <Link to={`/session/${session.id}`}>View Details</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SurfSessions;
