document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const GITHUB_USER = 'kiranprasad2001'; // Replace if needed
    const GITHUB_REPO = 'translate';      // Replace if needed

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
    let currentSuggestion = null; // Will hold the target language word for suggestions
    let suggestionWords = []; // Array of target language suggestion words
    let learnedWords = []; // Will store objects: { english: "...", target: "..." }
    let synth = window.speechSynthesis;
    let voices = [];

    // --- Language Mapping ---
    const languageMap = {
        'ch': { code: 'zh-CN', voiceName: 'Google 中文（普通话）', filePrefix: 'ch' },
        'fr': { code: 'fr-FR', voiceName: 'Google Français', filePrefix: 'fr' },
        'es': { code: 'es-ES', voiceName: 'Google Español', filePrefix: 'es' },
        'de': { code: 'de-DE', voiceName: 'Google Deutsch', filePrefix: 'de' },
    };

    // --- Core Functions ---

    function populateVoiceList() {
        voices = synth.getVoices();
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    function speak(text, langCode, voiceNameHint) {
        // (Speak function remains the same as before)
        if (!synth) {
            alert('Sorry, your browser does not support Text-to-Speech.');
            return;
        }
        if (synth.speaking) {
            console.log('SpeechSynthesis currently speaking, cancelling previous utterance.');
             synth.cancel();
        }
        if (text && text.trim() !== '' && text !== '-') { // Added check for '-' placeholder
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
            utterThis.rate = 0.7;
            utterThis.volume = 1;

            synth.speak(utterThis);
        } else {
             console.warn("Speak function called with invalid text:", text);
        }
    }

    async function loadJsonData(filePath) {
        // Load data - expects format like { "words": ["word1", ...] } OR { "words": [{ "english": "...", "target": "..."}, ...]}
        // We'll adapt to whichever format the file currently uses for backwards compatibility,
        // but new saves will use the object format.
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
            // Process loaded words: If they are strings, convert them to the new object format for consistency internally.
            // If they are already objects, use them as is.
            const wordsArray = Array.isArray(data?.words) ? data.words : [];
            return wordsArray.map(item => {
                if (typeof item === 'string') {
                    // Old format detected: create an object, assuming the string is the target word
                    return { english: "(loaded string)", target: item };
                } else if (typeof item === 'object' && item !== null && item.hasOwnProperty('target')) {
                    // New format detected (or partially new), ensure 'english' exists
                    return { english: item.english || "(missing english)", target: item.target };
                } else {
                    // Invalid item format
                     console.warn("Invalid item format in loaded JSON:", item);
                     return null; // Filter this out later
                }
            }).filter(item => item !== null); // Remove any invalid items
        } catch (error) {
            console.error(`Error loading or parsing data from ${filePath}:`, error);
            return [];
        }
    }


    async function loadLanguageData(langKey) {
        // (Load language data remains mostly the same, but uses the updated loadJsonData)
        const langInfo = languageMap[langKey];
        if (!langInfo) {
            console.error(`Language key "${langKey}" not found in languageMap.`);
            suggestionWords = [];
            learnedWords = [];
            suggestionWordDisplay.textContent = 'Language Error!';
            learnedWordsList.innerHTML = '<p>Invalid language selected.</p>';
            return;
        }
        // Suggestion words are still expected as simple strings in their JSON file (e.g., data/words_fr.json)
        const suggestionFilePath = `data/words_${langInfo.filePrefix}.json`;
        // Learned words file might contain strings (old) or objects (new)
        const learnedFilePath = `data/learned_${langInfo.filePrefix}.json`;

        suggestionWordDisplay.textContent = 'Loading...';
        learnedWordsList.innerHTML = '<div class="loader"></div> Loading learned words...';

        try {
            // Load suggestions (still expecting strings)
             const suggestionData = await loadJsonData(suggestionFilePath);
             // Ensure suggestions are strings, filter out any potential objects if format is mixed
             suggestionWords = suggestionData.map(item => typeof item === 'object' ? item.target : item).filter(item => typeof item === 'string');

             // Load learned words (using the updated loadJsonData that handles objects)
            learnedWords = await loadJsonData(learnedFilePath);

            console.log(`Loaded ${suggestionWords.length} suggestions.`);
            console.log(`Loaded ${learnedWords.length} learned word pairs (or converted strings).`);
        } catch (error) {
            console.error(`Failed to load language data for ${langKey}:`, error);
            suggestionWords = [];
            learnedWords = [];
            suggestionWordDisplay.textContent = 'Error!';
            learnedWordsList.innerHTML = `<p style="color: red;">Could not load data.</p>`;
        }

        displayLearnedWords(); // Display the learned pairs
        getNewSuggestion(); // Get the first suggestion
    }

    function getNewSuggestion() {
        // Filter suggestions: Find suggestion words (strings) that are NOT the 'target' part of any learned word object
        const learnedTargetWords = learnedWords.map(pair => pair.target);
        const availableSuggestions = suggestionWords.filter(word => !learnedTargetWords.includes(word));

        // (Rest of the logic for handling suggestions remains the same)
         if (availableSuggestions.length === 0) {
            if (suggestionWords.length > 0 && suggestionWords.every(word => learnedTargetWords.includes(word))) {
                 suggestionWordDisplay.textContent = "Wow! You learned all the suggestion words! 🎉";
            } else {
                suggestionWordDisplay.textContent = "No suggestion words found or left!";
            }
            currentSuggestion = null;
            currentWordDisplay.textContent = '-';
            iLearntThisBtn.disabled = true;
            learntTranslatedBtn.disabled = true;
            speakSuggestionBtn.disabled = true;
            speakAgainBtn.disabled = true;
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableSuggestions.length);
        currentSuggestion = availableSuggestions[randomIndex]; // This is the target language word
        suggestionWordDisplay.textContent = currentSuggestion;
        currentWordDisplay.textContent = '-';

        iLearntThisBtn.disabled = false;
        iLearntThisBtn.textContent = '✅ I learnt this!';
        speakSuggestionBtn.disabled = false;
        speakAgainBtn.disabled = true; // Disable this until translation happens or suggestion is spoken? Let's disable.

        learntTranslatedBtn.disabled = true;
        learntTranslatedBtn.textContent = '✅ I learnt this!';
    }

    function displayLearnedWords() {
        learnedWordsList.innerHTML = ''; // Clear previous list
        if (learnedWords.length === 0) {
            learnedWordsList.innerHTML = '<p>No words learned for this language yet!</p>';
            return;
        }
  
        learnedWords.forEach(pair => {
            // Create a container div for the pair (the "card")
            const pairCard = document.createElement('div');
            pairCard.classList.add('learned-pair-card'); // New class for the card
  
            // Create element for the English word
            const englishElement = document.createElement('span');
            englishElement.textContent = pair.english;
            englishElement.classList.add('english-word'); // Class for styling English word
  
            // Create element for the Target word
            const targetElement = document.createElement('span');
            targetElement.textContent = pair.target;
            targetElement.classList.add('target-word'); // Class for styling Target word
            targetElement.title = `Click to hear "${pair.target}"`; // Tooltip
  
            // Append English and Target words to the card
            pairCard.appendChild(englishElement);
            pairCard.appendChild(targetElement);
  
            // Add click listener to the CARD to speak the TARGET word
            pairCard.addEventListener('click', () => speakWord(pair.target));
  
            // Append the card to the list container
            learnedWordsList.appendChild(pairCard);
        });
    }

    // Speaks a given word (usually the target language word)
    function speakWord(word) {
        const langInfo = languageMap[currentLanguage];
        if (word && word !== '-' && langInfo) {
            speak(word, langInfo.code, langInfo.voiceName);
        } else {
             console.warn("speakWord called with invalid word or language info", word, langInfo);
        }
    }

    // Modified to accept the ENGLISH word and the TARGET word
    function handleLearnWord(englishWord, targetWord, buttonElement) {
        if (!targetWord || !targetWord.trim() || targetWord === '-' || targetWord === 'Translation failed') {
            console.warn("Attempted to learn an invalid target word:", targetWord);
            return;
        }
         // Use a placeholder if English word is missing (e.g., from old data or suggestion)
         const englishToSave = englishWord && englishWord.trim() ? englishWord.trim() : "(suggestion)";

        console.log(`Attempting to learn pair: "${englishToSave}" -> "${targetWord}"`);

        // Check if the TARGET word is already in the learned list
        const alreadyLearned = learnedWords.some(pair => pair.target === targetWord);

        if (!alreadyLearned) {
            const newPair = { english: englishToSave, target: targetWord };
            learnedWords.push(newPair);
            displayLearnedWords(); // Update UI
            console.log(`Added pair "${englishToSave}" -> "${targetWord}" to local learned list.`);
        } else {
            alert(`The word "${targetWord}" is already marked as learned.`);
            // Re-enable the button immediately if already learned?
            if (buttonElement) {
                buttonElement.disabled = false;
                buttonElement.textContent = '✅ I learnt this!';
            }
            return; // Don't proceed to open GitHub issue if already learned
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
             if (buttonElement) {
                buttonElement.disabled = false;
                buttonElement.textContent = '✅ I learnt this!';
             }
             return;
        }
        // Update title and body for the pair
        const title = encodeURIComponent(`Add learned pair: ${englishToSave} / ${targetWord} (${currentLanguage})`);
        const body = encodeURIComponent(
    `Please add the following word pair to the learned list for ${currentLanguage.toUpperCase()}.

    English: **${englishToSave}**
    Target (${langInfo.code}): **${targetWord}**

    File to update: \`data/learned_${langInfo.filePrefix}.json\`

    Make sure the JSON structure contains objects with "english" and "target" keys within the "words" array:
    \`\`\`json
    {
      "words": [
        { "english": "existing_en_1", "target": "existing_target_1" },
        { "english": "existing_en_2", "target": "existing_target_2" },
        { "english": "${englishToSave}", "target": "${targetWord}" }
      ]
    }
    \`\`\`

    After editing the file, commit the change and push it to the main branch.
    `);
        const issueUrl = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`;

        window.open(issueUrl, '_blank');

        setTimeout(() => {
            if (buttonElement) {
                 buttonElement.textContent = '✅ I learnt this!';
                 // Keep disabled after saving
            }
             if (buttonElement && buttonElement.id === 'i-learnt-this-btn') {
                 getNewSuggestion(); // Get new suggestion only if the suggestion button was clicked
             }
        }, 1500);
    }

    // --- Event Listeners ---

    languageSelect.addEventListener('change', (e) => {
        // (Same as before)
        currentLanguage = e.target.value;
        console.log(`Language changed to: ${currentLanguage}`);
        currentSuggestion = null;
        suggestionWordDisplay.textContent = '-';
        currentWordDisplay.textContent = '-';
        translateInput.value = '';
        iLearntThisBtn.disabled = true;
        learntTranslatedBtn.disabled = true;
        speakSuggestionBtn.disabled = true;
        speakAgainBtn.disabled = true;
        loadLanguageData(currentLanguage);
    });

    // Speaks the SUGGESTED word (target language)
    speakSuggestionBtn.addEventListener('click', () => speakWord(currentSuggestion));

    // Speaks the word currently shown in the TRANSLATION display (target language)
    speakAgainBtn.addEventListener('click', () => speakWord(currentWordDisplay.textContent));

    // Gets a new SUGGESTION
    nextWordBtn.addEventListener('click', getNewSuggestion);

    // Learns the SUGGESTED word -> saving pair like { english: "(suggestion)", target: "..." }
    iLearntThisBtn.addEventListener('click', (event) => {
        // For suggestions, we only have the target word (currentSuggestion)
        // We'll pass null or a placeholder for the English part
        handleLearnWord("(suggestion)", currentSuggestion, event.currentTarget);
    });

    // Learns the TRANSLATED word -> saving pair like { english: "InputText", target: "TranslatedText" }
    learntTranslatedBtn.addEventListener('click', (event) => {
        const englishWord = translateInput.value; // Get the original input
        const targetWord = currentWordDisplay.textContent; // Get the translation result
        handleLearnWord(englishWord, targetWord, event.currentTarget);
    });

    toggleLearnedBtn.addEventListener('click', () => {
        // (Same as before)
        const isHidden = learnedWordsList.classList.toggle('hidden');
        toggleLearnedBtn.textContent = isHidden ? 'Show' : 'Hide';
    });

    translateAndSpeakBtn.addEventListener('click', async () => {
        // (Translation logic is the same, but enable speakAgainBtn)
        const text = translateInput.value.trim();
        if (!text) return;

        const langInfo = languageMap[currentLanguage];
        if (!langInfo) {
            console.error("Cannot translate: Language info missing for", currentLanguage);
            currentWordDisplay.textContent = "Language Error";
            return;
        }
        const targetLangCode = langInfo.code;
        const phoneticDisplayElement = document.getElementById('current-phonetic-display'); // Get the new element
        currentWordDisplay.textContent = "Translating..."; // Indicate activity
        phoneticDisplayElement.textContent = ''; // Clear previous phonetic text
        learntTranslatedBtn.disabled = true; // Disable until translation is done
        speakAgainBtn.disabled = true; // Disable until translation is done
        try {
            //const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`);
            const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLangCode}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Translation API error! status: ${response.status}`);
            }
            const data = await response.json();
            // --- Optional Debugging line ---
            // console.log("Full API Response:", JSON.stringify(data));
            // ---
            // Extract translation (confirmed at data[0][0][0])
            const translated = data?.[0]?.[0]?.[0] || "Translation failed";

            // **** Extract phonetic/romanization using the CORRECT index found in the log ****
            let phonetic = data?.[0]?.[1]?.[2] || null; // Use index [0][1][2]

            // Sometimes the phonetic might be the same as the source if no transliteration exists
            if (phonetic === text || phonetic === translated) {
                phonetic = null; // Don't show if it's just repeating input/output
            }

            currentWordDisplay.textContent = translated; // Display result
            phoneticDisplayElement.textContent = phonetic || ''; // Display phonetic text or empty string

            if (translated && translated !== "Translation failed") {
                speak(translated, targetLangCode, langInfo.voiceName);
                learntTranslatedBtn.disabled = false; // Enable saving the translated pair
                learntTranslatedBtn.textContent = '✅ I learnt this!';
                speakAgainBtn.disabled = false; // Enable speaking the translation again

                // --- IMPORTANT: Saving Phonetics? ---
                // If you want to save the phonetic along with the pair, you'd need to:
                // 1. Modify the `handleLearnWord` function to accept phonetic data.
                // 2. Update the learnedWords array structure (e.g., { english: "...", target: "...", phonetic: "..." }).
                // 3. Update the GitHub issue body generation to include phonetics.
                // 4. Update the displayLearnedWords function to show phonetics on the cards.
                // This adds significant complexity, so we're skipping it for now.
                // The current handleLearnWord call for the translation button would remain:
                // handleLearnWord(text, translated, learntTranslatedBtn); // Pass original English and target
                // ---

            } else {
                 learntTranslatedBtn.disabled = true;
                 speakAgainBtn.disabled = true;
            }

        } catch (err) {
            console.error("Translation or Speaking failed:", err);
            currentWordDisplay.textContent = "Translation failed";
            phoneticDisplayElement.textContent = ''; // Clear on error
            learntTranslatedBtn.disabled = true;
            speakAgainBtn.disabled = true;
        }
    });

    // --- Initialisation ---
    function initialize() {
        // (Same as before)
        if (voices.length === 0 && synth.getVoices().length === 0) {
             console.log("Waiting for voices to load...");
            setTimeout(initialize, 250);
            return;
        }
         if (voices.length === 0) {
             populateVoiceList();
         }
        console.log("App Initialized. Voices ready.");
        loadLanguageData(currentLanguage);
    }

    initialize();
});