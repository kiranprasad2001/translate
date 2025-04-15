import { translate, speakSlowly, getPronunciation } from "./utils.js"; // Added getPronunciation
import { saveLearnedWord, getLearnedWords } from "./githubapi.js";

// Debounce function to prevent rapid clicks
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function handleTranslateAndSpeak() {
  const lang = document.getElementById("language").value;
  const text = document.getElementById("inputText").value;
  const translatedTextElement = document.getElementById("translatedText");
  const pronunciationTextElement = document.getElementById("pronunciationText"); // Get pronunciation element

  // Clear previous results
  translatedTextElement.innerText = "Translating...";
  pronunciationTextElement.innerText = ""; // Clear pronunciation

  if (!text.trim()) {
      translatedTextElement.innerText = "";
      return; // Don't proceed if input is empty
  }

  try {
    const translated = await translate(text, lang);
    translatedTextElement.innerText = translated;

    // Only speak and get pronunciation if translation was successful
    if (translated && translated !== "Translation failed" && translated !== "Translation error") {
        speakSlowly(translated, lang);
        
        // Get and display pronunciation (using the placeholder function for now)
        const pronunciation = await getPronunciation(text); // Get pronunciation of the *original* English word
        pronunciationTextElement.innerText = pronunciation;
    } else {
         pronunciationTextElement.innerText = ""; // Clear pronunciation if translation failed
    }
  } catch (error) {
      console.error("Error during translation/speech:", error);
      translatedTextElement.innerText = "An error occurred.";
      pronunciationTextElement.innerText = "";
  }
}

async function handleSaveWord() {
  const lang = document.getElementById("language").value;
  const word = document.getElementById("inputText").value;
  const saveButton = event.target; // Get the button element

  if (!word.trim()) {
      alert("Please enter a word to save.");
      return;
  }
  
  // Disable button temporarily to prevent multiple clicks
  saveButton.disabled = true;
  saveButton.innerText = "Saving...";

  try {
    await saveLearnedWord(word, lang);
    alert(`"${word}" saved to ${lang} list!`);
    loadLearnedWords(); // Refresh the list
  } catch (error) {
    console.error("Failed to save word:", error);
    // Provide more specific feedback if possible (e.g., check console for GitHub API errors)
    alert(`Failed to save word. Check console for details. Error: ${error.message}`);
  } finally {
      // Re-enable button
      saveButton.disabled = false;
      saveButton.innerText = "I learnt this!";
  }
}


async function loadLearnedWords() {
  const lang = document.getElementById("language").value;
  const list = document.getElementById("learnedWords");
  list.innerHTML = "<li>Loading...</li>"; // Indicate loading

  try {
      const words = await getLearnedWords(lang);
      list.innerHTML = ""; // Clear loading/previous words

      if (words.length === 0) {
          list.innerHTML = "<li>No words learned for this language yet.</li>";
      } else {
          words.forEach(word => {
              const li = document.createElement("li");
              li.textContent = word;
              list.appendChild(li);
          });
      }
  } catch (error) {
      console.error("Failed to load learned words:", error);
      list.innerHTML = "<li>Error loading learned words.</li>";
  }
}

// Assign debounced handlers to window object for HTML onclick
window.translateAndSpeak = debounce(handleTranslateAndSpeak, 500); 
window.saveWord = debounce(handleSaveWord, 1000); // Longer debounce for save to prevent rapid API calls

// Initial load and language change listener
document.getElementById("language").addEventListener("change", loadLearnedWords);
window.addEventListener("DOMContentLoaded", loadLearnedWords);