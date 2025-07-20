import { useContext, useState } from 'react';
import { SurfSession } from '../../types/aloha';
import { addSurfSession } from '../../contracts/AlohaToken';
import { AppContext } from '../../context/AppContextProvider';
import { useNotify } from '../../hooks/useNotify';
import { WaveIcon } from '../common/Icons';

const SurfSession = () => {
  const [surferInput, setSurferInput] = useState('');
  const [waveInput, setWaveInput] = useState(0);
  const [isEditSurfer, setIsEditSurfer] = useState(false);
  const { surferAccount } = useContext(AppContext);
  const notify = useNotify(); // Move this to the top level
    
  const [formData, setFormData] = useState<SurfSession>({
    surfers: surferAccount ? [{ id: surferAccount.id, alias: surferAccount.alias }] : [],
    waves: surferAccount ? [0] : [],
    bestWaveSurfer: { id: "", alias: "" },
    kookSurfer: { id: "", alias: "" },
    offchainInfo: {
      sessionType: 'fressurf',
      conditions: {
        wind: '',
        size: '',
        tide: ''
      },
      date: '',
      location: '',
      duration: 0
    },
    approved: false,
    approvals: [],
    offchainInfoHash: ''
  } as SurfSession);
  
  const addSurfer = () => {
    const value = surferInput.trim();
    if (!value) return;
    setFormData({
      ...formData,
      surfers: [...formData.surfers, {id: "", alias: value}],
      waves: [...formData.waves, waveInput],
    });
    setSurferInput('');
    setWaveInput(0);
  };

  const editSurfer = (e) => {
    e.preventDefault();
    const value = surferInput.trim();
    if (!value) return;
    
    const surferIndex = formData.surfers.findIndex(s => s.alias === value);
    formData.waves[surferIndex] = waveInput;
    setFormData(formData);
    
    setSurferInput('');
    setWaveInput(0);
    setIsEditSurfer(false);
  }

  const setSurferForEdit = (idx) => (e) => {
    e.preventDefault();
    setSurferInput(formData.surfers[idx].alias);
    setWaveInput(formData.waves[idx]);
    setIsEditSurfer(true);
  };

  const removeSurfer = (idx) => {
    // Prevent removing the first surfer (creator)
    if (idx === 0) {
      notify.warning("Cannot remove the session creator.");
      return;
    }
    
    setFormData({
      ...formData,
      surfers: formData.surfers.filter((_, i) => i !== idx),
      waves: formData.waves.filter((_, i) => i !== idx),
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    
    if (type === 'checkbox') {
      const current = formData[name];
      const updated = checked
        ? [...current, value]
        : current.filter(v => v !== value);
      setFormData({ ...formData, [name]: updated });
    } else if (e.target.multiple) {
      const values = Array.from(options)
        .filter(o => (o as HTMLOptionElement).selected)
        .map(o => (o as HTMLOptionElement).value);
      setFormData({ ...formData, [name]: values });
    } else {
      // Handle nested object updates for offchainInfo
      if (name === 'wind' || name === 'size' || name === 'tide') {
        setFormData({
          ...formData,
          offchainInfo: {
            ...formData.offchainInfo,
            conditions: {
              ...formData.offchainInfo.conditions,
              [name]: value
            }
          }
        });
      } else if (name === 'sessionType' || name === 'date' || name === 'location' || name === 'duration') {
        setFormData({
          ...formData,
          offchainInfo: {
            ...formData.offchainInfo,
            [name]: name === 'duration' ? Number(value) : value
          }
        });
      } else if (name === 'bestSurfer') {
        const selectedSurfer = formData.surfers.find(s => s.alias === value);
        setFormData({
          ...formData,
          bestWaveSurfer: selectedSurfer || { id: "", alias: "" }
        });
      } else if (name === 'kookSurfer') {
        const selectedSurfer = formData.surfers.find(s => s.alias === value);
        setFormData({
          ...formData,
          kookSurfer: selectedSurfer || { id: "", alias: "" }
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleAddSurfSession = async (e) => {
    e.preventDefault();
    console.log('Adding surf session with data:', formData);
    const appUrl = window.location.origin;
    try {
      const sessionId = await addSurfSession(formData, surferAccount.id);
      notify.success(`Surf session added successfully! Share session link: ${appUrl}/session/${sessionId}`, 0);
    } catch (error) {
      console.error("Error adding surf session:", error);
      notify.error("Failed to add surf session. Please try again.");
    }
  };

  const fillTestData = (e) => {
    e.preventDefault();
    setFormData({
      surfers: [
        { id: "0x810a2ae1b01b0197a9ca09742f4a344d5480b5d8942e959925bc041bbc0dad29", alias: "Viking" },
        { id: "0x64f99979fecf3230210fe6c3d0d4da7554e39ea019ca90311da5c0bb1d8a194a", alias: "Ezes" }],
      waves: [5, 3],
      bestWaveSurfer: { id: "0x810a2ae1b01b0197a9ca09742f4a344d5480b5d8942e959925bc041bbc0dad29", alias: "Viking" },
      kookSurfer: { id: "0x64f99979fecf3230210fe6c3d0d4da7554e39ea019ca90311da5c0bb1d8a194a", alias: "Ezes" },
      offchainInfo: {
        sessionType: 'fressurf',
        conditions: {
          wind: 'Offshore',
          size: '2-5 ft',
          tide: 'High'
        },
        date: '2023-10-01',
        location: 'Malibu, CA',
        duration: 60
      },
      approved: false,
      approvals: [],
      offchainInfoHash: '',
      sessionTime: Math.floor((new Date("2024-10-01")).getTime() / 1000), // Example timestamp
      id: '' // Add a default value for id
    });
  };

  return (
    <div className="surf-session-container">
      <h2>Add Surf Session</h2>
      <form className="addSurfer-form">
        <div className="form-group">
          <label className="form-label">Surfer:</label>
          <input
            className="form-input"
            type="text"
            value={surferInput}
            onChange={e => setSurferInput(e.target.value)}
            placeholder="Surfer alias"
          />
          <label className="form-label">Waves:</label>
          <input
            className="form-input"
            type="number"
            value={waveInput}
            onChange={e => setWaveInput(Number(e.target.value))}
            placeholder="Waves"
          />
        </div>
        {!isEditSurfer ?
          <button className="form-button" type="button" onClick={addSurfer}>Add Surfer</button> :
          <button className="form-button" type="button" onClick={editSurfer}>Edit Surfer</button>
        }
        <div className="form-group">
        {formData.surfers.length > 0 && 
            <ul className="surfboard-list">
              {formData.surfers.map((surfer, i) => (
              <li key={i} onClick={setSurferForEdit(i)}>
                {surfer.alias} - {formData.waves[i]} <WaveIcon/>
                { i > 0 &&
                  <button type="button" onClick={() => removeSurfer(i)}>×</button>
                }
              </li>
              ))}
            </ul>
        }
        </div>
        <div className="form-group">
          <label className="form-label">Best Surfer:</label>
          <select
            className="form-select"
            name="bestSurfer"
            value={formData.bestWaveSurfer.alias || 'None'}
            onChange={handleChange}
          >
            <option value="None">None</option>
            {formData.surfers.map((surfer, i) => (
              <option key={i} value={surfer.alias}>{surfer.alias}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Kook Surfer:</label>
          <select
            className="form-select"
            name="kookSurfer"
            value={formData.kookSurfer.alias || 'None'}
            onChange={handleChange}
          >
            <option value="None">None</option>
            {formData.surfers.map((surfer, i) => (
              <option key={i} value={surfer.alias}>{surfer.alias}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Session type:</label>
          <select
            className="form-select"
            name="sessionType"
            value={formData.offchainInfo.sessionType || 'fressurf'}
            onChange={handleChange}
          >
            <option value="fressurf">Free surf</option>
            <option value="training">Training</option>
            <option value="competition">Competition</option>
          </select>
        </div>
        <h3>Wave Conditions</h3>
        <div className="form-group">
          <label className="form-label">Wind:</label>
          <input
            className="form-input"
            type="text"
            name="wind"
            value={formData.offchainInfo.conditions?.wind || ''}
            onChange={handleChange}
            placeholder="e.g. Offshore, Onshore"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Size:</label>
          <input
            className="form-input"
            type="text"
            name="size"
            value={formData.offchainInfo.conditions?.size || ''}
            onChange={handleChange}
            placeholder="e.g. 2-4 ft"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tide:</label>
          <input
            className="form-input"
            type="text"
            name="tide"
            value={formData.offchainInfo.conditions?.tide || ''}
            onChange={handleChange}
            placeholder="e.g. High, Low"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Session Date:</label>
          <input
            className="form-input"
            type="date"
            name="date"
            value={formData.offchainInfo.date || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location:</label>
          <input
            className="form-input"
            type="text"
            name="location"
            value={formData.offchainInfo.location || ''}
            onChange={handleChange}
            placeholder="e.g. Malibu, CA"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Duration:</label>
          <input
            className="form-input"
            type="number"
            name="duration"
            value={formData.offchainInfo.duration || ''}
            onChange={handleChange}
            placeholder="e.g. 60 minutes"
          />
        </div>
        <button onClick={handleAddSurfSession} className="form-button">Add Surf Session</button>
        <button onClick={fillTestData} className="form-button">Test</button>
      </form>
    </div>
  );
};

export default SurfSession;