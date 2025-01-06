import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { distance as levenshtein } from 'fastest-levenshtein';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

const loaders = ['fabric', 'forge', 'neoforge', 'quilt'];
const loaderRegex = new RegExp(`\\(.*?(${loaders.join('|')}}).*?\\)|\\[.*?(${loaders.join('|')}).*?\\]`, 'gi');

const cleanModName = (modName: string) => {
	let cleanedModName = modName.toLowerCase().trim().replace(/\s+/g, ' ');
	cleanedModName = cleanedModName.replace(loaderRegex, '').replace(' - (fabric|forge|neoforge|quilt)', '');
	cleanedModName = cleanedModName.trim();
	return cleanedModName;
}

app.use(cors());

// serve the frontend
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

app.get('/', (req, res) => {
	// display the frontend
	res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.get('/api', (req, res) => {
	res.send('Hello World!');
});

// API endpoint to scrape Modrinth for a mod with the provided name
app.get('/api/mod/modrinth', async (req, res) => {
	const name = req.query.name as string;
	const version = req.query.version as string;
	const loader = req.query.loader as string;
	if (!name) {
		res.status(400).json({ error: 'Missing required parameter `name`.' });
		return;
	}
	if (!version) {
		res.status(400).json({ error: 'Missing required parameter `version`.' });
		return;
	}
	if (!loader) {
		res.status(400).json({ error: 'Missing required parameter `loader`.' });
		return;
	}
	try {
		// Make an HTTP GET request to the Modrinth mods page with the provided name as a query parameter (q), and the version as a query parameter (v), and the loader as a query parameter (g)
		const { data } = await axios.get('https://modrinth.com/mods', {
			params: {
				q: name,
				v: version,
				g: "categories:" + loader
			}
		});

		// Load the HTML into Cheerio for parsing
		const $ = cheerio.load(data);

		// Array to store the scraped mod details
		let bestMatch = { title: '', link: '', image: '', similarity: 0 };
		let found = false;
		let count = 0;
		const similarityThreshold = 0.5;

		// find the mod whose title best matches the provided name (the name doesn't have to match exactly)
		$('article').each((index, element) => {
			if (found) return;
			count++;

			// Extract the mod title, link, and image
			const title = $(element).find('.title > a').text().trim();
			const link = 'https://modrinth.com' + $(element).find('.title > a').attr('href');
			const image = $(element).find('img').attr('src') || '';

			// if name matches exactly, return the mod details
			console.log('comparing', title, 'to', name);
			let cleanedModName = cleanModName(title);
			let cleanedTarget = cleanModName(name);
			console.log('After cleaning:', cleanedModName, 'vs', cleanedTarget);
			if (cleanedModName === cleanedTarget) {
				bestMatch = { title, link, image, similarity: 1 };
				found = true;
				return;
			} 
			// calculate similarity between the mod title and the provided name using levenshtein distance (fuzzy matching)
			let similarity = (1 - (levenshtein(cleanedTarget, cleanedModName) / Math.max(cleanedTarget.length, cleanedModName.length)));
			// change similarity based on position (earlier is better)
			similarity *= Math.pow(0.9, index);
			if (similarity > similarityThreshold && similarity > bestMatch.similarity) {
				bestMatch = { title, link, image, similarity };
			}
		});
		console.log('Scraped', count, 'mods on Modrinth for', name, ": " + (!found && bestMatch.similarity < similarityThreshold ? 'No match found' : 'Match found'));

		// If no mod was found, return a 404 error
		if (!found && bestMatch.similarity < similarityThreshold) {
			res.status(404).json({ error: 'Mod not found.' });
			return;
		}

		// Send the scraped mod data as a JSON response
		res.json(bestMatch);

	} catch (error) {
		console.error('Error occurred while scraping:', error);
		res.status(500).json({ error: 'Failed to scrape mods.' });
	}
});

app.listen(port, () => {
	console.log('Server is running on http://localhost:' + port);
});