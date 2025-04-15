// Replace with your actual GitHub username and repo name
const OWNER = "kiranprasad2001";
const REPO = "translate";

// 🔐 SAFE: Uses Issues API instead of writing files directly
export async function requestWordSave(word, lang) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues`;

  const issueTitle = `word:${lang}`;
  const issueBody = `Add "${word}" to the list`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
        // 🔒 No auth token needed unless you're hitting rate limits or working with private repos
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create issue (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    console.log("Issue created:", data.html_url);
    return data;

  } catch (error) {
    console.error("Error creating GitHub Issue:", error);
    throw error;
  }
}

// ✅ Still fine to use for public read access
export async function getLearnedWords(lang) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/learned/${lang}.json?timestamp=${new Date().getTime()}`; // Prevent cache

  try {
    const res = await fetch(url);
    if (res.status === 404) {
      return [];
    }
    if (!res.ok) {
      console.error(`Error fetching learned words from ${url}: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error(`Error parsing learned words JSON from ${url}:`, error);
    return [];
  }
}
