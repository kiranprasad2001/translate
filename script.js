document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  // *** IMPORTANT: Replace with your actual GitHub username and repo name ***
  const GITHUB_USER = 'kiranprasad2001';
  const GITHUB_REPO = 'translate';
  // ***

  const languageSelect = document.getElementById('language-select');
  const suggestionWordDisplay = document.getElementById('suggestion-word');
  const speakSuggestionBtn = document.getElementById('speak-suggestion-btn');
  const nextWordBtn = document.getElementById('next-word-btn');
  const iLearntThisBtn = document.getElementById('i-learnt-this-btn');
  const currentWordDisplay = document.getElementById('current-word-display');
  const speakAgainBtn = document.getElementById('speak-again-btn');
  const learnedWordsList = document.getElementById('learned-words-list');
  const toggleLearnedBtn = document.getElementById('toggle-learned-btn');

  const translateInput = document.getElementById('text-to-translate');
  const translateAndSpeakBtn = document.getElementById('translate-and-speak-btn');


  let currentLanguage = languageSelect.value;
  let currentSuggestion = null;
  let suggestionWords = [];
  let learnedWords = [];
  let synth = window.speechSynthesis;
  let voices = [];

  // --- Language Mapping ---
  // Maps dropdown values to BCP 47 language codes and potentially voice names
  const languageMap = {
      'ch': { code: 'zh-CN', voiceName: 'Google 中文（普通话）', filePrefix: 'ch' }, // Common default
      //'en': { code: 'en-US', voiceName: 'Google US English', filePrefix: 'en' }, // Common default
      'fr': { code: 'fr-FR', voiceName: 'Google Français', filePrefix: 'fr' }, // Common default
      'es': { code: 'es-ES', voiceName: 'Google Español', filePrefix: 'es' }, // Common default
      'de': { code: 'de-DE', voiceName: 'Google Deutsch', filePrefix: 'de' }, // Common default
      // Add more languages here - find codes: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
      // Voice names can vary GREATLY by browser/OS. We'll try to find the best match.
  };

  // --- Core Functions ---

  function populateVoiceList() {
      voices = synth.getVoices();
      // console.log("Available voices:", voices); // For debugging
  }

  // Call populateVoiceList initially and when voices change
  populateVoiceList();
  if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
  }

  function speak(text, langCode, voiceNameHint) {
      if (!synth) {
          alert('Sorry, your browser does not support Text-to-Speech.');
          return;
      }
      if (synth.speaking) {
          console.log('SpeechSynthesis.speaking');
          // Optional: Stop current speech before starting new one
          // synth.cancel();
          // return; // Or allow queuing - depends on desired behavior
      }
      if (text !== '') {
          const utterThis = new SpeechSynthesisUtterance(text);
          utterThis.onend = function (event) {
              console.log('SpeechSynthesisUtterance.onend');
          }
          utterThis.onerror = function (event) {
              console.error('SpeechSynthesisUtterance.onerror', event);
              // Fallback or simpler alert if specific voice fails?
              // alert(`Could not speak using the selected voice. Error: ${event.error}`);
          }

          // Find the best voice match
          let selectedVoice = voices.find(voice => voice.lang === langCode); // First match by lang code
          let specificVoice = voices.find(voice => voice.name === voiceNameHint && voice.lang === langCode); // Try specific name
          let googleVoice = voices.find(voice => voice.name.includes('Google') && voice.lang === langCode); // Try Google voice
          let microsoftVoice = voices.find(voice => voice.name.includes('Microsoft') && voice.lang === langCode); // Try Microsoft voice

          utterThis.voice = specificVoice || googleVoice || microsoftVoice || selectedVoice || voices.find(voice => voice.default); // Fallback chain

          if (!utterThis.voice) {
               console.warn(`No specific voice found for lang '${langCode}' or hint '${voiceNameHint}'. Using browser default.`);
          } else {
              // console.log("Using voice:", utterThis.voice.name, utterThis.voice.lang);
          }

          utterThis.lang = langCode;
          utterThis.pitch = 1; // Range 0-2
          utterThis.rate = 0.7; // Range 0.1-10 (0.7 is slow)
          utterThis.volume = 1; // Range 0-1

          // console.log("Attempting to speak:", text, utterThis.lang, utterThis.rate);
          synth.speak(utterThis);
      }
  }

  async function loadJsonData(filePath) {
      try {
          // Add cache busting query parameter for development/testing
          const response = await fetch(`${filePath}?cachebust=${new Date().getTime()}`);
          if (!response.ok) {
              if (response.status === 404) {
                  console.warn(`File not found: ${filePath}. Returning empty array.`);
                  return []; // Return empty array if file doesn't exist (e.g., new language)
              }
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return data.words || []; // Expecting format { "words": [...] }
      } catch (error) {
          console.error(`Error loading data from ${filePath}:`, error);
          learnedWordsList.innerHTML = `<p style="color: red;">Error loading words. Check console.</p>`;
          return []; // Return empty on error
      }
  }

  async function loadLanguageData(langKey) {
      const langInfo = languageMap[langKey];
      if (!langInfo) {
          console.error(`Language key "${langKey}" not found in languageMap.`);
          suggestionWords = [];
          learnedWords = [];
          return;
      }
      const suggestionFilePath = `data/words_${langInfo.filePrefix}.json`;
      const learnedFilePath = `data/learned_${langInfo.filePrefix}.json`;

      // Show loading indicators maybe?
      suggestionWordDisplay.textContent = 'Loading...';
      learnedWordsList.innerHTML = '<div class="loader"></div> Loading learned words...';


      // Load suggestion and learned words in parallel
      try {
          [suggestionWords, learnedWords] = await Promise.all([
              loadJsonData(suggestionFilePath),
              loadJsonData(learnedFilePath)
          ]);
          console.log(`Loaded ${suggestionWords.length} suggestions and ${learnedWords.length} learned words for ${langKey}`);
      } catch (error) {
           console.error(`Failed to load language data for ${langKey}:`, error);
           suggestionWords = [];
           learnedWords = [];
            // Show error in UI
          suggestionWordDisplay.textContent = 'Error!';
          learnedWordsList.innerHTML = `<p style="color: red;">Could not load data.</p>`;
      }

      displayLearnedWords();
      getNewSuggestion();
  }

  function getNewSuggestion() {
      const availableSuggestions = suggestionWords.filter(word => !learnedWords.includes(word) && word !== currentSuggestion); // Avoid suggesting the same word twice in a row if possible

      if (availableSuggestions.length === 0) {
           // Check if there are *any* suggestions at all, even learned ones
          if (suggestionWords.length > 0 && suggestionWords.every(word => learnedWords.includes(word))) {
               suggestionWordDisplay.textContent = "Wow! You learned all the words! 🎉";
               currentSuggestion = null;
               currentWordDisplay.textContent = '-';
               iLearntThisBtn.disabled = true;
               speakSuggestionBtn.disabled = true;
               speakAgainBtn.disabled = true;
          } else {
              suggestionWordDisplay.textContent = "No more new words found!";
              currentSuggestion = null;
              currentWordDisplay.textContent = '-';
              iLearntThisBtn.disabled = true;
              speakSuggestionBtn.disabled = true;
              speakAgainBtn.disabled = true;
          }
          return;
      }

      const randomIndex = Math.floor(Math.random() * availableSuggestions.length);
      currentSuggestion = availableSuggestions[randomIndex];
      suggestionWordDisplay.textContent = currentSuggestion;
      currentWordDisplay.textContent = currentSuggestion; // Display the word itself as 'translation'

      // Enable buttons
      iLearntThisBtn.disabled = false;
      speakSuggestionBtn.disabled = false;
      speakAgainBtn.disabled = false;

       // Speak the new suggestion automatically? Optional.
       // speakWord(currentSuggestion);
  }

  function displayLearnedWords() {
      learnedWordsList.innerHTML = ''; // Clear previous list
      if (learnedWords.length === 0) {
          learnedWordsList.innerHTML = '<p>No words learned for this language yet!</p>';
          return;
      }
      learnedWords.forEach(word => {
          const wordElement = document.createElement('span');
          wordElement.textContent = word;
          wordElement.classList.add('learned-word');
          wordElement.title = 'Click to hear again'; // Tooltip
          wordElement.addEventListener('click', () => speakWord(word));
          learnedWordsList.appendChild(wordElement);
      });
  }

  function speakWord(word) {
      const langInfo = languageMap[currentLanguage];
      if (word && langInfo) {
          speak(word, langInfo.code, langInfo.voiceName);
      }
  }

  function handleLearnWord() {
      if (!currentSuggestion) return;

      // Add to learned list visually immediately (optimistic update)
      if (!learnedWords.includes(currentSuggestion)) {
          learnedWords.push(currentSuggestion);
          displayLearnedWords(); // Update UI
      }

      // Disable button temporarily to prevent double clicks
      iLearntThisBtn.disabled = true;
      iLearntThisBtn.textContent = 'Saving...';


      // --- Generate GitHub Issue Link ---
      const langInfo = languageMap[currentLanguage];
      const title = encodeURIComponent(`Add learned word: ${currentSuggestion} (${currentLanguage})`);
      const body = encodeURIComponent(
`Please add the following word to the learned list for ${currentLanguage.toUpperCase()}.

Word: **${currentSuggestion}**

File to update: \`data/learned_${langInfo.filePrefix}.json\`

Make sure the JSON structure remains valid. Example:
\`\`\`json
{
"words": [
  "existing_word_1",
  "existing_word_2",
  "${currentSuggestion}"
]
}
\`\`\`

After editing the file, commit the change and push it to the main branch. The website will update automatically.
`);
      const issueUrl = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`;

      // Open the link in a new tab for the parent to complete
      window.open(issueUrl, '_blank');

      // Reset button after a short delay (doesn't actually confirm save, just resets UI)
       setTimeout(() => {
          iLearntThisBtn.textContent = '✅ I learnt this!';
          // Re-enable? Maybe wait for next word? Let's get a new suggestion instead.
           getNewSuggestion(); // Move to the next word
       }, 1500); // Give some visual feedback time
  }


  // --- Event Listeners ---

  languageSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      console.log(`Language changed to: ${currentLanguage}`);
      // Reset state for new language
      currentSuggestion = null;
      suggestionWordDisplay.textContent = '-';
      currentWordDisplay.textContent = '-';
      iLearntThisBtn.disabled = true;
      speakSuggestionBtn.disabled = true;
      speakAgainBtn.disabled = true;
      // Load data for the selected language
      loadLanguageData(currentLanguage);
  });

  speakSuggestionBtn.addEventListener('click', () => speakWord(currentSuggestion));
  speakAgainBtn.addEventListener('click', () => speakWord(currentSuggestion)); // Speak the same word again

  nextWordBtn.addEventListener('click', getNewSuggestion);

  iLearntThisBtn.addEventListener('click', handleLearnWord);

  toggleLearnedBtn.addEventListener('click', () => {
      learnedWordsList.classList.toggle('hidden');
      // Optional: Change button text based on state
      if (learnedWordsList.classList.contains('hidden')) {
          toggleLearnedBtn.textContent = 'Show';
      } else {
          toggleLearnedBtn.textContent = 'Hide';
      }
  });

  translateAndSpeakBtn.addEventListener('click', async () => {
    const text = translateInput.value.trim();
    if (!text) return;
  
    const targetLangCode = languageMap[currentLanguage]?.code || 'fr';
  
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const translated = data[0]?.[0]?.[0] || "Translation failed";
  
      currentWordDisplay.textContent = translated;
      speak(translated, targetLangCode, languageMap[currentLanguage].voiceName);
    } catch (err) {
      console.error("Translation failed", err);
      currentWordDisplay.textContent = "Translation failed";
    }
  });
  

  // --- Initialisation ---
  function initialize() {
      // Ensure voices are loaded before first use (can sometimes be slightly delayed)
      if (voices.length === 0) {
          setTimeout(initialize, 100); // Retry shortly
          return;
      }
      console.log("App Initialized. Voices ready.");
      loadLanguageData(currentLanguage); // Load data for the default language
  }

  initialize(); // Start the app
});