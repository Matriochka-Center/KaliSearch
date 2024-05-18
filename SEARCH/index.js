import express from 'express';
import cheerio from 'cheerio';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = 3002;
const MONGO_URI = 'mongodb+srv://kalisearch:12RJKw75ElO8dTUd@cluster0.z8zdf0m.mongodb.net/kali_search';

// Connexion à MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion à MongoDB:'));
db.once('open', () => {
    console.log("Connecté à MongoDB");
});

// Définir le schéma et le modèle pour les documents
const documentSchema = new mongoose.Schema({
    url: String,
    content: String,
    links: Array
});

const Document = mongoose.model('Document', documentSchema, 'web_data');

// Fonction pour diviser le texte en phrases
function splitIntoSentences(text) {
    const sentenceRegex = /[^.!?]+[.!?]/g;
    return text.match(sentenceRegex) || [];
}

// Fonction de recherche
async function search(query) {
    const results = [];
    const lowerCaseQuery = query.toLowerCase();

    console.log(`Recherche pour : ${query}`);

    try {
        const docs = await Document.find();

        docs.forEach(doc => {
            const $ = cheerio.load(doc.content);
            const textContent = $('body').text();
            const sentences = splitIntoSentences(textContent);

            for (const sentence of sentences) {
                if (sentence.toLowerCase().includes(lowerCaseQuery)) {
                    results.push({ url: doc.url, snippet: sentence.trim() });
                    break; // Arrêter après avoir trouvé la première phrase correspondante dans ce document
                }
            }
        });

        console.log(`Résultats trouvés : ${results.length}`);
        return results;
    } catch (error) {
        console.error("Erreur lors de la recherche :", error);
        throw error; // Propager l'erreur pour qu'elle soit gérée par le bloc `catch` de la route de recherche
    }
}

app.use(cors());

// Route de recherche
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Le paramètre de requête "q" est requis' });
    }

    try {
        const results = await search(query);
        res.send(results);
    } catch (error) {
        console.error("Erreur lors de la recherche :", error);
        res.status(500).send({ error: 'Erreur interne du serveur' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
