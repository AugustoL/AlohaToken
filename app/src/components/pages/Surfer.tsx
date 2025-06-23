import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../../styles/styles.css';
import { fetchSurfer, approveSurfers, fetchSurferByAddress } from '../../contracts/AlohaToken';
import { ALHfromWei } from '../../utils/alohaToken';
import { SurferInfo } from '../../types/types';
import { useAccount } from 'wagmi';
import Loading from '../utils/Loading';

const Surfer = () => {
  const { surferID } = useParams();
  const [surferInfo, setSurferInfo] = useState({} as SurferInfo);
  const [loading, setLoading] = useState(true);
  const account = useAccount();
  const [surferAccount, setSurferAccount] = useState({} as SurferInfo);

  useEffect(() => {
    if (account.address) {
      fetchSurferByAddress(account.address, {fetchBalance: true, fetchApprovals: true, fetchOffchainInfo: true}).then((info) => {
        setSurferAccount(info);
      });
    }
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
        alert("Surfer approved successfully!");
      } catch (error) {
        console.error("Error approving surfer:", error);
        alert("Failed to approve surfer.");
      }
    };
  };

  if (loading) {
    return <Loading/>;
  }

  return (
    <div className="surf-container surfer-details">
      <h2>Surfer Details</h2>
      <p><strong>Alias:</strong> {surferInfo.alias}</p>
      <p><strong>Address:</strong> {surferInfo.address}</p>
      <p><strong>Token Balance:</strong> {ALHfromWei(surferInfo.balance)} ALH</p>
      <p><strong>Name:</strong> {surferInfo.offchainInfo.name}</p>
      <p><strong>Birth Date:</strong> {surferInfo.offchainInfo.birthdate}</p>
      <p><strong>Country:</strong> {surferInfo.offchainInfo.country}</p>
      <p><strong>City:</strong> {surferInfo.offchainInfo.city}</p>
      <p><strong>Stance:</strong> {surferInfo.offchainInfo.stance}</p>
      <strong>Styles:</strong> {surferInfo.offchainInfo.styles.map((style, i) => {
        return <div key={"syyles"+i} className="surftag">{style}</div>;
      })}
      <strong>Surfboards:</strong> {surferInfo.offchainInfo.surfboards.map((surfboard, i) => {
        return <div key={"surfboard"+i} className="surftag">{surfboard}</div>;
      })}
      <strong>Approvals:</strong> <div className="surftag">{surferInfo.approvals.length}</div>{surferInfo.approvals.map((approval, i) => {
        return <a className="link-tag" key={"surfer"+i} href={`/surfer/${approval.id}`}>{approval.alias}</a>;
      })}
      
      {surferAccount && <div className="button-container">
        {(surferAccount.id === surferInfo.id) && <a className="button">Edit Profile</a>}
        {((surferAccount.id != surferInfo.id) && (!surferInfo.approvals.find((approval) => approval.id == surferAccount.id))) && 
          <a className="button" onClick={approveSurfer(surferInfo.id)}>Approve Surfer</a>
        }
      </div>}
    </div>
  );
};

export default Surfer;
