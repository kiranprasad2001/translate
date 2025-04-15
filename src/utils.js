export async function translateWord(text, targetLang) {
  const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
  const json = await res.json();
  return json[0][0][0];
}

export function speakSlowly(text, lang) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langMap(lang);
  utterance.rate = 0.6;
  speechSynthesis.speak(utterance);
}

function langMap(code) {
  return { fr: "fr-FR", zh: "zh-CN", es: "es-ES", en: "en-US" }[code] || "en-US";
}

export function saveWord(word, lang) {
  fetch("https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/issues", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_GITHUB_PAT", // TEMP: should be moved to secure backend
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: `learn:${lang}`,
      body: `Add "${word}" to ${lang}`
    })
  });
}

export async function getLearnedWords(lang) {
  try {
    const res = await fetch(`/learned/${lang}.json`);
    return await res.json();
  } catch {
    return [];
  }
}
