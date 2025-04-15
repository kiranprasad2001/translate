import React, { useState } from 'react';
import { saveWordToGitHub } from './utils/githubApi';

export default function LearnedWordsTracker({ selectedLanguage }) {
  const [word, setWord] = useState('');
  const [status, setStatus] = useState('');

  const saveWord = async () => {
    if (!word) return;
    setStatus('Saving...');
    const success = await saveWordToGitHub(word, selectedLanguage);
    setStatus(success ? 'Saved!' : 'Failed to save.');
    setWord('');
  };

  return (
    <div className="tracker">
      <h3>Learned Words</h3>
      <input value={word} onChange={e => setWord(e.target.value)} placeholder="Learned word" />
      <button onClick={saveWord}>Save Word</button>
      <p>{status}</p>
    </div>
  );
}

