import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { distance as levenshtein } from 'fastest-levenshtein';
import path from 'path';
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { connect } from 'puppeteer-real-browser'
import { Browser } from 'puppeteer';

//puppeteer.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

const loaders = ['fabric', 'forge', 'neoforge', 'quilt'];
// const curseforgeLoaderIDs = [4, 1, 6, 5]; // mapping of loader names to CurseForge loader IDs
const loaderParenthesisRegex = new RegExp(`\\(.*?(${loaders.join('|')}).*?\\)|\\[.*?(${loaders.join('|')}).*?\\]`, 'gi');
const loaderEndRegex = new RegExp(`\\s*(-|:)?\\s*(${loaders.join('|')})(/\\s*(${loaders.join('|')}))*\\s*$`, 'i');
const specialWords = ['&', '|', 'and', 'or', '/', '-', ' '];

const requestsToAbort = ['image', 'stylesheet', 'font', 'media', 'texttrack', 'eventsource', 'websocket', 'manifest', 'other'];
const requestUrlToAbort = ['polling', 'analytics', 'beacon', 'ping', 'ws', 'cloudflare', 'flare', 'cloudfront', 'geoip', 'prebid', 'challenge', 'turnstile', 'captcha', 'tracking', 'telemetry'];
import { ConnectResult } from 'puppeteer-real-browser';

let browser: ConnectResult | null = null;
let browserStartTime = Date.now();

// Queue to hold pending requests
let requestQueue: (() => void)[] = [];
let lastRequestTime: number = 0;

// Middleware for rate throttling
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const delay = Math.max(2000 - timeSinceLastRequest, 0); // 2000 ms = 2 seconds

  // Function to process the request after the delay
  const processRequest = () => {
    lastRequestTime = Date.now();
    next();
  };

  // If delay is 0 (no need to wait), process the request immediately
  if (delay === 0) {
    processRequest();
  } else {
    // Otherwise, push the request into the queue and delay its processing
    requestQueue.push(() => {
      setTimeout(() => {
        processRequest();
        // After processing the request, process the next one in the queue (if any)
        if (requestQueue.length > 0) {
          const nextInQueue = requestQueue.shift();
          if (nextInQueue) nextInQueue();
        }
      }, delay);
    });

    // If it's the first item in the queue, process it
    if (requestQueue.length === 1) {
      const firstInQueue = requestQueue.shift();
      if (firstInQueue) firstInQueue();
    }
  }
};

// Apply the rateLimiter middleware to all routes
app.use(rateLimiter);

// Initialize a single Puppeteer browser instance
async function startBrowser() {
	if (!browser || !browser.browser || !browser.browser.connected || (Date.now() - browserStartTime) > 3600000) { // Restart every hour
		if (browser) {
			console.log('Closing old browser instance...');
			await browser.browser.close();
		}
		console.log('Launching a new browser instance...');
		// browser = await puppeteer.launch({
		// 	headless: true,
		// 	args: ['--no-sandbox', '--disable-setuid-sandbox']
		// });
		browser = await connect({

			headless: false,

			args: [],

			customConfig: {},

			turnstile: true,

			connectOption: {},

			disableXvfb: false,
			ignoreAllFlags: false
			// proxy:{
			//     host:'<proxy-host>',
			//     port:'<proxy-port>',
			//     username:'<proxy-username>',
			//     password:'<proxy-password>'
			// }

		})
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
				console.error('Too many requests. Please try again later.');
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
		const versionsUrl = `${decodeURIComponent(url)}/versions?g=${version}&l=${loader}`;

		// const response = await axios.get(versionsUrl).catch((error) => {
		// 	// if 429 error, return a 429 error
		// 	if (error.response.status === 429) {
		// 		console.error('Too many requests. Please try again later.');
		// 		res.status(429).json({ error: 'Too many requests. Please try again later.' });
		// 		return;
		// 	}
		// });
		// if (!response) return;

		// const $ = cheerio.load(response.data);

		// $('div.versions-grid-row.group').each((index, element) => {
		// 	// find the first one that has a nested child with the version number as inner text and another nested child with the loader name as inner text
		// 	const versionElement = $(element).find('div.versions-grid-item').first();
		// }

		const browser = await startBrowser();
		const page = await browser.browser.newPage();
		page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
		page.setViewport({ width: 1920, height: 1080 });
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const url = request.url();
			if (requestsToAbort.includes(request.resourceType()) || requestUrlToAbort.some((urlToAbort) => url.includes(urlToAbort))) {
				request.abort();
			} else {
				request.continue();
			}
		});

		console.log('Scraped mod page:', versionsUrl);

		const success = await page.goto(versionsUrl, { waitUntil: 'networkidle2', timeout: 60000 }).catch(async (error) => {
			// if timeout error, return a 504 error
			await page.screenshot({ path: `tmp/${url.replace(/[^a-z0-9]/gi, '_')}.png` });
			if (error.name === 'TimeoutError') {
				console.error('Request timed out.');
				res.status(504).json({ error: 'Request timed out.' });
				return;
			}
		});
		if (!success) return;

		await page.screenshot({ path: `tmp/${url.replace(/[^a-z0-9]/gi, '_')}.png` });

		// Get the HTML content of the page
		const html = await page.content();

		const $ = cheerio.load(html);

		// Find the first download link
		const downloadLink = $('.group-hover\\:\\!bg-brand').first().attr('href');

		if (!downloadLink) {
			// if cloudflare captcha is detected, return a 403 error (absence of 'Downloads' in the HTML)
			if (!html.includes('Downloads')) {
				console.error('Cloudflare captcha detected.');
				res.status(403).json({ error: 'Cloudflare captcha detected.' });
				return;
			}

			console.error('Download link not found.');
			res.status(404).json({ error: 'Download link not found.' });
			return;
		}

		await page.close();

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
		await browser.browser.close();
	}
	process.exit(0);
});