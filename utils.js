export async function translate(text, lang) {
  const target = {
    french: "fr",
    mandarin: "zh-CN",
    spanish: "es"
  }[lang];

  // Basic check for empty input
  if (!text.trim()) {
    return ""; 
  }

  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    // Handle cases where translation might not be in the expected spot
    return data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : "Translation failed";
  } catch (error) {
    console.error("Translation error:", error);
    return "Translation error"; // Return an error message
  }
}

export function speakSlowly(text, lang) {
  // Basic check for empty input
  if (!text.trim() || text === "Translation failed" || text === "Translation error") {
     return; 
  }
  
  try {
    const synth = window.speechSynthesis;
    // Cancel any previous speech
    synth.cancel(); 
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = {
      french: "fr-FR",
      mandarin: "zh-CN",
      spanish: "es-ES"
    }[lang];
    utter.rate = 0.6;
    synth.speak(utter);
  } catch (error) {
      console.error("Speech synthesis error:", error);
  }
}

// --- Pronunciation Placeholder ---
// Replace this function with a real API call to get English phonetic pronunciation
export async function getPronunciation(text) {
  if (!text.trim()) return "";
  
  // ** Placeholder **: You need to replace this with an actual API call.
  // Example: Call a pronunciation API here.
  // const response = await fetch(`https://api.pronunciationexample.com/?text=${encodeURIComponent(text)}`);
  // const data = await response.json();
  // return data.pronunciation; // Adjust based on the actual API response structure
  
  console.warn("getPronunciation is a placeholder. Integrate a real API.");
  return `[Pronunciation for "${text}"]`; // Placeholder return
}
// --- End Pronunciation Placeholder ---