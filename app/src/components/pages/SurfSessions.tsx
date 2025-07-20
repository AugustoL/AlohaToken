import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessionsHashes, getSessionsCreatedBySurferAndNotFinalized } from '../../contracts/AlohaToken';
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
                if (surferAccount) {
                    const sessionsWaiting = await getSessionsCreatedBySurferAndNotFinalized(surferAccount.id);
                    console.log("Sessions waiting for surfer approval:", sessionsWaiting);
                }
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
