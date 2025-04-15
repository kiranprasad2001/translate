document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // *** IMPORTANT: Replace with your actual GitHub username and repo name ***
    const GITHUB_USER = 'kiranprasad2001'; // Replace if needed
    const GITHUB_REPO = 'translate';      // Replace if needed
    // ***

    // --- Element References ---
    const languageSelect = document.getElementById('language-select');
    const suggestionWordDisplay = document.getElementById('suggestion-word');
    const speakSuggestionBtn = document.getElementById('speak-suggestion-btn');
    const nextWordBtn = document.getElementById('next-word-btn');
    const iLearntThisBtn = document.getElementById('i-learnt-this-btn'); // Original button for suggestions
    const currentWordDisplay = document.getElementById('current-word-display');
    const speakAgainBtn = document.getElementById('speak-again-btn');
    const learnedWordsList = document.getElementById('learned-words-list');
    const toggleLearnedBtn = document.getElementById('toggle-learned-btn');
    const translateInput = document.getElementById('text-to-translate');
    const translateAndSpeakBtn = document.getElementById('translate-and-speak-btn');
    const learntTranslatedBtn = document.getElementById('learnt-translated-btn'); // NEW button for translations

    // --- State Variables ---
    let currentLanguage = languageSelect.value;
    let currentSuggestion = null;
    let suggestionWords = [];
    let learnedWords = [];
    let synth = window.speechSynthesis;
    let voices = [];

    // --- Language Mapping ---
    const languageMap = {
        'ch': { code: 'zh-CN', voiceName: 'Google 中文（普通话）', filePrefix: 'ch' },
        'fr': { code: 'fr-FR', voiceName: 'Google Français', filePrefix: 'fr' },
        'es': { code: 'es-ES', voiceName: 'Google Español', filePrefix: 'es' },
        'de': { code: 'de-DE', voiceName: 'Google Deutsch', filePrefix: 'de' },
        // Add more languages here if needed
    };

    // --- Core Functions ---

    function populateVoiceList() {
        voices = synth.getVoices();
        // console.log("Available voices:", voices); // For debugging
    }

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
            console.log('SpeechSynthesis currently speaking, cancelling previous utterance.');
             synth.cancel(); // Stop current speech before starting new one
        }
        if (text && text.trim() !== '') {
            const utterThis = new SpeechSynthesisUtterance(text);
            utterThis.onend = function (event) {
                console.log('SpeechSynthesisUtterance.onend');
            }
            utterThis.onerror = function (event) {
                console.error('SpeechSynthesisUtterance.onerror', event);
            }

            let selectedVoice = voices.find(voice => voice.lang === langCode);
            let specificVoice = voices.find(voice => voice.name === voiceNameHint && voice.lang === langCode);
            let googleVoice = voices.find(voice => voice.name.includes('Google') && voice.lang === langCode);
            let microsoftVoice = voices.find(voice => voice.name.includes('Microsoft') && voice.lang === langCode);

            utterThis.voice = specificVoice || googleVoice || microsoftVoice || selectedVoice || voices.find(voice => voice.default);

            if (!utterThis.voice) {
                 console.warn(`No specific voice found for lang '${langCode}' or hint '${voiceNameHint}'. Using browser default.`);
            }

            utterThis.lang = langCode;
            utterThis.pitch = 1;
            utterThis.rate = 0.7; // Slow rate
            utterThis.volume = 1;

            synth.speak(utterThis);
        } else {
             console.warn("Speak function called with empty text.");
        }
    }

    async function loadJsonData(filePath) {
        try {
            const response = await fetch(`${filePath}?cachebust=${new Date().getTime()}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`File not found: ${filePath}. Returning empty array.`);
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
             // Ensure data structure has 'words' array, default to empty array if missing or not an array
             return Array.isArray(data?.words) ? data.words : [];
        } catch (error) {
            console.error(`Error loading or parsing data from ${filePath}:`, error);
            return []; // Return empty on any error
        }
    }

    async function loadLanguageData(langKey) {
        const langInfo = languageMap[langKey];
        if (!langInfo) {
            console.error(`Language key "${langKey}" not found in languageMap.`);
            suggestionWords = [];
            learnedWords = [];
            // Update UI to reflect error or lack of data
            suggestionWordDisplay.textContent = 'Language Error!';
            learnedWordsList.innerHTML = '<p>Invalid language selected.</p>';
            return;
        }
        const suggestionFilePath = `data/words_${langInfo.filePrefix}.json`;
        const learnedFilePath = `data/learned_${langInfo.filePrefix}.json`;

        suggestionWordDisplay.textContent = 'Loading...';
        learnedWordsList.innerHTML = '<div class="loader"></div> Loading learned words...';

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
            suggestionWordDisplay.textContent = 'Error!';
            learnedWordsList.innerHTML = `<p style="color: red;">Could not load data.</p>`;
        }

        displayLearnedWords();
        getNewSuggestion(); // Get the first suggestion for the new language
    }

    function getNewSuggestion() {
        const availableSuggestions = suggestionWords.filter(word => !learnedWords.includes(word));

        if (availableSuggestions.length === 0) {
            if (suggestionWords.length > 0 && suggestionWords.every(word => learnedWords.includes(word))) {
                 suggestionWordDisplay.textContent = "Wow! You learned all the words! 🎉";
            } else {
                suggestionWordDisplay.textContent = "No suggestion words found!";
            }
            currentSuggestion = null;
            currentWordDisplay.textContent = '-'; // Clear translation display too
            // Disable buttons
            iLearntThisBtn.disabled = true;
            learntTranslatedBtn.disabled = true; // Also disable this one
            speakSuggestionBtn.disabled = true;
            speakAgainBtn.disabled = true;
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableSuggestions.length);
        currentSuggestion = availableSuggestions[randomIndex];
        suggestionWordDisplay.textContent = currentSuggestion;
        currentWordDisplay.textContent = '-'; // Clear translation display when new suggestion appears

        // Enable suggestion-related buttons
        iLearntThisBtn.disabled = false;
        iLearntThisBtn.textContent = '✅ I learnt this!'; // Reset text
        speakSuggestionBtn.disabled = false;
        speakAgainBtn.disabled = false; // Assuming this speaks the suggestion

        // Disable the translation 'learn' button
        learntTranslatedBtn.disabled = true;
        learntTranslatedBtn.textContent = '✅ I learnt this!'; // Reset its text too
    }

    function displayLearnedWords() {
        learnedWordsList.innerHTML = '';
        if (learnedWords.length === 0) {
            learnedWordsList.innerHTML = '<p>No words learned for this language yet!</p>';
            return;
        }
        // Sort learned words alphabetically for consistency? Optional.
        // learnedWords.sort();
        learnedWords.forEach(word => {
            const wordElement = document.createElement('span');
            wordElement.textContent = word;
            wordElement.classList.add('learned-word');
            wordElement.title = 'Click to hear again';
            wordElement.addEventListener('click', () => speakWord(word));
            learnedWordsList.appendChild(wordElement);
        });
    }

    function speakWord(word) {
        const langInfo = languageMap[currentLanguage];
        if (word && langInfo) {
            speak(word, langInfo.code, langInfo.voiceName);
        } else {
             console.warn("speakWord called with invalid word or language info", word, langInfo);
        }
    }

     // Modified to accept the specific word and the button clicked
    function handleLearnWord(wordToLearn, buttonElement) {
        if (!wordToLearn || !wordToLearn.trim() || wordToLearn === '-' || wordToLearn === 'Translation failed') {
            console.warn("Attempted to learn an invalid word:", wordToLearn);
            return;
        }

        console.log("Attempting to learn:", wordToLearn);

        // Add to learned list (if not already there)
        if (!learnedWords.includes(wordToLearn)) {
            learnedWords.push(wordToLearn);
            displayLearnedWords(); // Update UI
            console.log(`Added "${wordToLearn}" to local learned list.`);
        } else {
            alert(`"${wordToLearn}" is already marked as learned locally.`);
            // Optionally allow re-opening the issue link anyway
        }

        // Disable the specific button that was clicked
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.textContent = 'Saving...';
        }

        // --- Generate GitHub Issue Link ---
        const langInfo = languageMap[currentLanguage];
        if (!langInfo) {
             console.error("Cannot create GitHub link: Language info not found for", currentLanguage);
             // Re-enable button maybe?
             if (buttonElement) {
                buttonElement.disabled = false; // Re-enable if we can't proceed
                buttonElement.textContent = '✅ I learnt this!';
             }
             return;
        }
        const title = encodeURIComponent(`Add learned word: ${wordToLearn} (${currentLanguage})`); // Use wordToLearn
        const body = encodeURIComponent(
    `Please add the following word to the learned list for ${currentLanguage.toUpperCase()}.

    Word: **${wordToLearn}**

    File to update: \`data/learned_${langInfo.filePrefix}.json\`

    Make sure the JSON structure remains valid (array within a "words" key):
    \`\`\`json
    {
      "words": [
        "existing_word_1",
        "existing_word_2",
        "${wordToLearn}"
      ]
    }
    \`\`\`

    After editing the file, commit the change and push it to the main branch.
    `);
        const issueUrl = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`;

        // Open the link in a new tab
        window.open(issueUrl, '_blank');

        // Reset the specific button after a delay
        setTimeout(() => {
            if (buttonElement) {
                 buttonElement.textContent = '✅ I learnt this!';
                 // Keep the button disabled after saving to prevent immediate re-clicks
                 // buttonElement.disabled = false;
            }

             // Only get a new SUGGESTION if the suggestion button was the one clicked
             if (buttonElement && buttonElement.id === 'i-learnt-this-btn') {
                 console.log("Getting new suggestion after learning suggested word.");
                 getNewSuggestion(); // Move to the next suggestion word
             } else if (buttonElement && buttonElement.id === 'learnt-translated-btn') {
                 console.log("Learned translated word. Resetting translation UI.");
                 // Optionally clear the translation box or just leave it as is
                 // currentWordDisplay.textContent = "-";
                 // translateInput.value = ""; // Clear input box?
                 // learntTranslatedBtn.disabled = true; // Keep disabled until next translation
             }
        }, 1500); // Give some visual feedback time
    }

    // --- Event Listeners ---

    languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        console.log(`Language changed to: ${currentLanguage}`);
        currentSuggestion = null;
        suggestionWordDisplay.textContent = '-';
        currentWordDisplay.textContent = '-';
        translateInput.value = ''; // Clear input on language change
        iLearntThisBtn.disabled = true;
        learntTranslatedBtn.disabled = true;
        speakSuggestionBtn.disabled = true;
        speakAgainBtn.disabled = true;
        loadLanguageData(currentLanguage);
    });

    // Speaks the SUGGESTED word
    speakSuggestionBtn.addEventListener('click', () => speakWord(currentSuggestion));

    // Speaks the word currently shown in the TRANSLATION display
    speakAgainBtn.addEventListener('click', () => speakWord(currentWordDisplay.textContent));

    // Gets a new SUGGESTION
    nextWordBtn.addEventListener('click', getNewSuggestion);

    // Learns the SUGGESTED word
    iLearntThisBtn.addEventListener('click', (event) => handleLearnWord(currentSuggestion, event.currentTarget));

    // Learns the TRANSLATED word
    learntTranslatedBtn.addEventListener('click', (event) => {
        const translatedWord = currentWordDisplay.textContent;
        handleLearnWord(translatedWord, event.currentTarget);
    });

    toggleLearnedBtn.addEventListener('click', () => {
        const isHidden = learnedWordsList.classList.toggle('hidden');
        toggleLearnedBtn.textContent = isHidden ? 'Show' : 'Hide';
    });

    translateAndSpeakBtn.addEventListener('click', async () => {
        const text = translateInput.value.trim();
        if (!text) return;

        const langInfo = languageMap[currentLanguage];
        if (!langInfo) {
            console.error("Cannot translate: Language info missing for", currentLanguage);
            currentWordDisplay.textContent = "Language Error";
            return;
        }
        const targetLangCode = langInfo.code;
        currentWordDisplay.textContent = "Translating..."; // Indicate activity
        learntTranslatedBtn.disabled = true; // Disable while translating

        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`);
            if (!response.ok) {
                throw new Error(`Translation API error! status: ${response.status}`);
            }
            const data = await response.json();
            // Extract translation, handle potential variations in response structure
            const translated = data?.[0]?.[0]?.[0] || "Translation failed";

            currentWordDisplay.textContent = translated; // Display result

            if (translated && translated !== "Translation failed") {
                speak(translated, targetLangCode, langInfo.voiceName); // Speak the translation
                learntTranslatedBtn.disabled = false; // Enable the button for this translation
                learntTranslatedBtn.textContent = '✅ I learnt this!'; // Reset text
                // Optionally disable the suggestion learn button if you translated something
                 // iLearntThisBtn.disabled = true;
            } else {
                 learntTranslatedBtn.disabled = true; // Keep disabled if translation failed
            }

        } catch (err) {
            console.error("Translation or Speaking failed:", err);
            currentWordDisplay.textContent = "Translation failed";
            learntTranslatedBtn.disabled = true; // Ensure disabled on error
        }
    });

    // --- Initialisation ---
    function initialize() {
        if (voices.length === 0 && synth.getVoices().length === 0) {
             // Voices might load asynchronously, wait a bit longer if needed
             console.log("Waiting for voices to load...");
            setTimeout(initialize, 250);
            return;
        }
         if (voices.length === 0) { // If still empty, populate again
             populateVoiceList();
         }
        console.log("App Initialized. Voices ready.");
        loadLanguageData(currentLanguage); // Load data for the default language
    }

    initialize(); // Start the app
});