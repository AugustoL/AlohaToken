import { useEffect, useState, useContext } from 'react';
import { AppContext } from '../../context/AppContextProvider';
import { useNotify } from '../../hooks/useNotify';
import Loading from '../common/Loading';
import { WaveIcon, SurferIcon } from '../common/Icons';
import { HistoryAction, fetchContractHistory } from '../../contracts/AlohaToken';

const History = () => {
  const [actions, setActions] = useState<HistoryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { surferAccount } = useContext(AppContext);
  const notify = useNotify();

  useEffect(() => {
    fetchHistory();
  }, [surferAccount, filter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      let allActions: HistoryAction[] = [];
      
      // Fetch real blockchain data
      const targetUser = filter === 'my_actions' && surferAccount 
        ? surferAccount.address 
        : '0x0000000000000000000000000000000000000000';
      
      allActions = await fetchContractHistory(targetUser, 1000);
      
      // Additional filtering for sessions and approvals when using blockchain data
      if (filter === 'sessions') {
        allActions = allActions.filter(action => 
          action.type.includes('session')
        );
      } else if (filter === 'approvals') {
        allActions = allActions.filter(action => 
          action.type.includes('approved') || action.type.includes('approval')
        );
      }

      setActions(allActions);
    } catch (error) {
      console.error('Error fetching history:', error);
      notify.error('Failed to fetch history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: HistoryAction['type']) => {
    switch (type) {
      case 'session_added':
      case 'session_approved_by_surfer':
      case 'session_finalized':
        return <WaveIcon />;
      case 'surfer_approved':
      case 'approval_received':
      case 'surfer_added':
        return <SurferIcon />;
      default:
        return null;
    }
  };

  const getActionColor = (type: HistoryAction['type']) => {
    switch (type) {
      case 'session_finalized':
        return 'text-green-600';
      case 'session_added':
        return 'text-blue-600';
      case 'session_approved_by_surfer':
        return 'text-yellow-600';
      case 'surfer_approved':
      case 'approval_received':
        return 'text-purple-600';
      case 'surfer_added':
        return 'text-indigo-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatActionType = (type: HistoryAction['type']) => {
    const typeMap = {
      'session_added': 'Session Added',
      'session_approved_by_surfer': 'Session Approved',
      'session_finalized': 'Session Finalized',
      'surfer_approved': 'Surfer Approved',
      'approval_received': 'Approval Received',
      'surfer_added': 'Surfer Registered'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="surf-container">
      <h2>Surfer History</h2>
      
      {/* Filter Controls */}
      <div className="filter-controls" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Filter by:</label>
            <select 
              className="form-select" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 'auto', display: 'inline-block', marginLeft: '10px' }}
            >
              <option value="all">All Actions</option>
              <option value="my_actions">My Actions</option>
              <option value="sessions">Sessions</option>
              <option value="approvals">Approvals</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="history-list">
        {actions.length === 0 ? (
          <p>No actions found for the selected filter.</p>
        ) : (
          actions.map((action) => (
            <div key={action.id} className="history-item">
              <div className="history-header">
                <span className={`history-type ${getActionColor(action.type)}`}>
                  {getActionIcon(action.type)}
                  {formatActionType(action.type)}
                </span>
                <span className="history-timestamp">
                  {action.timestamp.toLocaleDateString()} {action.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="history-details">
                <strong>{action.actor}</strong> {action.details}
                {action.target && action.target !== action.actor && (
                  <span> → <strong>{action.target}</strong></span>
                )}
              </div>
              {action.txHash && (
                <div className="history-tx">
                  <small>
                    Tx: <code>{action.txHash}</code>
                  </small>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
