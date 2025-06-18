import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSessionInfo } from '../contracts/AlohaToken/index';
import '../styles/styles.css';

const SurfSessionInfo = () => {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const surfSessionJson = await fetchSessionInfo(sessionId);
                setSession(surfSessionJson);
            } catch (error) {
                console.error('Error fetching surf session info:', error);
            }
        };

        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    if (!session) {
        return <div>Loading...</div>;
    }

    return (
        <div className="surf-container">
            <h2>Surf Session Details</h2>
            <p><strong>Session ID:</strong> {sessionId}</p>
            <p><strong>Session Surfers:</strong> {session.surfers.toString()}</p>
            <p><strong>Best Wave Surfer:</strong> {session.bestSurfer}</p>
            <p><strong>Kook Surfer:</strong> {session.kookSurfer}</p>
        </div>
    );
};

export default SurfSessionInfo;
