import { Request, Response, NextFunction } from 'express';

// Queue to hold pending requests
let requestQueue: (() => void)[] = [];
let lastRequestTime: number = 0;

// Middleware for rate throttling (if a request is made within the delay, it will be delayed until the delay is over)
const rateLimiter = (delayMs: number) => {
	console.log(`Rate limiting requests to 1 every ${delayMs}ms`);

	const rateLimit = delayMs;
	return (req: Request, res: Response, next: NextFunction) => {
		const now = Date.now();
		const timeSinceLastRequest = now - lastRequestTime;
		const delay = Math.max(rateLimit - timeSinceLastRequest, 0); // Calculate the delay needed

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

			console.log(`Delaying request to ${req.path} by ${delay}ms`);

			// If it's the first item in the queue, process it
			if (requestQueue.length === 1) {
				const firstInQueue = requestQueue.shift();
				if (firstInQueue) firstInQueue();
			}
		}
	}
};

export default rateLimiter;