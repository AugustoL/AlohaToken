import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessionsHashes } from '../contracts/AlohaToken/index';

const SurfSessions = () => {
    const [sessions, setSessions] = useState([]);
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
        return (<div>Loading...</div>);
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
                            <td>{`${session.slice(0, 6)}...${session.slice(-6)}`}</td>
                            <td>
                                <Link to={`/session/${session}`}>View Details</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SurfSessions;
