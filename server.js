import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import movieRoutes from './routes/movieRoutes.js';
import tmdbRoutes from './routes/tmdbRoutes.js';

dotenv.config();

const app = express();
const port = 3001;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use movie routes
app.use('/api/movies', movieRoutes);

// Use TMDB routes
app.use('/api/tmdb', tmdbRoutes);

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});