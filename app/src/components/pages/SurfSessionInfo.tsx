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
        <div className="surf-container">
            {/* Session Profile Header */}
            <div className="session-profile-header">
                <div className="session-id-display">Session #{sessionID}</div>
                <div className="session-stats">
                    <div className="session-stat-item">
                        <span className="session-stat-value">{session.surfers.length}</span>
                        <span className="session-stat-label">Surfers</span>
                    </div>
                    <div className="session-stat-item">
                        <span className="session-stat-value">{session.approvals.length}</span>
                        <span className="session-stat-label">Approvals</span>
                    </div>
                    <div className="session-stat-item">
                        <span className="session-stat-value">{session.waves.reduce((a, b) => Number(a) + Number(b), 0)}</span>
                        <span className="session-stat-label">Total Waves</span>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="session-details-grid">
                {/* Session Information */}
                <div className="session-detail-section">
                    <h3 className="session-section-title">🏄‍♂️ Session Info</h3>
                    <div className="session-detail-item">
                        <span className="session-detail-label">Status:</span>
                        <div className="session-detail-value">
                            <span className={`session-status-badge ${session.approved ? 'approved' : 'pending'}`}>
                                {session.approved ? '✅ Approved' : '⏳ Pending Approval'}
                            </span>
                        </div>
                    </div>
                    <div className="session-detail-item">
                        <span className="session-detail-label">Date:</span>
                        <span className="session-detail-value">{session.offchainInfo?.date || 'Not specified'}</span>
                    </div>
                    <div className="session-detail-item">
                        <span className="session-detail-label">Location:</span>
                        <span className="session-detail-value">{session.offchainInfo?.location || 'Not specified'}</span>
                    </div>
                    <div className="session-detail-item">
                        <span className="session-detail-label">Duration:</span>
                        <span className="session-detail-value">{session.offchainInfo?.duration || 'Not specified'} minutes</span>
                    </div>
                    <div className="session-detail-item">
                        <span className="session-detail-label">Session Type:</span>
                        <span className="session-detail-value">{session.offchainInfo?.sessionType || 'Not specified'}</span>
                    </div>
                </div>

                {/* Wave Conditions */}
                <div className="session-detail-section">
                    <h3 className="session-section-title">🌊 Wave Conditions</h3>
                    <div className="conditions-grid">
                        <div className="condition-item">
                            <span className="condition-label">Wind</span>
                            <span className="condition-value">{session.offchainInfo?.conditions?.wind || 'N/A'}</span>
                        </div>
                        <div className="condition-item">
                            <span className="condition-label">Size</span>
                            <span className="condition-value">{session.offchainInfo?.conditions?.size || 'N/A'}</span>
                        </div>
                        <div className="condition-item">
                            <span className="condition-label">Tide</span>
                            <span className="condition-value">{session.offchainInfo?.conditions?.tide || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session Awards and Participating Surfers - Side by Side */}
            <div className="session-details-grid">
                {/* Session Awards */}
                <div className="session-detail-section">
                    <h3 className="session-section-title">🏆 Session Awards</h3>
                    <div className="session-awards">
                        <div className="award-item">
                            <span className="award-icon">🌊</span>
                            <div className="award-title">Best Wave</div>
                            <div className="award-name">
                                <a className="username-tag" href={`/surfer/${session.bestWaveSurfer.id}`}>
                                    {session.bestWaveSurfer.alias}
                                </a>
                            </div>
                        </div>
                        <div className="award-item">
                            <span className="award-icon">🤙</span>
                            <div className="award-title">Kook Surfer</div>
                            <div className="award-name">
                                <a className="username-tag" href={`/surfer/${session.kookSurfer.id}`}>
                                    {session.kookSurfer.alias}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Surfers & Wave Count */}
                <div className="session-detail-section">
                    <h3 className="session-section-title">🏄‍♀️ Participating Surfers</h3>
                    <div className="surfers-list">
                        {session.surfers.map((surfer, i) => (
                            <div key={surfer.id} className="surfer-wave-item">
                                <a className="surfer-wave-name username-tag" href={`/surfer/${surfer.id}`}>
                                    {surfer.alias}
                                </a>
                                <span className="wave-count">{session.waves[i]} waves</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Approvals Section */}
            <div className="session-detail-section">
                <h3 className="session-section-title">✅ Community Approvals
                    <span className="approval-count">
                        {session.approvals.length} Approvals
                    </span>
                </h3>
                {session.approvals.length > 0 ? (
                    <div className="approval-tags">
                        {session.approvals.map((approval, i) => (
                            <a 
                                key={`approval-${i}`} 
                                className="approval-tag username-tag" 
                                href={`/surfer/${approval.id}`}
                            >
                                {approval.alias}
                            </a>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                        This session hasn't received any community approvals yet.
                    </p>
                )}
            </div>

            {/* Actions */}
            {surferAccount && (
                <div className="action-buttons">
                    {surferAccount && !session.approved && !sessionApprovedByAccount && (
                        <button 
                            className="btn btn-primary" 
                            onClick={approveSession(session.id, session.surfers.findIndex((surfer) => surfer.id == surferAccount.id))}
                        >
                            👍 Approve Session
                        </button>
                    )}
                    {sessionApprovedByAccount && (
                        <div style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: 'white', 
                            padding: '12px 24px', 
                            borderRadius: '12px',
                            fontWeight: '600'
                        }}>
                            ✅ Already Approved
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SurfSessionInfo;
