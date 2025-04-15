import { translate, speakSlowly } from "./utils.js";
import { saveLearnedWord, getLearnedWords } from "./githubapi.js";

window.translateAndSpeak = async function () {
  const lang = document.getElementById("language").value;
  const text = document.getElementById("inputText").value;

  const translated = await translate(text, lang);
  document.getElementById("translatedText").innerText = translated;
  speakSlowly(translated, lang);
};

window.saveWord = async function () {
  const lang = document.getElementById("language").value;
  const word = document.getElementById("inputText").value;

  await saveLearnedWord(word, lang);
  loadLearnedWords();
};

async function loadLearnedWords() {
  const lang = document.getElementById("language").value;
  const words = await getLearnedWords(lang);
  const list = document.getElementById("learnedWords");
  list.innerHTML = "";

  words.forEach(word => {
    const li = document.createElement("li");
    li.textContent = word;
    list.appendChild(li);
  });
}

document.getElementById("language").addEventListener("change", loadLearnedWords);
window.addEventListener("DOMContentLoaded", loadLearnedWords);
