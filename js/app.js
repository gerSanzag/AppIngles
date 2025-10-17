// Main App Configuration
const App = {
    // App state
    currentModule: 'landing',
    words: [],
    learnedWords: [],
    databases: [],
    currentDatabase: '',
    gameStats: {
        score: 0,
        correct: 0,
        incorrect: 0,
        streak: 0
    },
    
    // API base URL
    apiBaseUrl: 'http://localhost:3000/api',
    
    // Initialize the app
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.setupAutoSave();
        this.updateUI();
    },
    
    // Load data from server
    async loadData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/data`);
            if (response.ok) {
                const data = await response.json();
                this.words = data.words || [];
                this.learnedWords = data.learnedWords || [];
                this.databases = data.databases || [];
                this.currentDatabase = data.currentDatabase || '';
                this.gameStats = { ...this.gameStats, ...(data.gameStats || {}) };
                
                // Ensure learned words database exists
                this.ensureLearnedWordsDatabase();
                
                // Clean up any existing duplicates
                this.removeDuplicateLearnedWords();
                
                console.log('✅ Data loaded from server successfully');
            } else {
                console.warn('⚠️ Could not load data from server, using defaults');
                this.initializeDefaults();
            }
        } catch (error) {
            console.error('❌ Error loading data from server:', error);
            this.initializeDefaults();
            this.showNotification('Could not connect to server. Using offline mode.', 'error');
        }
    },
    
    // Initialize default values
    initializeDefaults() {
        this.words = [];
        this.learnedWords = [];
        this.databases = [];
        this.currentDatabase = '';
        this.gameStats = {
            score: 0,
            correct: 0,
            incorrect: 0,
            streak: 0
        };
        
        // Create learned words database if it doesn't exist
        this.ensureLearnedWordsDatabase();
        
        // Clean up any existing duplicates
        this.removeDuplicateLearnedWords();
    },
    
    // Ensure learned words database exists
    ensureLearnedWordsDatabase() {
        const learnedWordsDB = this.databases.find(db => db.id === 'learned-words');
        if (!learnedWordsDB) {
            const learnedWordsDatabase = {
                id: 'learned-words',
                name: 'Learned Words',
                createdAt: new Date().toISOString(),
                isSystem: true // Mark as system database
            };
            this.databases.push(learnedWordsDatabase);
        }
    },
    
    // Remove duplicate learned words
    removeDuplicateLearnedWords() {
        const uniqueWords = [];
        const seenWords = new Set();
        
        for (const word of this.learnedWords) {
            const key = `${word.originalText.toLowerCase()}-${word.translatedText.toLowerCase()}`;
            if (!seenWords.has(key)) {
                seenWords.add(key);
                uniqueWords.push(word);
            }
        }
        
        if (uniqueWords.length !== this.learnedWords.length) {
            const removedCount = this.learnedWords.length - uniqueWords.length;
            this.learnedWords = uniqueWords;
            console.log(`🧹 Removed ${removedCount} duplicate learned words`);
        }
    },
    
    // Save data to server
    async saveData() {
        try {
            const dataToSave = {
                words: this.words,
                learnedWords: this.learnedWords,
                databases: this.databases,
                gameStats: this.gameStats,
                currentDatabase: this.currentDatabase
            };
            
            const response = await fetch(`${this.apiBaseUrl}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave)
            });
            
            if (response.ok) {
                console.log('✅ Data saved to server successfully');
                return true;
            } else {
                console.error('❌ Failed to save data to server');
                return false;
            }
        } catch (error) {
            console.error('❌ Error saving data to server:', error);
            return false;
        }
    },
    
    // Setup auto-save functionality
    setupAutoSave() {
        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
        
        // Auto-save on visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveData();
            }
        });
        
        // Auto-save on navigation
        const originalNavigateToModule = Navigation.navigateToModule;
        Navigation.navigateToModule = (moduleName) => {
            this.saveData(); // Save before navigation
            originalNavigateToModule(moduleName);
        };
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Manual word input
        const spanishWordInput = document.getElementById('spanish-word-input');
        const englishWordInput = document.getElementById('english-word-input');
        const addManualWordBtn = document.getElementById('add-manual-word-btn');
        
        if (addManualWordBtn) {
            addManualWordBtn.addEventListener('click', () => this.addManualWord());
        }
        
        // Enter key support for both inputs
        if (spanishWordInput) {
            spanishWordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addManualWord();
                }
            });
        }
        
        if (englishWordInput) {
            englishWordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addManualWord();
                }
            });
        }
        
        // Word list functionality
        const addListBtn = document.getElementById('add-list-btn');
        if (addListBtn) {
            addListBtn.addEventListener('click', () => this.addWordList());
        }
        
        const clearListBtn = document.getElementById('clear-list-btn');
        if (clearListBtn) {
            clearListBtn.addEventListener('click', () => this.clearWordList());
        }
        
        // File upload functionality
        const fileInput = document.getElementById('file-input');
        const fileSelectBtn = document.getElementById('file-select-btn');
        const fileNameSpan = document.getElementById('file-name');
        
        if (fileSelectBtn && fileInput) {
            fileSelectBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchWords(e.target.value));
        }
        
        // Database selection
        const databaseSelects = document.querySelectorAll('select[id*="database"]');
        databaseSelects.forEach(select => {
            select.addEventListener('change', (e) => this.changeDatabase(e.target.value));
        });
        
        // Database management buttons
        const createDBBtn = document.querySelector('.btn-create');
        const deleteDBBtn = document.querySelector('.btn-delete');
        
        if (createDBBtn) {
            createDBBtn.addEventListener('click', () => this.createDatabase());
        }
        
        if (deleteDBBtn) {
            deleteDBBtn.addEventListener('click', () => this.deleteDatabase());
        }
        
        // Game functionality
        const startGameBtn = document.querySelector('.start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => this.startGame());
        }
        
        
        // Delete all words functionality
        const deleteAllBtn = document.getElementById('delete-all-btn');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => this.deleteAllWords());
        }
        
    },
    
    
    // Add manual word (Spanish - English)
    async addManualWord() {
        const spanishInput = document.getElementById('spanish-word-input');
        const englishInput = document.getElementById('english-word-input');
        
        const spanish = spanishInput.value.trim();
        const english = englishInput.value.trim();
        
        if (!spanish || !english) {
            this.showNotification('Please enter both Spanish and English words', 'error');
            return;
        }
        
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        // Check if word pair already exists in current database
        const existingWord = this.words.find(w => 
            w.databaseId === this.currentDatabase &&
            ((w.originalText.toLowerCase() === english.toLowerCase() && 
              w.translatedText.toLowerCase() === spanish.toLowerCase()) ||
             (w.originalText.toLowerCase() === spanish.toLowerCase() && 
              w.translatedText.toLowerCase() === english.toLowerCase()))
        );
        
        if (existingWord) {
            this.showNotification('This word pair already exists in this database', 'info');
            return;
        }
        
        // Check if word pair already exists in learned words
        const existingLearnedWord = this.learnedWords.find(w => 
            (w.originalText.toLowerCase() === english.toLowerCase() && 
             w.translatedText.toLowerCase() === spanish.toLowerCase()) ||
            (w.originalText.toLowerCase() === spanish.toLowerCase() && 
             w.translatedText.toLowerCase() === english.toLowerCase())
        );
        
        if (existingLearnedWord) {
            this.showNotification('This word pair already exists in learned words', 'info');
            return;
        }
        
        // Add the word pair (English as original, Spanish as translation)
        const newWord = {
            id: Date.now() + Math.random(),
            originalText: english,
            translatedText: spanish,
            detectedLanguage: 'en',
            databaseId: this.currentDatabase,
            score: 0,
            attempts: 0,
            lastPracticed: null,
            createdAt: new Date().toISOString(),
            counter: 0  // Independent counter for each record
        };
        
        this.words.push(newWord);
        await this.saveData();
        this.updateUI();
        
        // Clear inputs
        spanishInput.value = '';
        englishInput.value = '';
        
        this.showNotification('Word pair added successfully!', 'success');
    },
    
    // Add word list (bulk import)
    async addWordList() {
        const wordListTextarea = document.getElementById('word-list');
        const wordListText = wordListTextarea.value.trim();
        
        if (!wordListText) {
            this.showNotification('Please enter word pairs in the list', 'error');
            return;
        }
        
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        // Split by lines and process each line
        const lines = wordListText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
            this.showNotification('No valid word pairs found', 'error');
            return;
        }
        
        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        this.showNotification(`Processing ${lines.length} word pairs...`, 'info');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Check if line contains the separator
            if (!trimmedLine.includes(' - ')) {
                errorCount++;
                continue;
            }
            
            // Split by separator
            const parts = trimmedLine.split(' - ');
            if (parts.length !== 2) {
                errorCount++;
                continue;
            }
            
            const spanish = parts[0].trim();
            const english = parts[1].trim();
            
            if (!spanish || !english) {
                errorCount++;
                continue;
            }
            
            // Check if word pair already exists in current database
            const existingWord = this.words.find(w => 
                w.databaseId === this.currentDatabase &&
                ((w.originalText.toLowerCase() === english.toLowerCase() && 
                  w.translatedText.toLowerCase() === spanish.toLowerCase()) ||
                 (w.originalText.toLowerCase() === spanish.toLowerCase() && 
                  w.translatedText.toLowerCase() === english.toLowerCase()))
            );
            
            if (existingWord) {
                skippedCount++;
                continue;
            }
            
            // Check if word pair already exists in learned words
            const existingLearnedWord = this.learnedWords.find(w => 
                (w.originalText.toLowerCase() === english.toLowerCase() && 
                 w.translatedText.toLowerCase() === spanish.toLowerCase()) ||
                (w.originalText.toLowerCase() === spanish.toLowerCase() && 
                 w.translatedText.toLowerCase() === english.toLowerCase())
            );
            
            if (existingLearnedWord) {
                skippedCount++;
                continue;
            }
            
            // Add the word pair
            const newWord = {
                id: Date.now() + Math.random() + Math.random(), // Extra randomness for bulk
                originalText: english,
                translatedText: spanish,
                detectedLanguage: 'en',
                databaseId: this.currentDatabase,
                score: 0,
                attempts: 0,
                lastPracticed: null,
                createdAt: new Date().toISOString(),
                counter: 0  // Independent counter for each record
            };
            
            this.words.push(newWord);
            addedCount++;
        }
        
        // Save data and update UI
        await this.saveData();
        this.updateUI();
        
        // Clear the textarea
        wordListTextarea.value = '';
        
        // Show results
        let message = `Word list processed! Added: ${addedCount}`;
        if (skippedCount > 0) message += `, Skipped: ${skippedCount}`;
        if (errorCount > 0) message += `, Errors: ${errorCount}`;
        
        this.showNotification(message, addedCount > 0 ? 'success' : 'info');
    },
    
    // Handle file selection and load content
    handleFileSelect(event) {
        const file = event.target.files[0];
        const fileNameSpan = document.getElementById('file-name');
        const wordListTextarea = document.getElementById('word-list');
        
        if (!file) {
            fileNameSpan.textContent = 'No file selected';
            fileNameSpan.classList.remove('has-file');
            return;
        }
        
        // Get file extension
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Check for unsupported file types first
        if (['pdf', 'doc', 'docx'].includes(fileExtension)) {
            this.showNotification(`❌ ${fileExtension.toUpperCase()} files cannot be read as text. Please copy the content to a .txt file first.`, 'error');
            fileNameSpan.textContent = `${fileExtension.toUpperCase()} not supported`;
            fileNameSpan.classList.remove('has-file');
            // Clear textarea
            wordListTextarea.value = '';
            // Reset file input
            event.target.value = '';
            return;
        }
        
        // Validate supported file types
        const supportedExtensions = ['txt', 'csv', 'md', 'rtf'];
        
        if (!supportedExtensions.includes(fileExtension)) {
            this.showNotification('Please select a supported file type (.txt, .csv, .md, .rtf)', 'error');
            fileNameSpan.textContent = 'Invalid file type';
            fileNameSpan.classList.remove('has-file');
            return;
        }
        
        // Update UI to show selected file
        fileNameSpan.textContent = file.name;
        fileNameSpan.classList.add('has-file');
        
        // Read file content
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                let content = e.target.result;
                
                // Clean content for better parsing
                content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                
                // Validate content format
                const lines = content.split('\n').filter(line => line.trim() !== '');
                let validLines = 0;
                
                for (const line of lines) {
                    if (line.includes(' - ')) {
                        const parts = line.split(' - ');
                        if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
                            validLines++;
                        }
                    }
                }
                
                if (validLines === 0) {
                    this.showNotification('No valid word pairs found in the file. Format: Spanish - English', 'error');
                    fileNameSpan.textContent = 'Invalid format';
                    fileNameSpan.classList.remove('has-file');
                    return;
                }
                
                // Load content into textarea
                wordListTextarea.value = content;
                
                this.showNotification(`File loaded successfully! Found ${validLines} valid word pairs.`, 'success');
                
            } catch (error) {
                console.error('Error reading file:', error);
                this.showNotification('Error reading file. Please try again.', 'error');
                fileNameSpan.textContent = 'Error reading file';
                fileNameSpan.classList.remove('has-file');
            }
        };
        
        reader.onerror = () => {
            this.showNotification('Error reading file. Please try again.', 'error');
            fileNameSpan.textContent = 'Error reading file';
            fileNameSpan.classList.remove('has-file');
        };
        
        // Read file as text
        reader.readAsText(file);
    },
    
    // Clear word list
    clearWordList() {
        const wordListTextarea = document.getElementById('word-list');
        const fileNameSpan = document.getElementById('file-name');
        const fileInput = document.getElementById('file-input');
        
        if (wordListTextarea) {
            wordListTextarea.value = '';
        }
        
        if (fileNameSpan) {
            fileNameSpan.textContent = 'No file selected';
            fileNameSpan.classList.remove('has-file');
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.showNotification('Word list cleared successfully!', 'success');
    },
    
    
    
    // Search words
    searchWords(query) {
        const wordsContainer = document.querySelector('.words-container');
        if (!wordsContainer) return;
        
        // Filter words by current database and search query
        let filteredWords;
        if (this.currentDatabase === 'learned-words') {
            // Search in learned words
            filteredWords = this.learnedWords.filter(word => 
                word.originalText.toLowerCase().includes(query.toLowerCase()) ||
                word.translatedText.toLowerCase().includes(query.toLowerCase())
            );
        } else {
            // Search in regular words
            filteredWords = this.words.filter(word => 
                word.databaseId === this.currentDatabase && (
                    word.originalText.toLowerCase().includes(query.toLowerCase()) ||
                    word.translatedText.toLowerCase().includes(query.toLowerCase())
                )
            );
        }
        
        this.displayWords(filteredWords);
    },
    
    // Display words in the view
    displayWords(words = null) {
        const wordsContainer = document.querySelector('.words-container');
        if (!wordsContainer) return;
        
        // Filter words by current database if no specific words provided
        let wordsToShow;
        if (words) {
            wordsToShow = words;
        } else if (this.currentDatabase === 'learned-words') {
            // Use learned words for this database
            wordsToShow = this.learnedWords;
        } else {
            // Filter by current database
            wordsToShow = this.words.filter(word => word.databaseId === this.currentDatabase);
        }
        
        if (wordsToShow.length === 0) {
            wordsContainer.innerHTML = '<div class="no-words-message">No words in this database</div>';
            return;
        }
        
        // Create a table format
        const wordsHTML = `
            <table class="words-table">
                <thead>
                    <tr>
                        <th>Spanish</th>
                        <th>English</th>
                        <th>Points</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${wordsToShow.map((word) => `
                        <tr class="word-row">
                            <td class="spanish-word">${word.translatedText}</td>
                            <td class="english-word">${word.originalText}</td>
                            <td class="points-cell">
                                <span class="points-value">${word.counter || 0}</span>
                            </td>
                            <td class="action-cell">
                                <button class="move-btn" onclick="App.moveWordToDatabase('${word.id}')" title="Move to another database">📁</button>
                                <button class="delete-btn" onclick="${this.currentDatabase === 'learned-words' ? 'App.deleteLearnedWord' : 'App.deleteWord'}('${word.id}')" title="Delete word">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        wordsContainer.innerHTML = wordsHTML;
    },
    
    // Edit word
    async editWord(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;
        
        const newOriginal = prompt('Edit original word:', word.originalText);
        if (newOriginal && newOriginal.trim()) {
            word.originalText = newOriginal.trim();
            await this.saveData();
            this.updateUI();
            this.showNotification('Word updated successfully!', 'success');
        }
    },
    
    // Move word to another database
    async moveWordToDatabase(wordId) {
        let word;
        const idToFind = parseFloat(wordId);
        
        // Check if it's a learned word first
        if (this.currentDatabase === 'learned-words') {
            word = this.learnedWords.find(w => w.id === idToFind);
        } else {
            word = this.words.find(w => w.id === idToFind);
        }
        
        if (!word) {
            this.showNotification('Word not found', 'error');
            return;
        }
        
        // Get available databases (excluding current one and learned words)
        const availableDatabases = this.databases.filter(db => 
            db.id !== this.currentDatabase && db.id !== 'learned-words' && !db.isSystem
        );
        
        if (availableDatabases.length === 0) {
            this.showNotification('No other databases available. Create a new database first.', 'error');
            return;
        }
        
        // Create a modal for database selection
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Select target database:</h3>
                <select id="target-database-select" class="database-select">
                    <option value="">Choose a database...</option>
                    ${availableDatabases.map(db => `<option value="${db.id}">${db.name}</option>`).join('')}
                </select>
                <div class="modal-buttons">
                    <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-confirm" onclick="App.confirmMoveWord('${wordId}')">Move</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store the word ID for later use
        this.pendingMoveWordId = wordId;
        
        return;
    },
    
    // Confirm move word to selected database
    async confirmMoveWord(wordId) {
        const targetDatabaseId = document.getElementById('target-database-select').value;
        if (!targetDatabaseId) {
            this.showNotification('Please select a target database', 'error');
            return;
        }
        
        const targetDatabase = this.databases.find(db => db.id === targetDatabaseId);
        if (!targetDatabase) {
            this.showNotification('Target database not found', 'error');
            return;
        }
        
        // Find the word
        let word;
        const idToFind = parseFloat(wordId);
        
        if (this.currentDatabase === 'learned-words') {
            word = this.learnedWords.find(w => w.id === idToFind);
        } else {
            word = this.words.find(w => w.id === idToFind);
        }
        
        if (!word) {
            this.showNotification('Word not found', 'error');
            return;
        }
        
        // Update word's database and reset counter
        word.databaseId = targetDatabaseId;
        word.counter = 0;
        
        // If it was a learned word, remove it from learned words and add to regular words
        if (this.currentDatabase === 'learned-words') {
            this.learnedWords = this.learnedWords.filter(w => w.id !== idToFind);
            this.words.push(word);
        }
        
        await this.saveData();
        this.updateUI();
        this.showNotification(`Word moved to "${targetDatabase.name}" successfully!`, 'success');
        
        // Remove modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    },
    
    // Move learned word to another database
    async moveLearnedWordToDatabase(wordId) {
        const word = this.learnedWords.find(w => w.id === parseFloat(wordId));
        if (!word) {
            this.showNotification('Word not found', 'error');
            return;
        }
        
        // Get available databases (excluding learned words)
        const availableDatabases = this.databases.filter(db => 
            db.id !== 'learned-words' && !db.isSystem
        );
        
        if (availableDatabases.length === 0) {
            this.showNotification('No other databases available. Create a new database first.', 'error');
            return;
        }
        
        // Create a modal for database selection
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Select target database:</h3>
                <select id="target-database-select" class="database-select">
                    <option value="">Choose a database...</option>
                    ${availableDatabases.map(db => `<option value="${db.id}">${db.name}</option>`).join('')}
                </select>
                <div class="modal-buttons">
                    <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-confirm" onclick="App.confirmMoveLearnedWord('${wordId}')">Move</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store the word ID for later use
        this.pendingMoveLearnedWordId = wordId;
    },
    
    // Confirm move learned word to selected database
    async confirmMoveLearnedWord(wordId) {
        const targetDatabaseId = document.getElementById('target-database-select').value;
        if (!targetDatabaseId) {
            this.showNotification('Please select a target database', 'error');
            return;
        }
        
        const targetDatabase = this.databases.find(db => db.id === targetDatabaseId);
        if (!targetDatabase) {
            this.showNotification('Target database not found', 'error');
            return;
        }
        
        // Find the word
        const word = this.learnedWords.find(w => w.id === parseFloat(wordId));
        if (!word) {
            this.showNotification('Word not found', 'error');
            return;
        }
        
        // Update word's database and reset counter
        word.databaseId = targetDatabaseId;
        word.counter = 0;
        word.score = 0;
        
        // Remove from learned words and add to regular words
        this.learnedWords = this.learnedWords.filter(w => w.id !== parseFloat(wordId));
        this.words.push(word);
        
        await this.saveData();
        this.updateUI();
        this.showNotification(`Word moved to "${targetDatabase.name}" successfully!`, 'success');
        
        // Remove modal
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    },

    // Delete learned word
    async deleteLearnedWord(wordId) {
        if (confirm('Are you sure you want to delete this learned word?')) {
            // Convert wordId to number for proper comparison
            const idToDelete = parseFloat(wordId);
            this.learnedWords = this.learnedWords.filter(w => w.id !== idToDelete);
            await this.saveData();
            this.updateUI();
            this.showNotification('Learned word deleted successfully!', 'success');
        }
    },
    
    // Delete word
    async deleteWord(wordId) {
        if (confirm('Are you sure you want to delete this word?')) {
            // Convert wordId to number for proper comparison
            const idToDelete = parseFloat(wordId);
            this.words = this.words.filter(w => w.id !== idToDelete);
            await this.saveData();
            this.updateUI();
            this.showNotification('Word deleted successfully!', 'success');
        }
    },
    
    // Delete all words from current database
    async deleteAllWords() {
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        let wordsToDelete;
        let wordsCount;
        
        if (this.currentDatabase === 'learned-words') {
            wordsToDelete = this.learnedWords;
            wordsCount = this.learnedWords.length;
        } else {
            wordsToDelete = this.words.filter(word => word.databaseId === this.currentDatabase);
            wordsCount = wordsToDelete.length;
        }
        
        if (wordsCount === 0) {
            this.showNotification('No words to delete in this database', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ALL ${wordsCount} words from this database? This action cannot be undone.`)) {
            if (this.currentDatabase === 'learned-words') {
                this.learnedWords = [];
            } else {
                this.words = this.words.filter(word => word.databaseId !== this.currentDatabase);
            }
            await this.saveData();
            this.updateUI();
            this.showNotification(`All ${wordsCount} words deleted successfully!`, 'success');
        }
    },
    
    
    // Mark word as learned
    async markAsLearned(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;
        
        word.score = 15; // Minimum score to be considered learned
        this.learnedWords.push(word);
        this.words = this.words.filter(w => w.id !== wordId);
        await this.saveData();
        this.updateUI();
        this.showNotification('Word marked as learned!', 'success');
    },
    
    // Start game
    startGame() {
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first!', 'error');
            return;
        }
        
        const wordsInDatabase = this.words.filter(word => word.databaseId === this.currentDatabase);
        if (wordsInDatabase.length === 0) {
            this.showNotification('No words in this database!', 'error');
            return;
        }
        
        // Use GameModule to start the game
        GameModule.startGame();
    },
    
    
    
    
    // Change database
    async changeDatabase(database) {
        this.currentDatabase = database;
        await this.saveData();
        this.updateUI();
        
        // If game is active, restart it with new database
        if (GameModule.gameActive) {
            GameModule.restartGame();
        }
    },
    
    // Create new database
    async createDatabase() {
        const name = prompt('Enter database name:');
        if (!name || name.trim() === '') {
            this.showNotification('Database name cannot be empty', 'error');
            return;
        }
        
        // Check if database name already exists
        const existingDB = this.databases.find(db => db.name.toLowerCase() === name.toLowerCase());
        if (existingDB) {
            this.showNotification('Database name already exists', 'error');
            return;
        }
        
        // Check database limit (20)
        if (this.databases.length >= 20) {
            this.showNotification('Maximum number of databases reached (20)', 'error');
            return;
        }
        
        const newDatabase = {
            id: Date.now().toString(),
            name: name.trim(),
            createdAt: new Date().toISOString()
        };
        
        this.databases.push(newDatabase);
        this.currentDatabase = newDatabase.id;
        await this.saveData();
        this.updateUI();
        
        this.showNotification(`Database "${name}" created successfully!`, 'success');
    },
    
    // Delete database
    async deleteDatabase() {
        if (!this.currentDatabase) {
            this.showNotification('No database selected', 'error');
            return;
        }
        
        const currentDB = this.databases.find(db => db.id === this.currentDatabase);
        if (!currentDB) {
            this.showNotification('Database not found', 'error');
            return;
        }
        
        // Count words in current database
        const wordsInDB = this.words.filter(word => word.databaseId === this.currentDatabase);
        
        let confirmMessage = `Are you sure you want to delete the database "${currentDB.name}"?`;
        if (wordsInDB.length > 0) {
            confirmMessage += `\n\nThis will also delete ${wordsInDB.length} words in this database.`;
        }
        
        if (confirm(confirmMessage)) {
            // Remove words from this database
            this.words = this.words.filter(word => word.databaseId !== this.currentDatabase);
            
            // Remove database
            this.databases = this.databases.filter(db => db.id !== this.currentDatabase);
            
            // Select another database or create default
            if (this.databases.length > 0) {
                this.currentDatabase = this.databases[0].id;
            } else {
                this.currentDatabase = '';
            }
            
            await this.saveData();
            this.updateUI();
            
            this.showNotification(`Database "${currentDB.name}" deleted successfully!`, 'success');
        }
    },
    
    // Update UI based on current state
    updateUI() {
        // Update database selectors
        this.updateDatabaseSelectors();
        
        // Update word count
        const wordCountElements = document.querySelectorAll('.word-count');
        wordCountElements.forEach(element => {
            let wordCount;
            if (this.currentDatabase === 'learned-words') {
                wordCount = this.learnedWords.length;
            } else {
                wordCount = this.words.filter(word => word.databaseId === this.currentDatabase).length;
            }
            element.textContent = `All words (${wordCount})`;
        });
        
        // Update learned words count
        const learnedCountElements = document.querySelectorAll('.learned-count');
        learnedCountElements.forEach(element => {
            element.textContent = `Learned words (${this.learnedWords.length})`;
        });
        
        // Update words display if in view-words module
        if (this.currentModule === 'view-words') {
            this.displayWords();
        }
        
        // Update learned words display if in learned-words module
        if (this.currentModule === 'learned-words') {
            this.displayLearnedWords();
        }
    },
    
    // Update database selectors
    updateDatabaseSelectors() {
        const selectors = document.querySelectorAll('select[id*="database"]');
        selectors.forEach(selector => {
            const currentValue = selector.value;
            selector.innerHTML = '<option value="">Select a database...</option>';
            
            this.databases.forEach(db => {
                const option = document.createElement('option');
                option.value = db.id;
                option.textContent = db.name;
                if (db.id === this.currentDatabase) {
                    option.selected = true;
                }
                selector.appendChild(option);
            });
        });
        
        // Enable/disable delete button based on database selection
        const deleteButtons = document.querySelectorAll('.btn-delete');
        deleteButtons.forEach(btn => {
            if (this.currentDatabase && this.databases.length > 0 && this.currentDatabase !== 'learned-words') {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        });
    },
    
    // Display learned words
    displayLearnedWords() {
        const learnedContent = document.querySelector('.learned-content');
        if (!learnedContent) return;
        
        if (this.learnedWords.length === 0) {
            learnedContent.innerHTML = '<div class="no-learned-message">No words learned yet. Keep playing to master words!</div>';
            return;
        }
        
        // Create a table format for learned words
        const learnedHTML = `
            <div class="learned-words-table">
                <table class="words-table">
                    <thead>
                        <tr>
                            <th>Spanish</th>
                            <th>English</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.learnedWords
                            .sort((a, b) => new Date(b.learnedAt || b.createdAt) - new Date(a.learnedAt || a.createdAt))
                            .map(word => `
                            <tr class="learned-word-row">
                                <td class="spanish-word">${word.translatedText}</td>
                                <td class="english-word">${word.originalText}</td>
                                <td class="points-cell">
                                    <span class="points-value">${word.score || 15}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        learnedContent.innerHTML = learnedHTML;
    },
    
    
    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
