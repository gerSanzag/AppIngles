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
        this.updateApiStatus();
        this.setupSmartInputDetection();
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
        // Add word functionality
        // Single word translation
        const singleWordInput = document.getElementById('single-word-input');
        const translateBtn = document.getElementById('translate-btn');
        const addSingleBtn = document.getElementById('add-single-btn');
        
        if (singleWordInput && translateBtn) {
            translateBtn.addEventListener('click', () => this.translateSingleWord());
            singleWordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.translateSingleWord();
                }
            });
        }
        
        if (addSingleBtn) {
            addSingleBtn.addEventListener('click', () => this.addSingleWord());
        }
        
        // Word pair input
        const wordPairInput = document.getElementById('word-pair-input');
        const addPairBtn = document.getElementById('add-pair-btn');
        
        if (wordPairInput && addPairBtn) {
            addPairBtn.addEventListener('click', () => this.addWordPairDirect());
            wordPairInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addWordPairDirect();
                }
            });
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
        
        // Word list buttons
        const translateListBtn = document.querySelector('.import-section .btn-translate');
        const addListBtn = document.querySelector('.import-section .btn-add');
        
        if (translateListBtn) {
            translateListBtn.addEventListener('click', () => this.translateWordList());
        }
        
        if (addListBtn) {
            addListBtn.addEventListener('click', () => this.addWordList());
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
    
    // Add a new word
    async addWord() {
        const wordInput = document.getElementById('word-input');
        const input = wordInput.value.trim();
        
        if (!input) {
            this.showNotification('Please enter a word or phrase', 'error');
            return;
        }
        
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        // Check if input is a word pair
        const inputType = this.parseInput(input);
        
        if (inputType.type === 'pair') {
            // Handle word pair directly (no translation needed)
            await this.addWordPair();
            return;
        }
        
        // Handle single word (needs translation)
        if (!TranslateService.hasApiKey()) {
            this.showNotification('Please configure API Key first. Click "SETUP API KEY" button.', 'error');
            return;
        }
        
        try {
            this.showNotification('Translating and adding word...', 'info');
            
            const translations = await TranslateService.getMultipleTranslations(input);
            
            if (!translations || translations.length === 0) {
                this.showNotification('No translation found', 'error');
                return;
            }
            
            // Display translations first
            this.displayTranslations(translations);
            
            let addedCount = 0;
            let skippedCount = 0;
            
            // Add each translation as a separate word
            for (const translation of translations) {
                // Check if this specific translation already exists
                const existingWord = this.words.find(w => 
                    w.originalText.toLowerCase() === input.toLowerCase() && 
                    w.translatedText.toLowerCase() === translation.text.toLowerCase() &&
                    w.databaseId === this.currentDatabase
                );
                
                if (!existingWord) {
                    const newWord = {
                        id: Date.now() + Math.random(),
                        originalText: input,
                        translatedText: translation.text,
                        detectedLanguage: translation.detectedSourceLanguage,
                        databaseId: this.currentDatabase,
                        score: 0,
                        attempts: 0,
                        lastPracticed: null,
                        createdAt: new Date().toISOString()
                    };
                    
                    this.words.push(newWord);
                    addedCount++;
                } else {
                    skippedCount++;
                }
            }
            
            this.saveData();
            this.updateUI();
            
            if (addedCount > 0) {
                this.showNotification(
                    `Word added successfully! ${addedCount} translations added, ${skippedCount} skipped.`, 
                    'success'
                );
            } else {
                this.showNotification('All translations already exist', 'info');
            }
            
        } catch (error) {
            console.error('Add word error:', error);
            this.showNotification('Failed to add word: ' + error.message, 'error');
        }
    },
    
    // Translate word using Google Translate
    async translateWord() {
        const wordInput = document.getElementById('word-input');
        const word = wordInput.value.trim();
        
        if (!word) {
            this.showNotification('Please enter a word to translate', 'error');
            return;
        }
        
        // Check if API key is set
        if (!TranslateService.hasApiKey()) {
            this.showNotification('Google Translate API key required. Click "SETUP API KEY" to configure.', 'error');
            return;
        }
        
        try {
            this.showNotification('Translating...', 'info');
            
            const translations = await TranslateService.getMultipleTranslations(word);
            
            if (translations && translations.length > 0) {
                this.displayTranslations(translations);
                this.showNotification('Translation completed!', 'success');
            } else {
                this.showNotification('No translation found', 'error');
            }
            
        } catch (error) {
            console.error('Translation error:', error);
            this.showNotification('Translation failed: ' + error.message, 'error');
        }
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
        
        const filteredWords = this.words.filter(word => 
            word.english.toLowerCase().includes(query.toLowerCase()) ||
            word.spanish.toLowerCase().includes(query.toLowerCase())
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
        
        const wordsHTML = wordsToShow.map(word => `
            <div class="word-card">
                <div class="word-content">
                    <div class="word-original">${word.originalText}</div>
                    <div class="word-translation">${word.translatedText}</div>
                    <div class="word-language">${word.detectedLanguage}</div>
                </div>
                <div class="word-actions">
                    <button class="word-btn edit" onclick="App.editWord('${word.id}')">Edit</button>
                    <button class="word-btn delete" onclick="App.deleteWord('${word.id}')">Delete</button>
                    <button class="word-btn learned" onclick="App.markAsLearned('${word.id}')">Mark Learned</button>
                </div>
            </div>
        `).join('');
        
        wordsContainer.innerHTML = `<div class="words-list">${wordsHTML}</div>`;
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
            this.words = this.words.filter(w => w.id !== wordId);
            this.saveData();
            this.updateUI();
            this.showNotification('Word deleted successfully!', 'success');
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
    
    // Setup API Key
    setupApiKey() {
        if (TranslateService.showApiKeyDialog()) {
            this.updateApiStatus();
            this.showNotification('API Key configured successfully!', 'success');
        }
    },
    
    // Update API status display
    updateApiStatus() {
        const apiStatus = document.getElementById('api-status');
        if (apiStatus) {
            if (TranslateService.hasApiKey()) {
                apiStatus.textContent = '✅ API Key configured';
                apiStatus.style.color = '#28a745';
            } else {
                apiStatus.textContent = '❌ API Key not configured';
                apiStatus.style.color = '#dc3545';
            }
        }
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
    
    // ===== SMART INPUT DETECTION SYSTEM =====
    
    // Setup smart input detection
    setupSmartInputDetection() {
        const singleWordInput = document.getElementById('single-word-input');
        const wordPairInput = document.getElementById('word-pair-input');
        
        if (singleWordInput) {
            singleWordInput.addEventListener('input', () => {
                this.updateSingleWordUI();
            });
        }
        
        if (wordPairInput) {
            wordPairInput.addEventListener('input', () => {
                this.updateWordPairUI();
            });
        }
        
        // Initial setup
        this.updateSingleWordUI();
        this.updateWordPairUI();
    },
    
    // Update single word UI
    updateSingleWordUI() {
        const singleWordInput = document.getElementById('single-word-input');
        const translateBtn = document.getElementById('translate-btn');
        const addSingleBtn = document.getElementById('add-single-btn');
        
        if (!singleWordInput || !translateBtn || !addSingleBtn) return;
        
        const input = singleWordInput.value.trim();
        
        if (input) {
            translateBtn.disabled = false;
            addSingleBtn.disabled = false;
        } else {
            translateBtn.disabled = true;
            addSingleBtn.disabled = true;
        }
    },
    
    // Update word pair UI
    updateWordPairUI() {
        const wordPairInput = document.getElementById('word-pair-input');
        const addPairBtn = document.getElementById('add-pair-btn');
        
        if (!wordPairInput || !addPairBtn) return;
        
        const input = wordPairInput.value.trim();
        
        if (input && input.includes(' - ')) {
            addPairBtn.disabled = false;
        } else {
            addPairBtn.disabled = true;
        }
    },
    
    // Parse input to determine type and extract words
    parseInput(input) {
        if (!input || input.trim() === '') {
            return { type: 'empty', words: null };
        }
        
        // Check for common separators
        const separators = [' - ', ' -', '- ', ' - ', ' | ', ' |', '| ', ' | '];
        
        for (const separator of separators) {
            if (input.includes(separator)) {
                const parts = input.split(separator);
                if (parts.length === 2) {
                    const word1 = parts[0].trim();
                    const word2 = parts[1].trim();
                    
                    if (word1 && word2) {
                        return {
                            type: 'pair',
                            words: { word1, word2 },
                            separator: separator
                        };
                    }
                }
            }
        }
        
        // Single word
        return {
            type: 'single',
            words: { single: input.trim() }
        };
    },
    
    // Detect language of a word using Google Translate API
    async detectLanguageSimple(word) {
        try {
            // Use Google Translate API to detect language
            const detectedLang = await TranslateService.detectLanguage(word);
            return detectedLang;
        } catch (error) {
            console.error('Language detection error:', error);
            return 'unknown';
        }
    },
    
    // Add word pair directly (without translation)
    async addWordPair() {
        const wordInput = document.getElementById('word-input');
        const input = wordInput.value.trim();
        
        if (!input) {
            this.showNotification('Please enter a word pair', 'error');
            return;
        }
        
        const inputType = this.parseInput(input);
        
        if (inputType.type !== 'pair') {
            this.showNotification('Please enter a word pair separated by " - "', 'error');
            return;
        }
        
        const { word1, word2 } = inputType.words;
        
        // Detect languages using Google Translate API
        const lang1 = await this.detectLanguageSimple(word1);
        const lang2 = await this.detectLanguageSimple(word2);
        
        // Determine which is English and which is Spanish
        let english, spanish;
        
        if (lang1 === 'en' || lang2 === 'es') {
            english = lang1 === 'en' ? word1 : word2;
            spanish = lang1 === 'es' ? word1 : word2;
        } else if (lang2 === 'en' || lang1 === 'es') {
            english = lang2 === 'en' ? word2 : word1;
            spanish = lang2 === 'es' ? word2 : word1;
        } else {
            // If we can't determine, ask user to specify
            this.showNotification('Cannot determine languages. Please use format: English - Spanish', 'error');
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
        
        // Add the word pair
        const newWord = {
            id: Date.now() + Math.random(),
            originalText: english,
            translatedText: spanish,
            detectedLanguage: 'en',
            databaseId: this.currentDatabase,
            score: 0,
            attempts: 0,
            lastPracticed: null,
            createdAt: new Date().toISOString()
        };
        
        this.words.push(newWord);
        this.saveData();
        this.updateUI();
        
        // Clear input
        wordInput.value = '';
        this.detectInputType();
        
        this.showNotification('Word pair added successfully!', 'success');
    },
    
    // ===== NEW SEPARATED FUNCTIONS =====
    
    // Translate single word
    async translateSingleWord() {
        const singleWordInput = document.getElementById('single-word-input');
        const word = singleWordInput.value.trim();
        
        if (!word) {
            this.showNotification('Please enter a word to translate', 'error');
            return;
        }
        
        if (!TranslateService.hasApiKey()) {
            this.showNotification('Google Translate API key required. Click "SETUP API KEY" to configure.', 'error');
            return;
        }
        
        try {
            this.showNotification('Translating...', 'info');
            
            const translations = await TranslateService.getMultipleTranslations(word);
            
            if (translations && translations.length > 0) {
                this.displayTranslations(translations);
                this.showNotification('Translation completed!', 'success');
            } else {
                this.showNotification('No translation found', 'error');
            }
            
        } catch (error) {
            console.error('Translation error:', error);
            this.showNotification('Translation failed: ' + error.message, 'error');
        }
    },
    
    // Add single word (after translation)
    async addSingleWord() {
        const singleWordInput = document.getElementById('single-word-input');
        const word = singleWordInput.value.trim();
        
        if (!word) {
            this.showNotification('Please enter a word', 'error');
            return;
        }
        
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        if (!TranslateService.hasApiKey()) {
            this.showNotification('Please configure API Key first. Click "SETUP API KEY" button.', 'error');
            return;
        }
        
        try {
            this.showNotification('Translating and adding word...', 'info');
            
            const translations = await TranslateService.getMultipleTranslations(word);
            
            if (!translations || translations.length === 0) {
                this.showNotification('No translation found', 'error');
                return;
            }
            
            // Add the first translation
            const translation = translations[0];
            
            // Check if word already exists
            const existingWord = this.words.find(w => 
                w.originalText.toLowerCase() === word.toLowerCase() && 
                w.translatedText.toLowerCase() === translation.text.toLowerCase() &&
                w.databaseId === this.currentDatabase
            );
            
            if (existingWord) {
                this.showNotification('This word already exists', 'info');
                return;
            }
            
            // Add the word
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
            this.saveData();
            this.updateUI();
            
            // Clear input
            singleWordInput.value = '';
            this.updateSingleWordUI();
            
            this.showNotification('Word added successfully!', 'success');
            
        } catch (error) {
            console.error('Add word error:', error);
            this.showNotification('Failed to add word: ' + error.message, 'error');
        }
    },
    
    // Add word pair directly
    async addWordPairDirect() {
        const wordPairInput = document.getElementById('word-pair-input');
        const input = wordPairInput.value.trim();
        
        if (!input) {
            this.showNotification('Please enter a word pair', 'error');
            return;
        }
        
        if (!this.currentDatabase) {
            this.showNotification('Please select a database first', 'error');
            return;
        }
        
        if (!input.includes(' - ')) {
            this.showNotification('Please use format: Spanish word - English word', 'error');
            return;
        }
        
        // Parse the pair (Spanish - English)
        const parts = input.split(' - ');
        if (parts.length !== 2) {
            this.showNotification('Please use format: Spanish word - English word', 'error');
            return;
        }
        
        const spanish = parts[0].trim();
        const english = parts[1].trim();
        
        if (!spanish || !english) {
            this.showNotification('Both words are required', 'error');
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
            createdAt: new Date().toISOString()
        };
        
        this.words.push(newWord);
        this.saveData();
        this.updateUI();
        
        // Clear input
        wordPairInput.value = '';
        this.updateWordPairUI();
        
        this.showNotification('Word pair added successfully!', 'success');
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
