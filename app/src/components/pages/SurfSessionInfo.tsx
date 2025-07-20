import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { approveSurfSession, fetchSessionInfo } from '../../contracts/AlohaToken';
import Loading from '../common/Loading';
import { SurfSession } from '../../types/aloha';
import { AppContext } from '../../context/AppContextProvider';
import { useNotify } from '../../hooks/useNotify';

const SurfSessionInfo = () => {
    const { sessionID } = useParams();
    const [session, setSession] = useState<SurfSession | null>(null);
    const { surferAccount } = useContext(AppContext);
    const notify = useNotify();
    
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const surfSession = await fetchSessionInfo(sessionID);
                console.log("Surf Session:", surfSession);
                setSession(surfSession);
            } catch (error) {
                notify.error("Failed to fetch surf session. Please try again.");
            }
        };

        if (sessionID) {
            fetchSession();
        }
    }, [sessionID]);

    const approveSession = (sessionId: string, surferApprovalIndex) => {
        return async (e) => {
            e.preventDefault();
            try {
                console.log("Approve session action triggered for:", sessionId, surferApprovalIndex);
                await approveSurfSession(sessionId, surferApprovalIndex);
                alert("Session approved successfully!");
            } catch (error) {
                console.error("Error approving session:", error);
                alert("Failed to approve session.");
            }
        };
    };

    if (!session) {
        return <Loading />;
    }

    const sessionApprovedByAccount = session.approvals.find(approval => approval.id === surferAccount?.id);

    return (
        <div className="surf-container surfer-details">
            <h2>Surf Session Details</h2>
            <p><strong>Session ID:</strong> {sessionID}</p>
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
            <p><strong>Wave Conditions:</strong></p>
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
            {surferAccount && <div className="button-container">
            {surferAccount && !session.approved && !sessionApprovedByAccount &&
                <a className="button" onClick={approveSession(session.id, session.surfers.findIndex((surfer) => surfer.id == surferAccount.id))}>Approve session</a>
            }
            </div>}
        </div>
    );
};

export default SurfSessionInfo;
