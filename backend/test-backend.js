// backend/test-backend.js
const express = require('express');
const app = express();

app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

app.listen(3001, () => {
    console.log('✅ Test server running on http://localhost:3001');
    console.log('Press Ctrl+C to stop');
});