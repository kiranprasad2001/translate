
import React, { useState } from 'react';

export default function Translator({ selectedLanguage }) {
  const [input, setInput] = useState('');
  const [translated, setTranslated] = useState('');

  const translate = async () => {
    const response = await fetch(`https://libretranslate.de/translate`, {
      method: "POST",
      body: JSON.stringify({
        q: input,
        source: "en",
        target: selectedLanguage,
        format: "text"
      }),
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    setTranslated(data.translatedText);
    speak(data.translatedText);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.6;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="translator">
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter word or sentence" />
      <button onClick={translate}>Translate & Speak</button>
      <p>Translation: <strong>{translated}</strong></p>
    </div>
  );
}
