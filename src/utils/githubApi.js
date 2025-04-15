const REPO = "your-username/kindergarten-translator";
const BRANCH = "main";
const TOKEN = "YOUR_GITHUB_PAT"; // Store this securely in production
const FILE_PATH_PREFIX = "learned/";

export async function saveWordToGitHub(word, language) {
  const path = `${FILE_PATH_PREFIX}${language}.json`;
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;

  const fileResp = await fetch(url, {
    headers: { Authorization: `token ${TOKEN}` }
  });

  const fileData = await fileResp.json();
  let content = JSON.parse(atob(fileData.content));
  if (!content.includes(word)) content.push(word);

  const updatedContent = btoa(JSON.stringify(content, null, 2));

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Add learned word: ${word}`,
      content: updatedContent,
      sha: fileData.sha,
      branch: BRANCH
    })
  });

  return res.ok;
}

