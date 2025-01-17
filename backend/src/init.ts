import app from './api';

const port = process.env.PORT || 3000;

app.listen(port, () => {
	// initialize the server
	console.log('Server is running on http://localhost:' + port);
});

process.on('SIGINT', async () => {
	console.log('Shutting down server...');
	process.exit(0);
});