import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { distance as levenshtein } from 'fastest-levenshtein';
import path from 'path';
import rateLimiter from './ratelimiter';
import dotenv from 'dotenv';

dotenv.config(); // load environment variables from .env file

const app = express();
const curseforgeAPIKey = process.env.CURSEFORGE_API_KEY;

// use unique user agent to avoid being blocked
const userAgent = 'spaceshark123/minecraft-modpack-maker/1.0.0 (nyancot121@gmail.com)';

const loaders = ['fabric', 'forge', 'neoforge', 'quilt'];
const curseforgeLoaderIDs = [4, 1, 6, 5]; // mapping of loader names to CurseForge loader IDs
const loaderParenthesisRegex = new RegExp(`\\(.*?(${loaders.join('|')}).*?\\)|\\[.*?(${loaders.join('|')}).*?\\]`, 'gi');
const loaderEndRegex = new RegExp(`\\s*(-|:)?\\s*(${loaders.join('|')})(/\\s*(${loaders.join('|')}))*\\s*$`, 'i');
const specialWords = ['&', '|', 'and', 'or', '/', '-', ' '];

interface ModrinthSearchResponse {
	hits: ModrinthMod[];
	offset: number;
	limit: number;
	total_hits: number;
}

interface ModrinthVersionsResponse {
	files: ModrinthFile[];
}

interface ModrinthFile {
	url: string;
	filename: string;
	primary: boolean;
}

interface ModrinthMod {
	slug: string;
	title: string;
	project_id: string;
	description: string;
	categories: string[];
	client_side: string;
	server_side: string;
	versions: string[];
	downloads: number;
	icon_url: string;
	latest_version: string;
	license: string;
	url: string;
	featured: boolean;
}

interface CurseforgeSearchResponse {
	data: CurseforgeMod[];
}

interface CurseforgeVersionsResponse {
	data: CurseforgeFile[];
}

interface CurseforgeFile {
	fileName: string;
	downloadUrl: string;
	isAvailable: boolean;
}

interface CurseforgeMod {
	id: number;
	name: string;
	slug: string;
	logo: {
		url: string;
	}
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

const apiRouter = express.Router();

const modrinthRouter = express.Router();
modrinthRouter.use(rateLimiter(200)); // rate limit to at most 1 request every 200ms
const curseforgeRouter = express.Router();
curseforgeRouter.use(rateLimiter(200)); // rate limit to at most 1 request every 200ms

app.use('/api', apiRouter);
apiRouter.use('/mod/modrinth', modrinthRouter);
apiRouter.use('/mod/curseforge', curseforgeRouter);
app.use(cors()); // enable CORS

// serve the frontend
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

app.get('/', (req, res) => {
	// display the frontend
	res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

apiRouter.get('/', (req, res) => {
	res.send('Hello World!');
});

// API endpoint to download a file from a given URL (to avoid CORS issues)
apiRouter.get('/file', async (req, res) => {
	const url = req.query.url as string;
	if (!url) {
		res.status(400).json({ error: 'Missing required parameter `url`.' });
		return;
	}
	try {
        // Fetch the file from the external URL using axios
        const response = await axios.get(url, {
            responseType: 'stream', // This is important for handling binary data as a stream
        });

        // Set headers for the file download, including content type and file name
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Disposition', `attachment`);

        // Pipe the response data directly to the client
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching the file:', error);
        res.status(500).send('Error downloading file.');
    }
});

// API endpoint to scrape Modrinth for a mod with the provided name
modrinthRouter.get('/', async (req, res) => {
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
		// Make an HTTP GET request to the Modrinth search API with the provided name as a query parameter (query)
		const response = await axios.get<ModrinthSearchResponse>('https://api.modrinth.com/v2/search', {
			headers: {
				'User-Agent': userAgent
			},
			params: {
				query: name,
				facets: `[["categories:${loader}"],["versions:${version}"],["project_type:mod"]]`
			}
		}).then((res) => {
			return res.data;
		}).catch((error) => {
			// if 429 error, return a 429 error
			if (error.response.status === 429) {
				console.error('Too many requests. Please try again later.');
				res.status(429).json({ error: 'Too many requests. Please try again later.' });
				return;
			}
		});
		if (!response) return;

		// Array to store the scraped mod details
		let bestMatch = { title: '', slug: '', id: '', image: '', similarity: 0 };
		let found = false;
		let count = 0;
		const similarityThreshold = 0.5;

		// find the mod whose title best matches the provided name (the name doesn't have to match exactly)
		response.hits.forEach((element, index) => {
			if (found) return;
			count++;

			// Extract the mod title, slug, and image
			const title = element.title;
			const slug = element.slug; // slug is the unique identifier for the mod
			const id = element.project_id;
			const image = element.icon_url;

			// if name matches exactly, return the mod details
			console.log('comparing', title.toLowerCase().trim(), 'to', name);
			if (title.toLowerCase().trim() === name) {
				bestMatch = { title, slug, id, image, similarity: 1 };
				found = true;
				return;
			}
			// clean the mod name and the target name for better comparison
			let cleanedModName = cleanModName(title);
			let cleanedTarget = cleanModName(name);
			console.log('After cleaning:', cleanedModName, 'vs', cleanedTarget);
			if (cleanedModName === cleanedTarget) {
				bestMatch = { title, slug, id, image, similarity: 1 };
				found = true;
				return;
			}
			// calculate similarity between the mod title and the provided name using levenshtein distance (fuzzy matching)
			let similarity = (1 - (levenshtein(cleanedTarget, cleanedModName) / Math.max(cleanedTarget.length, cleanedModName.length)));
			// change similarity based on position (earlier is better)
			similarity *= Math.pow(0.9, index);
			if (similarity > similarityThreshold && similarity > bestMatch.similarity) {
				bestMatch = { title, slug, id, image, similarity };
			} else if (cleanedModName.replace(/\s+/g, '') === cleanedTarget.replace(/\s+/g, '')) {
				// they match without spaces, so we can consider them equal, but not exact
				similarity = 0.9;
				found = true;
				bestMatch = { title, slug, id, image, similarity };
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
modrinthRouter.get('/download', async (req, res) => {
	const slug = req.query.slug as string;
	const version = req.query.version as string;
	const loader = req.query.loader as string;
	if (!slug) {
		res.status(400).json({ error: 'Missing required parameter `slug`.' });
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
		// Make an HTTP GET request to the Modrinth API to get the versions of the mod
		const response = await axios.get<ModrinthVersionsResponse[]>(`https://api.modrinth.com/v2/project/${slug}/version`, {
			headers: {
				'User-Agent': userAgent
			},
			params: {
				loaders: `["${loader}"]`,
				game_versions: `["${version}"]`
			}
		}).then((res) => {
			return res.data;
		}).catch((error) => {
			// if 429 error, return a 429 error
			if (error.response.status === 429) {
				console.error('Too many requests. Please try again later.');
				res.status(429).json({ error: 'Too many requests. Please try again later.' });
				return;
			}
		});
		if (!response) return;

		console.log('Found', response[0].files.length, `files for mod ${slug} version ${version} loader ${loader}`);

		// find the primary file for the latest release of the mod for the specified loader and game version
		const file = response[0].files.find((file) => file.primary) || response[0].files[0];
		res.json({ url: file.url, filename: file.filename });
	} catch (error) {
		console.error('Error occurred while downloading:', error);
		res.status(500).json({ error: 'Failed to download mod.' });
	}
});

// API endpoint to scrape Curseforge for a mod with the provided name
curseforgeRouter.get('/', async (req, res) => {
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
		// Make an HTTP GET request to the Curseforge search API with the provided name as a query parameter (query)
		const response = await axios.get<CurseforgeSearchResponse>('https://api.curseforge.com/v1/mods/search', {
			headers: {
				'x-api-key': curseforgeAPIKey
			},
			params: {
				classId: 6, // mod
				gameVersion: version,
				modLoaderType: curseforgeLoaderIDs[loaders.indexOf(loader)],
				sortField: 2, // popularity
				sortOrder: 'desc',
				pageSize: 20,
				searchFilter: name,
				gameId: 432, // minecraft
				index: 0 // start from the first page
			}
		}).then((res) => {
			return res.data;
		}).catch((error) => {
			// if 429 error, return a 429 error
			if (error.response.status === 429) {
				console.error('Too many requests. Please try again later.');
				res.status(429).json({ error: 'Too many requests. Please try again later.' });
				return;
			}
		});
		if (!response) return;

		// Array to store the scraped mod details
		let bestMatch = { title: '', slug: '', id: '', image: '', similarity: 0 };
		let found = false;
		let count = 0;
		const similarityThreshold = 0.5;

		// find the mod whose title best matches the provided name (the name doesn't have to match exactly)
		response.data.forEach((element, index) => {
			if (found) return;
			count++;

			// Extract the mod title, slug, and image
			const title = element.name;
			const slug = element.slug; // slug is the unique identifier for the mod
			const id = String(element.id);
			const image = element.logo.url;

			// if name matches exactly, return the mod details
			console.log('comparing', title.toLowerCase().trim(), 'to', name);
			if (title.toLowerCase().trim() === name) {
				bestMatch = { title, slug, id, image, similarity: 1 };
				found = true;
				return;
			}
			// clean the mod name and the target name for better comparison
			let cleanedModName = cleanModName(title);
			let cleanedTarget = cleanModName(name);
			console.log('After cleaning:', cleanedModName, 'vs', cleanedTarget);
			if (cleanedModName === cleanedTarget) {
				bestMatch = { title, slug, id, image, similarity: 1 };
				found = true;
				return;
			}
			// calculate similarity between the mod title and the provided name using levenshtein distance (fuzzy matching)
			let similarity = (1 - (levenshtein(cleanedTarget, cleanedModName) / Math.max(cleanedTarget.length, cleanedModName.length)));
			// change similarity based on position (earlier is better)
			similarity *= Math.pow(0.9, index);
			if (similarity > similarityThreshold && similarity > bestMatch.similarity) {
				bestMatch = { title, slug, id, image, similarity };
			} else if (cleanedModName.replace(/\s+/g, '') === cleanedTarget.replace(/\s+/g, '')) {
				// they match without spaces, so we can consider them equal, but not exact
				similarity = 0.9;
				found = true;
				bestMatch = { title, slug, id, image, similarity };
			}
		});
		console.log('Scraped', count, 'mods on Curseforge for', name, ": " + (!found && bestMatch.similarity < similarityThreshold ? 'No match found' : 'Match found'));

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

// API endpoint to download the latest version of a mod from Curseforge given the mod url, version, and loader
curseforgeRouter.get('/download', async (req, res) => {
	const id = req.query.id as string;
	const version = req.query.version as string;
	const loader = req.query.loader as string;
	if (!id) {
		res.status(400).json({ error: 'Missing required parameter `id`.' });
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
		// Make an HTTP GET request to the Modrinth API to get the versions of the mod
		const response = await axios.get<CurseforgeVersionsResponse>(`https://api.curseforge.com/v1/mods/${id}/files`, {
			headers: {
				'x-api-key': curseforgeAPIKey
			},
			params: {
				gameVersion: version,
				modLoaderType: curseforgeLoaderIDs[loaders.indexOf(loader)],
				pageSize: 1
			}
		}).then((res) => {
			return res.data;
		}).catch((error) => {
			// if 429 error, return a 429 error
			if (error.response.status === 429) {
				console.error('Too many requests. Please try again later.');
				res.status(429).json({ error: 'Too many requests. Please try again later.' });
				return;
			}
		});
		if (!response || response.data.length === 0) { 
			res.status(404).json({ error: 'No files found for mod.' });
			return;
		}
		if (!response.data[0].isAvailable) {
			res.status(404).json({ error: 'File not available for download.' });
			return;
		}

		console.log(`Found a file for mod ${id} version ${version} loader ${loader}`);

		// find the primary file for the latest release of the mod for the specified loader and game version
		const file = response.data[0];
		res.status(200).json({ url: file.downloadUrl, filename: file.fileName });
	} catch (error) {
		console.error('Error occurred while downloading:', error);
		res.status(500).json({ error: 'Failed to download mod.' });
	}
});

export default app;