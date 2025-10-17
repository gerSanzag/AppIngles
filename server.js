const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Data file paths
const DATA_FILES = {
    words: path.join(DATA_DIR, 'words.json'),
    learnedWords: path.join(DATA_DIR, 'learnedWords.json'),
    databases: path.join(DATA_DIR, 'databases.json'),
    gameStats: path.join(DATA_DIR, 'gameStats.json'),
    currentDatabase: path.join(DATA_DIR, 'currentDatabase.json')
};

// Helper function to read JSON file
function readJsonFile(filePath, defaultValue = null) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// API Routes

// Get all app data
app.get('/api/data', (req, res) => {
    const data = {
        words: readJsonFile(DATA_FILES.words, []),
        learnedWords: readJsonFile(DATA_FILES.learnedWords, []),
        databases: readJsonFile(DATA_FILES.databases, []),
        gameStats: readJsonFile(DATA_FILES.gameStats, {
            score: 0,
            correct: 0,
            incorrect: 0,
            streak: 0
        }),
        currentDatabase: readJsonFile(DATA_FILES.currentDatabase, '')
    };
    
    res.json(data);
});

// Save all app data
app.post('/api/data', (req, res) => {
    const { words, learnedWords, databases, gameStats, currentDatabase } = req.body;
    
    const results = {
        words: writeJsonFile(DATA_FILES.words, words || []),
        learnedWords: writeJsonFile(DATA_FILES.learnedWords, learnedWords || []),
        databases: writeJsonFile(DATA_FILES.databases, databases || []),
        gameStats: writeJsonFile(DATA_FILES.gameStats, gameStats || {}),
        currentDatabase: writeJsonFile(DATA_FILES.currentDatabase, currentDatabase || '')
    };
    
    const allSuccess = Object.values(results).every(result => result === true);
    
    if (allSuccess) {
        res.json({ success: true, message: 'Data saved successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Some data could not be saved' });
    }
});

// Save specific data type
app.post('/api/data/:type', (req, res) => {
    const { type } = req.params;
    const data = req.body;
    
    let filePath;
    switch (type) {
        case 'words':
            filePath = DATA_FILES.words;
            break;
        case 'learnedWords':
            filePath = DATA_FILES.learnedWords;
            break;
        case 'databases':
            filePath = DATA_FILES.databases;
            break;
        case 'gameStats':
            filePath = DATA_FILES.gameStats;
            break;
        case 'currentDatabase':
            filePath = DATA_FILES.currentDatabase;
            break;
        default:
            return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    
    const success = writeJsonFile(filePath, data);
    
    if (success) {
        res.json({ success: true, message: `${type} saved successfully` });
    } else {
        res.status(500).json({ success: false, message: `Failed to save ${type}` });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AppIngles server running at http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`💾 Data will be saved to: ${DATA_DIR}`);
});
