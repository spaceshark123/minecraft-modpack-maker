import app from '../../src/api'
import request from 'supertest';

let server: any;
let originalConsole: any;

beforeAll(async () => {
	server = request(app); // initialize the test server

	// mute console logs while testing
	originalConsole = { ...console };
	global.console = {
		...console,
		log: jest.fn(),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};
});

afterAll(async () => {
	// restore console logs after testing
	global.console = originalConsole;
});

describe('GET /api', () => {
	let response: Response;

	beforeAll(async () => {
		response = await server.get('/api');
	});

	it('should return 200 OK', async () => {
		expect(response.status).toBe(200);
	});
		
	it('should return "Hello World!"', async () => {
		expect(response.text).toBe('Hello World!');
	});
});

describe('GET /api/file', () => {
	let response: Response;

	beforeAll(async () => {
		response = await server.get('/api/file').query({ url: 'https://file-examples.com/wp-content/storage/2017/02/file_example_CSV_5000.csv' });
	});

	it('should return 200 OK', async () => {
		expect(response.status).toBe(200);
	});
});

describe('GET /api/versions', () => {
	let response: Response;
	let responseBody: any; // Declare responseBody here

	beforeAll(async () => {
		response = await server.get('/api/versions');
		responseBody = response.body as { count?: number; versions?: string[] }; // Access the parsed JSON directly
	});

	it('should return 200 OK', async () => {
		expect(response.status).toBe(200);
	});

	it('should return a count of versions', async () => {
		expect(responseBody).toHaveProperty('count');
		expect(responseBody.count).toBeGreaterThan(0);
	});

	it('should return a list of versions', async () => {
		expect(responseBody).toHaveProperty('versions');
		expect(responseBody.versions).toBeInstanceOf(Array);
		expect(responseBody.versions.length).toBeGreaterThan(0);
		expect(responseBody.count).toBe(responseBody.versions.length);
		expect(responseBody.versions).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/^\d+\.\d+\.\d+$/) // Check if all versions are in the format x.x.x
			])
		);
	});
});

describe('GET /api/mod/modrinth', () => {
	let response: Response;

	it('successfully fetches mod data from Modrinth', async () => {
		response = await server.get('/api/mod/modrinth').query({
			name: 'fabric api',
			version: '1.20.1',
			loader: 'fabric'
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('title', 'Fabric API');
		expect(response.body).toHaveProperty('slug', 'fabric-api');
		expect(response.body).toHaveProperty('id', 'P7dR8mSH');
		expect(response.body).toHaveProperty('image');
		expect(response.body).toHaveProperty('similarity',1);
	});

	it('returns 404 for invalid mod', async () => {
		response = await server.get('/api/mod/modrinth').query({
			name: 'lorem ipsum',
			version: '1.0.0',
			loader: 'fabric'
		});

		expect(response.status).toBe(404);
	});

	it('returns 400 for missing parameters', async () => {
		response = await server.get('/api/mod/modrinth');

		expect(response.status).toBe(400);
	});

	it('fuzzy searches for similar mods', async () => {
		response = await server.get('/api/mod/modrinth').query({
			name: 'fabric a',
			version: '1.20.1',
			loader: 'fabric'
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('title', 'Fabric API');
		expect(response.body).toHaveProperty('slug', 'fabric-api');
		expect(response.body).toHaveProperty('id', 'P7dR8mSH');
		expect(response.body).toHaveProperty('image');
		expect(response.body).toHaveProperty('similarity', 0.7200000000000001);
	});
});

describe('GET /api/mod/modrinth/download', () => {
	let response: Response;

	it('successfully fetches mod download URL from Modrinth', async () => {
		response = await server.get('/api/mod/modrinth/download').query({
			slug: 'fabric-api',
			version: '1.20.1',
			loader: 'fabric'
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('url');
		expect(response.body).toHaveProperty('filename');
		expect(response.body).toHaveProperty('url', expect.stringContaining('https://cdn.modrinth.com/data/P7dR8mSH/versions/'));
	});

	it('returns 400 for missing parameters', async () => {
		response = await server.get('/api/mod/modrinth/download');

		expect(response.status).toBe(400);
	});
});

describe('GET /api/mod/curseforge', () => {
	let response: Response;

	it('successfully fetches mod data from CurseForge', async () => {
		response = await server.get('/api/mod/curseforge').query({
			name: 'fabric api',
			version: '1.20.1',
			loader: 'fabric'
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('title', 'Fabric API');
		expect(response.body).toHaveProperty('slug', 'fabric-api');
		expect(response.body).toHaveProperty('id', "306612");
		expect(response.body).toHaveProperty('image');
		expect(response.body).toHaveProperty('similarity', 1);
	});

	it('returns 404 for invalid mod', async () => {
		response = await server.get('/api/mod/curseforge').query({
			name: 'lorem ipsum',
			version: '1.0.0',
			loader: 'fabric'
		});

		expect(response.status).toBe(404);
	});

	it('returns 400 for missing parameters', async () => {
		response = await server.get('/api/mod/curseforge');

		expect(response.status).toBe(400);
	});

	it('fuzzy searches for similar mods', async () => {
		response = await server.get('/api/mod/curseforge').query({
			name: 'fabric ap',
			version: '1.20.1',
			loader: 'fabric'
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('title', 'Fabric API');
		expect(response.body).toHaveProperty('slug', 'fabric-api');
		expect(response.body).toHaveProperty('id', "306612");
		expect(response.body).toHaveProperty('image');
		expect(response.body).toHaveProperty('similarity', 0.531441);
	});
});

describe('GET /api/mod/curseforge/download', () => {
	let response: Response;

	it('successfully fetches mod download URL from CurseForge', async () => {
		response = await server.get('/api/mod/curseforge/download').query({
			id: '306612', // Fabric API ID
			version: '1.20.1',
			loader: 'fabric'
		});

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('url');
		expect(response.body).toHaveProperty('filename');
		expect(response.body).toHaveProperty('url', expect.stringContaining('https://edge.forgecdn.net/files/'));
	});

	it('returns 400 for missing parameters', async () => {
		response = await server.get('/api/mod/curseforge/download');

		expect(response.status).toBe(400);
	});
});