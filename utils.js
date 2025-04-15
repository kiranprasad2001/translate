export async function translate(text, lang) {
  const target = {
    french: "fr",
    mandarin: "zh-CN",
    spanish: "es"
  }[lang];

  const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`);
  const data = await res.json();
  return data[0][0][0];
}

export function speakSlowly(text, lang) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = {
    french: "fr-FR",
    mandarin: "zh-CN",
    spanish: "es-ES"
  }[lang];
  utter.rate = 0.6;
  synth.speak(utter);
}
