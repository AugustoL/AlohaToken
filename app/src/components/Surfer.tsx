import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/styles.css';
import { fetchSurfer } from '../contracts/AlohaToken';
import { ALHfromWei } from '../utils/alohaToken';

const Surfer = () => {
  const { surferID } = useParams();
  const [surferInfo, setSurferInfo] = useState({});

  useEffect(() => {
    if (surferID) {
      fetchSurfer(surferID, {fetchBalance: true, fetchApprovals: true}).then((surferInfo) => {
        console.log(surferInfo);
        setSurferInfo(surferInfo);
      });
    }
  }, [surferID]);

  return (
    <div className="surf-container">
      <h2>Surfer Details</h2>
      <p><strong>Address:</strong> {surferInfo.address}</p>
      <p><strong>Alias:</strong> {surferInfo.alias}</p>
      <p><strong>Token Balance:</strong> {surferInfo.balance} ALH</p>
    </div>
  );
};

export default Surfer;
