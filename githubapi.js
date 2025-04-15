// Ensure you have OWNER and REPO correctly defined
// Example: const OWNER = "your-github-username";
// Example: const REPO = "your-repo-name";
const OWNER = "kiranprasad2001"; // Replace if necessary
const REPO = "translate"; // Replace if necessary

const GH_TOKEN = import.meta.env.VITE_GH_TOKEN; // Make sure VITE_GH_TOKEN is set in your environment!

// Helper function to fetch file content and SHA
async function getGithubFile(lang) {
  const filePath = `learned/${lang}.json`;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Authorization: `Bearer ${GH_TOKEN}` // Token might not be needed for public repo read, but good practice
      },
    });

    if (res.status === 404) {
      // File doesn't exist yet
      return { content: "[]", sha: null, exists: false };
    }

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    // Content is Base64 encoded, decode it
    const decodedContent = atob(data.content);
    return { content: decodedContent, sha: data.sha, exists: true };

  } catch (error) {
    console.error(`Error fetching file ${filePath} from GitHub:`, error);
    throw error; // Re-throw to be caught by calling function
  }
}

// Updated function to save word using GitHub Contents API
export async function saveLearnedWord(word, lang) {
  if (!GH_TOKEN) {
    throw new Error("GitHub Token (VITE_GH_TOKEN) is not configured.");
  }

  const filePath = `learned/${lang}.json`;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;

  try {
    // 1. Get current file content and SHA
    const { content: currentJson, sha, exists } = await getGithubFile(lang);

    // 2. Parse JSON and add the new word
    let learnedWords = [];
    try {
        learnedWords = JSON.parse(currentJson);
        if (!Array.isArray(learnedWords)) { // Basic validation
           console.warn(`Content of ${filePath} is not a valid JSON array. Resetting.`);
           learnedWords = [];
        }
    } catch(parseError) {
        console.warn(`Error parsing JSON from ${filePath}, resetting file content. Error: ${parseError}`);
        learnedWords = []; // Reset if parsing fails
    }


    // Add word only if it's not already included (case-insensitive check)
    if (!learnedWords.some(w => w.toLowerCase() === word.toLowerCase())) {
      learnedWords.push(word);
    } else {
        console.log(`Word "${word}" already exists in ${lang}.json`);
        return; // Don't update if word already exists
    }

    // 3. Prepare data for GitHub API PUT request
    const updatedJson = JSON.stringify(learnedWords, null, 2); // Pretty print JSON
    const updatedContentBase64 = btoa(updatedJson); // Encode content to Base64

    const commitMessage = `Add learned word "${word}" to ${lang}`;
    const body = {
      message: commitMessage,
      content: updatedContentBase64,
      sha: exists ? sha : undefined // Include SHA only if the file exists (for updates)
    };

    // 4. Send PUT request to update/create the file
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`GitHub API error (${res.status}): ${errorData.message || 'Failed to update file'}`);
    }

    console.log(`Successfully saved "${word}" to ${filePath}`);

  } catch (error) {
    console.error(`Error saving word "${word}" to ${filePath}:`, error);
    // Re-throw the error so it can be caught in main.js and shown to the user
    throw error; 
  }
}


// Function to get learned words (fetches from raw content URL, simpler and often faster for read-only)
export async function getLearnedWords(lang) {
    // Using raw.githubusercontent is generally fine for reading public data.
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/learned/${lang}.json?timestamp=${new Date().getTime()}`; // Add timestamp to try bypass cache
    
    try {
        const res = await fetch(url);
        // If the file doesn't exist (404), return an empty array
        if (res.status === 404) { 
            return [];
        }
        if (!res.ok) {
            // Log other errors but still return empty array to avoid breaking the UI
            console.error(`Error fetching learned words from ${url}: ${res.status}`);
            return []; 
        }
        const data = await res.json();
         // Ensure it's an array before returning
        return Array.isArray(data) ? data : [];
    } catch(error) {
        console.error(`Error parsing learned words JSON from ${url}:`, error);
        return []; // Return empty array on parsing error
    }
}