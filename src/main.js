import { speakSlowly, translateWord, saveWord, getLearnedWords } from './utils.js';

const root = document.getElementById("root");

const langs = {
  en: "English",
  fr: "French",
  zh: "Mandarin",
  es: "Spanish"
};

let selectedLang = "fr";

const render = async () => {
  root.innerHTML = `
    <input type="text" id="word" placeholder="Enter a word" />
    <select id="lang">${Object.entries(langs).map(([k, v]) => `<option value="${k}">${v}</option>`)}</select>
    <button id="translate">Translate + Speak</button>
    <button id="learn">Mark as Learned</button>
    <button id="show">Show Learned Words</button>
    <div id="output"></div>
    <div class="word-list" id="learned"></div>
  `;

  document.getElementById("lang").value = selectedLang;

  document.getElementById("lang").onchange = (e) => {
    selectedLang = e.target.value;
  };

  document.getElementById("translate").onclick = async () => {
    const word = document.getElementById("word").value;
    const translated = await translateWord(word, selectedLang);
    document.getElementById("output").textContent = translated;
    speakSlowly(translated, selectedLang);
  };

  document.getElementById("learn").onclick = () => {
    const word = document.getElementById("word").value;
    saveWord(word, selectedLang);
    alert("Marked as learned!");
  };

  document.getElementById("show").onclick = async () => {
    const list = await getLearnedWords(selectedLang);
    document.getElementById("learned").innerHTML = `<strong>Learned (${langs[selectedLang]}):</strong><br>${list.join(", ")}`;
  };
};

render();
