import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSessionInfo } from '../../contracts/AlohaToken/index';
import Loading from '../utils/Loading';
import { SurfSession } from '../../types/types';

const SurfSessionInfo = () => {
    const { sessionId } = useParams();
    const [session, setSession] = useState<SurfSession | null>(null);

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
        return <Loading />;
    }

    return (
        <div className="surf-container surfer-details">
            <h2>Surf Session Details</h2>
            <p><strong>Session ID:</strong> {sessionId}</p>
            <p><strong>Session Surfers:</strong> {session.surfers.map((surfer, i) => {
                return <a key={"surfer"+i} className="link-tag" href={`/surfer/${surfer.id}`}>{surfer.alias}</a>;
            })}</p>
            <p><strong>Approved:</strong> {session.approved ? 'Yes' : 'No'}</p>
            <strong>Approvals:</strong> <div className="surftag">{session.approvals.length}</div>{session.approvals.map((approval, i) => {
                return <a key={"surferApproval"+i} className="link-tag" href={`/surfer/${approval.id}`}>{approval.alias}</a>;
            })}
            <p><strong>Offchain Info Hash:</strong> {session.offchainInfoHash}</p>
            <p><strong>Best Wave Surfer:</strong> {session.bestWaveSurfer.alias}</p>
            <p><strong>Kook Surfer:</strong> {session.kookSurfer.alias}</p>
            <p><strong>Session Date:</strong> {session.offchainInfo?.date}</p>
            <p><strong>Location:</strong> {session.offchainInfo?.location}</p>
            <p><strong>Conditions:</strong></p>
            <ul>
                <li><strong>Wind:</strong> {session.offchainInfo?.conditions?.wind}</li>
                <li><strong>Size:</strong> {session.offchainInfo?.conditions?.size}</li>
                <li><strong>Tide:</strong> {session.offchainInfo?.conditions?.tide}</li>
            </ul>
            <p><strong>Duration:</strong> {session.offchainInfo?.duration} minutes</p>
            <p><strong>Session Type:</strong> {session.offchainInfo?.sessionType}</p>
            <p><strong>Surfers:</strong></p>
            <ul>
                {session.surfers.map((surfer, i) => (
                    <li key={surfer.id}>
                        <a className="link-tag" href={`/surfer/${surfer.id}`}>{surfer.alias}</a> - {session.waves[i]} Waves
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SurfSessionInfo;
