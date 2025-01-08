import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { distance as levenshtein } from 'fastest-levenshtein';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';

const app = express();
const port = process.env.PORT || 3000;

const loaders = ['fabric', 'forge', 'neoforge', 'quilt'];
// const curseforgeLoaderIDs = [4, 1, 6, 5]; // mapping of loader names to CurseForge loader IDs
const loaderParenthesisRegex = new RegExp(`\\(.*?(${loaders.join('|')}).*?\\)|\\[.*?(${loaders.join('|')}).*?\\]`, 'gi');
const loaderEndRegex = new RegExp(`\\s*(-|:)?\\s*(${loaders.join('|')})(/\\s*(${loaders.join('|')}))*\\s*$`, 'i');
const specialWords = ['&', '|', 'and', 'or', '/', '-', ' '];

const requestsToAbort = ['image', 'stylesheet', 'font'];
let browser: Browser | null = null;
let browserStartTime = Date.now();

// Initialize a single Puppeteer browser instance
async function startBrowser() {
	if (!browser || !browser.connected || (Date.now() - browserStartTime) > 3600000) { // Restart every hour
		if (browser) {
			console.log('Closing old browser instance...');
			await browser.close();
		}
		console.log('Launching a new browser instance...');
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
			waitForInitialPage: false
		});
		browserStartTime = Date.now();
	}
	return browser;
}

const cleanModName = (modName: string): string => {
	// normalize mod name (lowercase, trim, and remove extra spaces)
	let cleanedModName = modName.toLowerCase().trim().replace(/\s+/g, ' ');

	// remove loaders mentioned inside parentheses or square brackets
	cleanedModName = cleanedModName.replace(loaderParenthesisRegex, '').trim();

	// remove trailing loaders and special words
	while (cleanedModName.length > 0) {
		// find and remove trailing loaders
		const match = cleanedModName.match(loaderEndRegex);
		if (match) {
			cleanedModName = cleanedModName.slice(0, match.index).trim();
			continue;
		}
		// find and remove trailing special words
		let isSpecial = false;
		for (let word of specialWords) {
			if (cleanedModName.endsWith(word)) {
				cleanedModName = cleanedModName.slice(0, cleanedModName.length - word.length).trim();
				isSpecial = true;
				break;
			}
		}
		// if no special words were found, stop
		if (!isSpecial) {
			break;
		}
	}
	return cleanedModName;
};

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
	const name = (req.query.name as string)?.toLowerCase().trim();
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
		const response = await axios.get('https://modrinth.com/mods', {
			params: {
				q: name,
				v: version,
				g: "categories:" + loader
			}
		}).catch((error) => {
			// if 429 error, return a 429 error
			if (error.response.status === 429) {
				res.status(429).json({ error: 'Too many requests. Please try again later.' });
				return;
			}
		});
		if (!response) return;

		// Load the HTML into Cheerio for parsing
		const $ = cheerio.load(response.data);

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
			const title = $(element).find('.title > a').text();
			const link = 'https://modrinth.com' + $(element).find('.title > a').attr('href');
			const image = $(element).find('img').attr('src') || '';

			// if name matches exactly, return the mod details
			console.log('comparing', title.toLowerCase().trim(), 'to', name);
			if (title.toLowerCase().trim() === name) {
				bestMatch = { title, link, image, similarity: 1 };
				found = true;
				return;
			}
			// clean the mod name and the target name for better comparison
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

// API endpoint to download the latest version of a mod from Modrinth given the mod url, version, and loader
app.get('/api/mod/modrinth/download', async (req, res) => {
	const url = req.query.url as string;
	const version = req.query.version as string;
	const loader = req.query.loader as string;
	if (!url) {
		res.status(400).json({ error: 'Missing required parameter `url`.' });
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
		const versionsUrl = `${url}/versions?g=${version}&l=${loader}`;

		const browser = await startBrowser();
		const page = await browser!.newPage();
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			if (requestsToAbort.includes(request.resourceType())) {
				request.abort();
			} else {
				request.continue();
			}
		});
		await page.goto(versionsUrl, { waitUntil: 'load' });

		// Get the HTML content of the page
		const html = await page.content();
		await page.close();

		const $ = cheerio.load(html);

		console.log('Scraped mod page:', versionsUrl);

		// Find the first download link
		const downloadLink = $('.group-hover\\:\\!bg-brand').first().attr('href');

		console.log('Download link:', downloadLink);

		// Send the download link as a JSON response
		res.json({ downloadLink });
	} catch (error) {
		console.error('Error occurred while downloading:', error);
		res.status(500).json({ error: 'Failed to download mod.' });
	}
});

app.get('/api/mod/curseforge', async (req, res) => {
	// send error response saying curseforge is not supported as it disallows web scraping using cloudflare and captcha
	res.status(501).json({ error: 'CurseForge is not supported, as it blocks web scraping using Cloudflare and CAPTCHA.' });

	// const name = (req.query.name as string)?.toLowerCase().trim();
	// const version = req.query.version as string;
	// const loader = req.query.loader as string;
	// if (!name) {
	// 	res.status(400).json({ error: 'Missing required parameter `name`.' });
	// 	return;
	// }
	// if (!version) {
	// 	res.status(400).json({ error: 'Missing required parameter `version`.' });
	// 	return;
	// }
	// if (!loader) {
	// 	res.status(400).json({ error: 'Missing required parameter `loader`.' });
	// 	return;
	// }
	// if (!loaders.includes(loader)) {
	// 	res.status(400).json({ error: 'Invalid loader.' });
	// 	return;
	// }
	// try {
	// 	// Make an HTTP GET request to the CurseForge mods page with the provided name as a query parameter (search), and the version as a query parameter (gameVersion), and the loader as a query parameter (loader)
	// 	const { data } = await axios.get('https://www.curseforge.com/minecraft/search', {
	// 		params: {
	// 			page: 1,
	// 			pageSize: 20,
	// 			sortBy: 'relevancy',
	// 			search: name,
	// 			version: version,
	// 			gameVersionTypeId: curseforgeLoaderIDs[loaders.indexOf(loader)]
	// 		}
	// 	});

	// 	// Load the HTML into Cheerio for parsing
	// 	const $ = cheerio.load(data);

	// 	// Array to store the scraped mod details
	// 	let bestMatch = { title: '', link: '', image: '', similarity: 0 };
	// 	let found = false;
	// 	let count = 0;
	// 	const similarityThreshold = 0.5;

	// 	// find the mod whose title best matches the provided name (the name doesn't have to match exactly)
	// 	$('.project-card').each((index, element) => {
	// 		if (found) return;
	// 		count++;

	// 		// Extract the mod title, link, and image
	// 		const title = $(element).find('.name span').text().toLowerCase().trim();
	// 		const link = 'https://www.curseforge.com' + $(element).find('a.overlay-link').attr('href');
	// 		const image = $(element).find('img').attr('src') || '';

	// 		// if name matches exactly, return the mod details
	// 		console.log('comparing', title, 'to', name);
	// 		if (title === name) {
	// 			bestMatch = { title, link, image, similarity: 1 };
	// 			found = true;
	// 			return;
	// 		}
	// 		// clean the mod name and the target name for better comparison
	// 		let cleanedModName = cleanModName(title);
	// 		let cleanedTarget = cleanModName(name);
	// 		console.log('After cleaning:', cleanedModName, 'vs', cleanedTarget);
	// 		if (cleanedModName === cleanedTarget) {
	// 			bestMatch = { title, link, image, similarity: 1 };
	// 			found = true;
	// 			return;
	// 		}
	// 		// calculate similarity between the mod title and the provided name using levenshtein distance (fuzzy matching)
	// 		let similarity = (1 - (levenshtein(cleanedTarget, cleanedModName) / Math.max(cleanedTarget.length, cleanedModName.length)));
	// 		// change similarity based on position (earlier is better)
	// 		similarity *= Math.pow(0.9, index);
	// 		if (similarity > similarityThreshold && similarity > bestMatch.similarity) {
	// 			bestMatch = { title, link, image, similarity };
	// 		}
	// 	}
	// 	);
	// 	console.log('Scraped', count, 'mods on CurseForge for', name, ": " + (!found && bestMatch.similarity < similarityThreshold ? 'No match found' : 'Match found'));

	// 	// If no mod was found, return a 404 error
	// 	if (!found && bestMatch.similarity < similarityThreshold) {
	// 		res.status(404).json({ error: 'Mod not found.' });
	// 		return;
	// 	}
});

app.listen(port, () => {
	console.log('Server is running on http://localhost:' + port);
});

process.on('SIGINT', async () => {
	console.log('Shutting down server...');
	if (browser) {
		await browser.close();
	}
	process.exit(0);
});