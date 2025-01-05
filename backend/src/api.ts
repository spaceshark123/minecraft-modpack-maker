import express from 'express';
const cors = require('cors');

const app = express();

app.use(cors());

app.get('/', (req, res) => {
	// enable cors
	res.header('Access-Control-Allow-Origin', '*');

	res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});