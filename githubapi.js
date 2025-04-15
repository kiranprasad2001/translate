const REPO = "kiranprasad2001/translate";
const OWNER = "kiranprasad2001";

export async function saveLearnedWord(word, lang) {
  const title = `word:${lang}`;
  const body = `Add "${word}" to ${lang} learned list`;

  await fetch("https://api.github.com/repos/" + REPO + "/issues", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GH_TOKEN}`,
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify({ title, body })
  });
}

export async function getLearnedWords(lang) {
  const res = await fetch(`https://raw.githubusercontent.com/${REPO}/main/learned/${lang}.json`);
  if (!res.ok) return [];
  return await res.json();
}
