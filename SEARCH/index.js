import fs from 'fs';
import path from 'path';
import express from 'express';
import cheerio from 'cheerio';

const app = express();
const PORT = 3000;

// Define the path to the JSON file
const jsonFilePath = path.join(path.resolve(), '../Data/2.json');

// Read and parse the JSON file
let jsonData;
try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    jsonData = JSON.parse(fileContent);
} catch (error) {
    console.error('Error reading or parsing the JSON file:', error);
    process.exit(1);
}

// Index the data
const searchIndex = {};
for (const [url, data] of Object.entries(jsonData)) {
    searchIndex[url] = {
        content: data.content,
        links: data.links
    };
}

// Function to split text into sentences
function splitIntoSentences(text) {
    const sentenceRegex = /[^.!?]+[.!?]/g;
    return text.match(sentenceRegex) || [];
}

// Search function
function search(query) {
    const results = [];

    for (const [url, data] of Object.entries(searchIndex)) {
        const $ = cheerio.load(data.content);
        const textContent = $('body').text();
        const sentences = splitIntoSentences(textContent);

        for (const sentence of sentences) {
            if (sentence.includes(query)) {
                results.push({ url, snippet: sentence.trim() });
                break; // Stop after finding the first matching sentence in this document
            }
        }
    }
    return results;
}

// Search route
app.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Query parameter "q" is required' });
    }

    const results = search(query);
    res.send(results);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
