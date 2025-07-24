import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../../styles/styles.css';
import { fetchSurfer, approveSurfers, fetchSurferByAddress } from '../../contracts/AlohaToken';
import { ALHfromWei } from '../../utils/alohaToken';
import { SurferInfo } from '../../types/aloha';
import Loading from '../common/Loading';
import { useNotify } from '../../hooks/useNotify';
import { AppContext } from '../../context/AppContextProvider';

const Surfer = () => {
  const { surferID } = useParams();
  const [surferInfo, setSurferInfo] = useState({} as SurferInfo);
  const [loading, setLoading] = useState(true);
  const { surferAccount } = useContext(AppContext);
  const notify = useNotify();

  useEffect(() => {
    if (surferID) {
      fetchSurfer(surferID, {fetchBalance: true, fetchApprovals: true, fetchOffchainInfo: true}).then((info) => {
        setSurferInfo(info);
        setLoading(false);
      });
    }
  }, [surferID]);

  const approveSurfer = (surferID: string) => {
    return async (e) => {
      e.preventDefault();
      try {
        await approveSurfers([surferID]);
        console.log("Approve surfer action triggered for:", surferID);
        notify.success("Surfer approved successfully!");
      } catch (error) {
        console.error("Error approving surfer:", error);
        notify.error("Failed to approve surfer");
      }
    };
  };

  if (loading) {
    return <Loading/>;
  }

  return (
    <div className="surf-container surfer-details">
      {/* Profile Header */}
      <div className="surfer-profile-header">
        <div className="surfer-alias">@{surferInfo.alias}</div>
        <div className="surfer-stats">
          <div className="stat-item">
            <span className="stat-value">{ALHfromWei(surferInfo.balance)}</span>
            <span className="stat-label">ALH Tokens</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{surferInfo.approvals?.length || 0}</span>
            <span className="stat-label">Approvals</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="surfer-details-grid">
        {/* Personal Information */}
        <div className="detail-section">
          <h3 className="section-title">📋 Personal Info</h3>
          <div className="detail-item">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{surferInfo.offchainInfo?.name || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Birth Date:</span>
            <span className="detail-value">{surferInfo.offchainInfo?.birthdate || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Location:</span>
            <span className="detail-value">
              {surferInfo.offchainInfo?.city && surferInfo.offchainInfo?.country 
                ? `${surferInfo.offchainInfo.city}, ${surferInfo.offchainInfo.country}`
                : 'Not specified'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Stance:</span>
            <span className="detail-value">{surferInfo.offchainInfo?.stance || 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Address:</span>
            <span className="detail-value">
              <code style={{ fontSize: '0.85rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px' }}>
                {surferInfo.address}
              </code>
            </span>
          </div>
        </div>

        {/* Surf Profile */}
        <div className="detail-section">
          <h3 className="section-title">🏄‍♂️ Surf Profile</h3>
          <div className="detail-item">
            <span className="detail-label">Styles:</span>
            <div className="detail-value">
              {surferInfo.offchainInfo?.styles?.length > 0 ? (
                <div className="tags-container">
                  {surferInfo.offchainInfo.styles.map((style, i) => (
                    <span key={`style-${i}`} className="surfer-tag">{style}</span>
                  ))}
                </div>
              ) : (
                <span>No styles specified</span>
              )}
            </div>
          </div>
          <div className="detail-item">
            <span className="detail-label">Boards:</span>
            <div className="detail-value">
              {surferInfo.offchainInfo?.surfboards?.length > 0 ? (
                <div className="tags-container">
                  {surferInfo.offchainInfo.surfboards.map((board, i) => (
                    <span key={`board-${i}`} className="surfer-tag">{board}</span>
                  ))}
                </div>
              ) : (
                <span>No surfboards specified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approvals Section */}
      <div className="detail-section">
        <h3 className="section-title">✅ Community Approvals
          <span className="approval-count">
            {surferInfo.approvals?.length || 0} Approvals
          </span>
        </h3>
        {surferInfo.approvals?.length > 0 ? (
          <div className="approval-tags">
            {surferInfo.approvals.map((approval, i) => (
              <a 
                key={`approval-${i}`} 
                className="approval-tag" 
                href={`/surfer/${approval.id}`}
              >
                {approval.alias}
              </a>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>
            This surfer hasn't received any community approvals yet.
          </p>
        )}
      </div>

      {/* Actions */}
      {surferAccount && (
        <div className="action-buttons">
          {surferAccount.id === surferInfo.id && (
            <button className="btn btn-primary">
              ✏️ Edit Profile
            </button>
          )}
          {surferAccount.id !== surferInfo.id && 
            !surferInfo.approvals?.find(approval => approval.id === surferAccount.id) && (
            <button 
              className="btn btn-primary" 
              onClick={approveSurfer(surferInfo.id)}
            >
              👍 Approve Surfer
            </button>
          )}
          {surferAccount.id !== surferInfo.id && 
            surferInfo.approvals?.find(approval => approval.id === surferAccount.id) && (
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

export default Surfer;
