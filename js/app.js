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
    
    // Initialize the app
    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUI();
    },
    
    // Load data from localStorage
    loadData() {
        const savedWords = localStorage.getItem('englishApp_words');
        const savedLearned = localStorage.getItem('englishApp_learned');
        const savedStats = localStorage.getItem('englishApp_stats');
        const savedDatabases = localStorage.getItem('englishApp_databases');
        const savedCurrentDB = localStorage.getItem('englishApp_currentDatabase');
        
        if (savedWords) {
            this.words = JSON.parse(savedWords);
        }
        
        if (savedLearned) {
            this.learnedWords = JSON.parse(savedLearned);
        }
        
        if (savedStats) {
            this.gameStats = { ...this.gameStats, ...JSON.parse(savedStats) };
        }
        
        if (savedDatabases) {
            this.databases = JSON.parse(savedDatabases);
        } else {
            // Start with empty databases
            this.databases = [];
            this.currentDatabase = '';
        }
        
        if (savedCurrentDB) {
            this.currentDatabase = savedCurrentDB;
        }
    },
    
    // Save data to localStorage
    saveData() {
        localStorage.setItem('englishApp_words', JSON.stringify(this.words));
        localStorage.setItem('englishApp_learned', JSON.stringify(this.learnedWords));
        localStorage.setItem('englishApp_stats', JSON.stringify(this.gameStats));
        localStorage.setItem('englishApp_databases', JSON.stringify(this.databases));
        localStorage.setItem('englishApp_currentDatabase', this.currentDatabase);
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
        
        // Import words functionality
        const wordListTextarea = document.getElementById('word-list');
        if (wordListTextarea) {
            wordListTextarea.addEventListener('input', () => this.handleWordListImport());
        }
        
        // Delete all words functionality
        const deleteAllBtn = document.getElementById('delete-all-btn');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', () => this.deleteAllWords());
        }
        
    },
    
    // Handle word input
    handleWordInput(value) {
        const languageDetection = document.querySelector('.language-detection');
        if (languageDetection) {
            if (value.trim()) {
                languageDetection.textContent = 'DETECTING LANGUAGE...';
                // Simple language detection based on characters
                this.simpleLanguageDetection(value);
            } else {
                languageDetection.textContent = 'DETECTING LANGUAGE...';
            }
        }
        
        // Clear translation results when input changes
        this.clearTranslations();
    },
    
    // Clear translation results
    clearTranslations() {
        const translationResults = document.getElementById('translation-results');
        if (translationResults) {
            translationResults.style.display = 'none';
        }
        this.selectedTranslation = null;
    },
    
    // Simple language detection
    simpleLanguageDetection(text) {
        const languageDetection = document.querySelector('.language-detection');
        if (!languageDetection) return;
        
        // Simple heuristics for language detection
        const hasAccents = /[áéíóúñü]/i.test(text);
        const hasEnglishChars = /[a-zA-Z]/.test(text);
        
        if (hasAccents) {
            languageDetection.textContent = 'Language detected: Spanish';
            languageDetection.style.color = '#28a745';
        } else if (hasEnglishChars) {
            languageDetection.textContent = 'Language detected: English';
            languageDetection.style.color = '#007bff';
        } else {
            languageDetection.textContent = 'DETECTING LANGUAGE...';
            languageDetection.style.color = '#6c757d';
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
        
        // Check if word pair already exists
        const existingWord = this.words.find(w => 
            (w.originalText.toLowerCase() === english.toLowerCase() && 
             w.translatedText.toLowerCase() === spanish.toLowerCase()) ||
            (w.originalText.toLowerCase() === spanish.toLowerCase() && 
             w.translatedText.toLowerCase() === english.toLowerCase())
        );
        
        if (existingWord) {
            this.showNotification('This word pair already exists', 'info');
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
        this.saveData();
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
            
            // Check if word pair already exists
            const existingWord = this.words.find(w => 
                (w.originalText.toLowerCase() === english.toLowerCase() && 
                 w.translatedText.toLowerCase() === spanish.toLowerCase()) ||
                (w.originalText.toLowerCase() === spanish.toLowerCase() && 
                 w.translatedText.toLowerCase() === english.toLowerCase())
            );
            
            if (existingWord) {
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
        this.saveData();
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
    
    
    // Display translations in the UI
    displayTranslations(translations) {
        const translationResults = document.getElementById('translation-results');
        const translationList = document.getElementById('translation-list');
        
        if (!translationResults || !translationList) return;
        
        // Clear previous translations
        translationList.innerHTML = '';
        
        // Add each translation
        translations.forEach((translation, index) => {
            const translationItem = document.createElement('div');
            translationItem.className = 'translation-item';
            translationItem.innerHTML = `
                <div class="translation-text">${translation.text}</div>
                <div class="translation-language">${translation.detectedSourceLanguage}</div>
            `;
            
            // Add click handler to select translation
            translationItem.addEventListener('click', () => {
                this.selectTranslation(translation, index);
            });
            
            translationList.appendChild(translationItem);
        });
        
        // Show translation results
        translationResults.style.display = 'block';
    },
    
    // Select a translation
    selectTranslation(translation, index) {
        // Remove previous selections
        document.querySelectorAll('.translation-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select current translation
        const translationItems = document.querySelectorAll('.translation-item');
        if (translationItems[index]) {
            translationItems[index].classList.add('selected');
        }
        
        // Store selected translation for adding
        this.selectedTranslation = translation;
    },
    
    // Search words
    searchWords(query) {
        const wordsContainer = document.querySelector('.words-container');
        if (!wordsContainer) return;
        
        // Filter words by current database and search query
        const filteredWords = this.words.filter(word => 
            word.databaseId === this.currentDatabase && (
                word.originalText.toLowerCase().includes(query.toLowerCase()) ||
                word.translatedText.toLowerCase().includes(query.toLowerCase())
            )
        );
        
        this.displayWords(filteredWords);
    },
    
    // Display words in the view
    displayWords(words = null) {
        const wordsContainer = document.querySelector('.words-container');
        if (!wordsContainer) return;
        
        // Filter words by current database if no specific words provided
        const wordsToShow = words || this.words.filter(word => word.databaseId === this.currentDatabase);
        
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
                            <td class="spanish-word">${word.originalText}</td>
                            <td class="english-word">${word.translatedText}</td>
                            <td class="points-cell">
                                <span class="points-value">${word.counter || 0}</span>
                            </td>
                            <td class="action-cell">
                                <button class="delete-btn" onclick="App.deleteWord('${word.id}')">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        wordsContainer.innerHTML = wordsHTML;
    },
    
    // Edit word
    editWord(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;
        
        const newOriginal = prompt('Edit original word:', word.originalText);
        if (newOriginal && newOriginal.trim()) {
            word.originalText = newOriginal.trim();
            this.saveData();
            this.updateUI();
            this.showNotification('Word updated successfully!', 'success');
        }
    },
    
    // Delete word
    deleteWord(wordId) {
        if (confirm('Are you sure you want to delete this word?')) {
            // Convert wordId to number for proper comparison
            const idToDelete = parseFloat(wordId);
            this.words = this.words.filter(w => w.id !== idToDelete);
            this.saveData();
            this.updateUI();
            this.showNotification('Word deleted successfully!', 'success');
        }
    },
    
    // Delete all words from current database
    deleteAllWords() {
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        const wordsInDatabase = this.words.filter(word => word.databaseId === this.currentDatabase);
        if (wordsInDatabase.length === 0) {
            this.showNotification('No words to delete in this database', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ALL ${wordsInDatabase.length} words from this database? This action cannot be undone.`)) {
            this.words = this.words.filter(word => word.databaseId !== this.currentDatabase);
            this.saveData();
            this.updateUI();
            this.showNotification(`All ${wordsInDatabase.length} words deleted successfully!`, 'success');
        }
    },
    
    
    // Mark word as learned
    markAsLearned(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;
        
        word.score = 15; // Minimum score to be considered learned
        this.learnedWords.push(word);
        this.words = this.words.filter(w => w.id !== wordId);
        this.saveData();
        this.updateUI();
        this.showNotification('Word marked as learned!', 'success');
    },
    
    // Start game
    startGame() {
        if (this.words.length === 0) {
            this.showNotification('Please add some words first!', 'error');
            return;
        }
        
        this.showNotification('Game will start soon!', 'info');
        // Game logic will be implemented in the game module
    },
    
    // Handle word list import
    handleWordListImport() {
        const wordListTextarea = document.getElementById('word-list');
        const words = wordListTextarea.value.split('\n').filter(word => word.trim());
        
        if (words.length > 0) {
            this.showNotification(`Ready to import ${words.length} words`, 'info');
        }
    },
    
    // Translate word list
    translateWordList() {
        const wordListTextarea = document.getElementById('word-list');
        const words = wordListTextarea.value.split('\n').filter(word => word.trim());
        
        if (words.length === 0) {
            this.showNotification('Please enter some words to translate', 'error');
            return;
        }
        
        // Placeholder for Google Translate API
        this.showNotification(`Translation feature will translate ${words.length} words`, 'info');
    },
    
    // Add word list
    async addWordList() {
        const wordListTextarea = document.getElementById('word-list');
        const words = wordListTextarea.value.split('\n').filter(word => word.trim());
        
        if (words.length === 0) {
            this.showNotification('Please enter some words to add', 'error');
            return;
        }
        
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        // Check if API key is set
        if (!TranslateService.hasApiKey()) {
            this.showNotification('Please configure API Key first. Click "SETUP API KEY" button.', 'error');
            return;
        }
        
        try {
            this.showNotification(`Processing ${words.length} words...`, 'info');
            
            let totalAdded = 0;
            let totalSkipped = 0;
            
            for (const word of words) {
                try {
                    const translations = await TranslateService.getMultipleTranslations(word);
                    
                    if (translations && translations.length > 0) {
                        for (const translation of translations) {
                            // Check if this specific translation already exists
                            const existingWord = this.words.find(w => 
                                w.originalText.toLowerCase() === word.toLowerCase() && 
                                w.translatedText.toLowerCase() === translation.text.toLowerCase() &&
                                w.databaseId === this.currentDatabase
                            );
                            
                            if (!existingWord) {
                                const newWord = {
                                    id: Date.now() + Math.random(),
                                    originalText: word,
                                    translatedText: translation.text,
                                    detectedLanguage: translation.detectedSourceLanguage,
                                    databaseId: this.currentDatabase,
                                    score: 0,
                                    attempts: 0,
                                    lastPracticed: null,
                                    createdAt: new Date().toISOString()
                                };
                                
                                this.words.push(newWord);
                                totalAdded++;
                            } else {
                                totalSkipped++;
                            }
                        }
                    } else {
                        totalSkipped++;
                    }
                } catch (error) {
                    console.error(`Error translating word "${word}":`, error);
                    totalSkipped++;
                }
            }
            
            this.saveData();
            this.updateUI();
            
            this.showNotification(
                `Import completed! ${totalAdded} translations added, ${totalSkipped} skipped.`, 
                'success'
            );
            
            // Clear textarea
            wordListTextarea.value = '';
            
        } catch (error) {
            console.error('Add word list error:', error);
            this.showNotification('Failed to process word list: ' + error.message, 'error');
        }
    },
    
    // Change database
    changeDatabase(database) {
        this.currentDatabase = database;
        this.updateUI();
    },
    
    // Create new database
    createDatabase() {
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
        this.saveData();
        this.updateUI();
        
        this.showNotification(`Database "${name}" created successfully!`, 'success');
    },
    
    // Delete database
    deleteDatabase() {
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
            
            this.saveData();
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
            const currentDBWords = this.words.filter(word => word.databaseId === this.currentDatabase);
            element.textContent = `All words (${currentDBWords.length})`;
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
            if (this.currentDatabase && this.databases.length > 0) {
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
        
        const learnedHTML = this.learnedWords.map(word => `
            <div class="learned-word-card">
                <div class="learned-word-content">
                    <div class="learned-word-english">${word.english}</div>
                    <div class="learned-word-spanish">${word.spanish}</div>
                </div>
                <div class="learned-word-score">Score: ${word.score}</div>
            </div>
        `).join('');
        
        learnedContent.innerHTML = `<div class="learned-words-list">${learnedHTML}</div>`;
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
