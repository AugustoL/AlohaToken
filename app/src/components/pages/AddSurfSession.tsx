import { useState } from 'react';


const SurfSession = () => {
    const [sessionSurfers, setSessionSurfers] = useState([]);
    const [waves, setWaves] = useState([]);
    const [bestWaveSurfer, setBestWaveSurfer] = useState('');
    const [kookSurfer, setKookSurfer] = useState('');
    const [sessionInfoHash, setSessionInfoHash] = useState('');
    const [signatures, setSignatures] = useState([]);


    const handleAddSurfSession = async () => {
        // const accounts = await web3.eth.getAccounts();
        // const currentAccount = accounts[0];

        // try {
        //     await contract.methods.addSurfSession(sessionSurfers, waves, bestWaveSurfer, kookSurfer, signatures, sessionInfoHash)
        //         .send({ from: currentAccount });
        //     alert('Surf session added successfully!');
        // } catch (error) {
        //     console.error('Error adding surf session:', error);
        //     alert('Failed to add surf session. Check console for details.');
        // }
    };

    return (
        <div className="surf-session-container">
            <h2>Add Surf Session</h2>
            {/* <input type="text" placeholder="Session Surfers (comma separated)" onChange={(e) => setSessionSurfers(e.target.value.split(','))} />
            <input type="text" placeholder="Waves (comma separated)" onChange={(e) => setWaves(e.target.value.split(',').map(Number))} />
            <input type="text" placeholder="Best Wave Surfer" onChange={(e) => setBestWaveSurfer(e.target.value)} />
            <input type="text" placeholder="Kook Surfer" onChange={(e) => setKookSurfer(e.target.value)} />
            <input type="text" placeholder="Session Info Hash" onChange={(e) => setSessionInfoHash(e.target.value)} />
            <input type="text" placeholder="Signatures (comma separated)" onChange={(e) => setSignatures(e.target.value.split(','))} />
            <button onClick={handleAddSurfSession}>Submit Surf Session</button> */}
        </div>
    );
};

export default SurfSession;