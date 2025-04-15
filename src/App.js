import React, { useState } from 'react';
import Translator from './Translator';
import LearnedWordsTracker from './LearnedWordsTracker';
import './App.css';

export default function App() {
  const [language, setLanguage] = useState('french');

  return (
    <div className="app-container">
      <h1>Word Explorer!</h1>
      <select onChange={e => setLanguage(e.target.value)} value={language}>
        <option value="french">French</option>
        <option value="mandarin">Mandarin</option>
        <option value="spanish">Spanish</option>
      </select>

      <Translator selectedLanguage={language} />
      <LearnedWordsTracker selectedLanguage={language} />
    </div>
  );
}
