import app from '../../src/api'
import request from 'supertest';

let server: any;

beforeAll(async () => {
	server = request(app); // initialize the test server
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