import fs from 'fs';
import path from 'path';
import express from 'express';
import cheerio from 'cheerio';

const app = express();
const PORT = 3000;

// Définir le chemin vers le fichier JSON
const jsonFilePath = path.join(path.resolve(), '../Data/2.json');

// Lire et analyser le fichier JSON
let jsonData;
try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    jsonData = JSON.parse(fileContent);
} catch (error) {
    console.error("Erreur lors de la lecture ou de l'analyse du fichier JSON :", error);
    process.exit(1);
}

// Indexer les données
const searchIndex = {};
for (const [url, data] of Object.entries(jsonData)) {
    searchIndex[url] = {
        content: data.content,
        links: data.links
    };
}

// Fonction pour diviser le texte en phrases
function splitIntoSentences(text) {
    const sentenceRegex = /[^.!?]+[.!?]/g;
    return text.match(sentenceRegex) || [];
}

// Fonction de recherche
function search(query) {
    const results = [];
    const lowerCaseQuery = query.toLowerCase();

    for (const [url, data] of Object.entries(searchIndex)) {
        const $ = cheerio.load(data.content);
        const textContent = $('body').text();
        const sentences = splitIntoSentences(textContent);

        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(lowerCaseQuery)) {
                results.push({ url, snippet: sentence.trim() });
                break; // Arrêter après avoir trouvé la première phrase correspondante dans ce document
            }
        }
    }
    return results;
}

// Route de recherche
app.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Le paramètre de requête "q" est requis' });
    }

    const results = search(query);
    res.send(results);
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Le serveur fonctionne sur http://localhost:${PORT}`);
});
