import { useState } from 'react';

function AddSurfer() {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    country: '',
    city: '',
    birthdate: '',
    stance: '',
    surfStyle: [],
  });

  const handleChange = (e) => {
    const { name, value, options } = e.target;
    if (e.target.multiple) {
      const values = Array.from(options).filter(option => option.selected).map(option => option.value);
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
      <form onSubmit={handleSubmit}>
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
          <label className="form-label">Surf Style:</label>
          <select
            className="form-select"
            multiple
            name="surfStyle"
            value={formData.surfStyle}
            onChange={handleChange}
          >
            <option value="shortboard">Shortboard</option>
            <option value="longboard">Longboard</option>
          </select>
        </div>
        <button type="submit" className="form-button">
          Add Surfer
        </button>
      </form>
    </div>
  );
}

export default AddSurfer;
