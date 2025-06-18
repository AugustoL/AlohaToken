import React from 'react';
import SurferList from './SurferList';
import SurfSession from './SurfSession';
import '../styles.css'; // Import the single CSS file

const App = () => {
    return (
        <div className="App">
            <h1>Aloha Token Surfing App</h1>
            <SurferList />
            <SurfSession />
        </div>
    );
};

export default App;