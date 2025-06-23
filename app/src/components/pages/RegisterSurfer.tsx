import { useState } from 'react';

function RegisterSurfer() {
  const [formData, setFormData] = useState<{
    name: string;
    alias: string;
    country: string;
    city: string;
    birthdate: string;
    stance: string;
    surfStyle: string[];
    surfboards: string[];
  }>({
    name: '',
    alias: '',
    country: '',
    city: '',
    birthdate: '',
    stance: '',
    surfStyle: [],
    surfboards: [],
  });

  const [surfboardInput, setSurfboardInput] = useState('');

  const handleBoardKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = surfboardInput.trim();
      if (!value) return;
      setFormData({
        ...formData,
        surfboards: [...formData.surfboards, value],
      });
      setSurfboardInput('');
    }
  };

  const removeBoard = (idx) => {
    setFormData({
      ...formData,
      surfboards: formData.surfboards.filter((_, i) => i !== idx),
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
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    // ...handle form submission...
  };

  return (
    <div className="surf-session-container">
      <h2>Add Surfer</h2>
      <form className="addSurfer-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name:</label>
          <input
            className="form-input"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Alias:</label>
          <input
            className="form-input"
            type="text"
            name="alias"
            value={formData.alias}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Country:</label>
          <input
            className="form-input"
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">City:</label>
          <input
            className="form-input"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Birthdate:</label>
          <input
            className="form-input"
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Stance:</label>
          <select
            className="form-select"
            name="stance"
            value={formData.stance}
            onChange={handleChange}
          >
            <option value="">Select stance</option>
            <option value="regular">Regular</option>
            <option value="goofy">Goofy</option>
          </select>
        </div>
        <div className="form-group">
          <span className="form-label">Surf Style:</span>
          <div className="checkbox-group">
            {['shortboard','midlength','longboard'].map(style => (
              <label key={style} style={{ marginRight: '12px' }}>
                <input
                  type="checkbox"
                  name="surfStyle"
                  value={style}
                  checked={formData.surfStyle.includes(style)}
                  onChange={handleChange}
                />
                {style.charAt(0).toUpperCase()+style.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Surfboards:</label>
          <input
            className="form-input"
            type="text"
            value={surfboardInput}
            onChange={e => setSurfboardInput(e.target.value)}
            onKeyDown={handleBoardKeyDown}
            placeholder="e.g. Shortboard 6'0 33L"
          />
        </div>
        {formData.surfboards.length > 0 && (
          <ul className="surfboard-list">
            {formData.surfboards.map((board, i) => (
              <li key={i}>
                {board}
                <button type="button" onClick={() => removeBoard(i)}>×</button>
              </li>
            ))}
          </ul>
        )}
        <button type="submit" className="form-button">
          Register
        </button>
      </form>
    </div>
  );
}

export default RegisterSurfer;
