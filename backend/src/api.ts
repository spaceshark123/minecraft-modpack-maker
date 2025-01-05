import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

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

app.listen(port, () => {
	console.log('Server is running on http://localhost:3000');
});