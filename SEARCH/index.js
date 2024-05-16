import express from 'express';
const app = express();
const PORT = 3000;

// Configuration de l'application Express
app.use(express.json());

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
