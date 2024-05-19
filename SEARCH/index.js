import express from "express";
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";
import cheerio from "cheerio";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI;

let collection;

// Connexion à MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    await client.connect();
    const db = client.db("kali_search");
    collection = db.collection("web_data");
    console.log("Connecté à MongoDB");
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
  }
}

// Fonction pour diviser le texte en phrases
function splitIntoSentences(text) {
  const sentenceRegex = /[^.!?]+[.!?]/g;
  return text.match(sentenceRegex) || [];
}

// Fonction de recherche avec limite de 10 résultats
async function search(query) {
  const results = [];
  const lowerCaseQuery = query.toLowerCase();

  console.log(`Recherche pour : ${query}`);

  try {
    const docs = await collection
      .find({ $text: { $search: query } })
      .limit(10)
      .toArray(); // Limiter à 10 documents

    docs.forEach((doc) => {
      const $ = cheerio.load(doc.content);
      const textContent = $("body").text();
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
app.use(bodyParser.json());

// Route de recherche
app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res
      .status(400)
      .send({ error: "Le champ de recherche ne doit pas être vide" });
  }

  try {
    const results = await search(query);
    res.send(results);
  } catch (error) {
    console.error("Erreur lors de la recherche :", error);
    res.status(500).send({ error: "Erreur interne du serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  connectToDatabase();
});
