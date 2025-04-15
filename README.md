# Kinder Learn - Fun Language Learning

A simple, fun website hosted on GitHub Pages for kids (especially kindergarteners) to learn words in different languages using Text-to-Speech.

**Live Site:** [https://learn.spotrot.com](https://learn.spotrot.com) (Replace with your actual URL)

## Features

*   Select different languages (English, French, Spanish, German supported initially).
*   Get word suggestions one by one.
*   Hear the word spoken slowly using the browser's Text-to-Speech.
*   Mark words as "learnt".
*   See a list of previously learned words for the selected language.
*   Kid-friendly interface.
*   Hosted entirely free on GitHub Pages.

## How Saving Works (Parent's Guide)

This site uses a secure method to save learned words without exposing sensitive tokens:

1.  **Click "I learnt this":** When your child learns a word and clicks the "✅ I learnt this!" button, a new browser tab will open.
2.  **GitHub Issue:** This tab goes to the "New Issue" page for *this* repository (`kiranprasad2001/translate`). The title and body will be pre-filled with the word and instructions.
3.  **Submit Issue:** Review the details and click "Submit new issue". This just creates a record.
4.  **Update JSON File:** You (the parent) need to manually edit the correct data file:
    *   Navigate to the `data/` folder in this repository.
    *   Find the file corresponding to the language (e.g., `learned_fr.json` for French).
    *   Edit the file (you can do this directly on GitHub).
    *   Add the new learned word as a string inside the `"words": []` array. Ensure the JSON format remains valid (comma-separated strings within the square brackets).
    *   **Example:** If adding "chat" to `learned_fr.json` which already contains `["bonjour"]`:
        ```json
        {
          "words": [
            "bonjour",
            "chat"
          ]
        }
        ```
5.  **Commit Changes:** Commit the changes directly to the `main` branch.
6.  **Automatic Update:** GitHub Pages will automatically detect the change and redeploy the site (usually within 1-2 minutes). The newly learned word will then appear in the "Words I Already Know!" list on the website after a refresh.

## Adding More Words or Languages

*   **Suggestions:** Edit the `data/words_xx.json` files to add more words for the suggestion engine.
*   **New Languages:**
    1.  Add a new `<option>` to `index.html` in the `<select>` dropdown. The `value` should be a short key (e.g., `it` for Italian).
    2.  Add an entry to the `languageMap` in `script.js`, providing the `code` (BCP 47 tag like `it-IT`), a `voiceName` hint (optional, check browser defaults), and the `filePrefix` (e.g., `it`).
    3.  Create the corresponding `data/words_it.json` (for suggestions) and `data/learned_it.json` (initially `{"words":[]}`) files.
    4.  Commit and push the changes.

## Development Notes

*   Uses vanilla HTML, CSS, and JavaScript.
*   Relies on the browser's Web Speech API (`speechSynthesis`). Voice availability and quality vary between browsers and operating systems.
*   Learned words are stored in JSON files within the repository and fetched client-side.
*   The GitHub Issue workflow avoids needing backend functions or exposing API tokens.