import rateLimiter from "../../src/ratelimiter";

// test rate limiter using jest
describe('Rate Limiter', () => {
	let mockNext: jest.Mock;
	let mockRequest: any;
	let mockResponse: any;

	beforeEach(() => {
		mockNext = jest.fn();
		mockRequest = { path: '/test' };
		mockResponse = {};
	});

	it('should process the request immediately if outside the rate limit', () => {
		const delayMs = 1000;
		const rateLimitMiddleware = rateLimiter(delayMs);

		jest.useFakeTimers();

		rateLimitMiddleware(mockRequest, mockResponse, mockNext);
		expect(mockNext).toHaveBeenCalled();
		
		jest.useRealTimers();
	});

	it('should delay the request if within the rate limit', () => {
		const delayMs = 1000;
		const rateLimitMiddleware = rateLimiter(delayMs);

		jest.useFakeTimers();

		jest.advanceTimersByTime(delayMs); // Fast forward time to simulate the delay

		rateLimitMiddleware(mockRequest, mockResponse, mockNext); // Call first time to set the lastRequestTime
		expect(mockNext).toHaveBeenCalled();

		rateLimitMiddleware(mockRequest, mockResponse, mockNext); // Call again to test the delay
		expect(mockNext).toHaveBeenCalledTimes(1); // Should not be called yet

		jest.advanceTimersByTime(delayMs); // Fast forward time

		expect(mockNext).toHaveBeenCalledTimes(2); // 2nd request should be called now
		
		jest.useRealTimers();
	});
});