"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
// serve the frontend
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'frontend', 'dist')));
app.get('/', (req, res) => {
    // display the frontend
    res.sendFile(path_1.default.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});
app.get('/api', (req, res) => {
    res.send('Hello World!');
});
app.listen(port, () => {
    console.log('Server is running on http://localhost:3000');
});
