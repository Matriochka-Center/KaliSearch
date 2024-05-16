import fs from 'fs';
import path from 'path';
import express from 'express';
import cheerio from 'cheerio';

const app = express();
const PORT = 3000;

// Lire le fichier JSON
const jsonFilePath = path.join(path.resolve(), '../Data/1.json');
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

// Indexer les données
const searchIndex = {};
for (const [url, data] of Object.entries(jsonData)) {
    searchIndex[url] = {
        content: data.content,
        links: data.links
    };
}

// Fonction de recherche
function search(query) {
    const results = [];
    const maxContentLength = 100; // Définir la longueur maximale du contenu à renvoyer

    for (const [url, data] of Object.entries(searchIndex)) {
        if (data.content.includes(query)) {
            const $ = cheerio.load(data.content);
            const textContent = $('body').text(); // Extraire le texte du corps de la page
            const startIndex = textContent.indexOf(query);
            let snippet = textContent.substring(startIndex, startIndex + maxContentLength);
            if (startIndex > 0) {
                snippet = '...' + snippet; // Ajouter des points de suspension s'il y a du contenu avant
            }
            if (startIndex + maxContentLength < textContent.length) {
                snippet += '...'; // Ajouter des points de suspension s'il y a du contenu après
            }
            results.push({ url, snippet });
        }
    }
    return results;
}

// Route de recherche
app.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Query parameter "q" is required' });
    }

    const results = search(query);
    res.send(results);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
