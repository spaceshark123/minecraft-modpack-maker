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
		response = await server.get('/api/file').query({ url: 'https://file-examples.com/storage/fe75a92b1367e14f59b6db4/2017/02/file_example_JSON_1kb.json' });
	});

	it('should return 200 OK', async () => {
		expect(response.status).toBe(200);
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