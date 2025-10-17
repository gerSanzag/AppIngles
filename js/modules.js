// Game Module
const GameModule = {
    currentQuestion: null,
    gameActive: false,
    currentScore: 0,
    currentStreak: 0,
    availableWords: [],
    
    // Start the game
    startGame() {
        if (!App.currentDatabase) {
            App.showNotification('Please select a database first!', 'error');
            return;
        }
        
        // Check if trying to play with learned words database
        if (App.currentDatabase === 'learned-words') {
            App.showNotification('Cannot play with learned words! Please select a regular database.', 'error');
            Navigation.navigateToModule('learned-words');
            return;
        }
        
        // Get words from current database (excluding learned words)
        this.availableWords = App.words.filter(word => 
            word.databaseId === App.currentDatabase && 
            word.counter < 15
        );
        
        if (this.availableWords.length === 0) {
            App.showNotification('No words available in this database!', 'error');
            return;
        }
        
        this.gameActive = true;
        this.currentScore = 0;
        this.currentStreak = 0;
        
        this.showGameInterface();
        this.nextQuestion();
    },
    
    // Restart game with current database
    restartGame() {
        if (this.gameActive) {
            this.endGame();
        }
        setTimeout(() => {
            this.startGame();
        }, 100);
    },
    
    // Show game interface
    showGameInterface() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        gameArea.innerHTML = `
            <div class="game-question" id="game-question">
                <div class="question-word" id="question-word">Loading...</div>
                <div class="question-instruction">How do you say this in English?</div>
                <div class="word-progress" id="word-progress" style="display: none;"></div>
            </div>
            
            <div class="game-answer">
                <input type="text" id="answer-input" placeholder="Type your answer here..." autocomplete="off">
            </div>
            
            <div class="game-feedback" id="game-feedback" style="display: none;"></div>
            
            <div class="game-controls">
                <button class="btn-add" onclick="GameModule.checkAnswer()">CHECK ANSWER</button>
                <div class="show-answer-section">
                    <button class="btn-view" onclick="GameModule.showAnswer()">MOSTRAR RESPUESTA</button>
                    <div class="answer-fields">
                        <input type="text" id="show-answer-input" placeholder="Respuesta correcta desplegada" readonly>
                        <input type="text" id="practice-answer-input" placeholder="Campo vacío para que el usuario escriba" autocomplete="off">
                    </div>
                </div>
                <button class="btn-view" onclick="GameModule.nextQuestion()" id="next-word-btn" style="display: none;">NEXT WORD</button>
                <button class="back-btn" onclick="GameModule.endGame()">END GAME</button>
            </div>
        `;
        
        // Focus on answer input
        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.focus();
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            });
        }
    },
    
    // Get next question
    nextQuestion() {
        // Check if trying to play with learned words database
        if (App.currentDatabase === 'learned-words') {
            this.endGame();
            return;
        }
        
        // Update available words (filter by current database and remove learned words)
        this.availableWords = App.words.filter(word => 
            word.databaseId === App.currentDatabase && 
            word.counter < 15 // Exclude words that are already learned
        );
        
        console.log('Current database:', App.currentDatabase);
        console.log('Available words:', this.availableWords.length);
        console.log('All words:', App.words.length);
        
        if (this.availableWords.length === 0) {
            this.endGame();
            return;
        }
        
        // Select word prioritizing those with lower scores
        this.availableWords.sort((a, b) => (a.counter || 0) - (b.counter || 0));
        
        // Get words with lowest scores
        const lowestScore = this.availableWords[0].counter || 0;
        const lowScoreWords = this.availableWords.filter(word => (word.counter || 0) === lowestScore);
        
        // Select random word from low score words
        const randomIndex = Math.floor(Math.random() * lowScoreWords.length);
        this.currentQuestion = lowScoreWords[randomIndex];
        
        // Update question display
        const questionWord = document.getElementById('question-word');
        if (questionWord) {
            questionWord.textContent = `"${this.currentQuestion.translatedText}"`;
        }
        
        // Show word progress
        const wordProgress = document.getElementById('word-progress');
        if (wordProgress) {
            const currentScore = this.currentQuestion.counter || 0;
            wordProgress.textContent = `Progress: ${currentScore}/15 points`;
            wordProgress.style.display = 'block';
        }
        
        // Clear previous feedback
        const feedback = document.getElementById('game-feedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
        
        // Clear answer input
        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
        }
        
        // Clear show answer inputs
        const showAnswerInput = document.getElementById('show-answer-input');
        const practiceAnswerInput = document.getElementById('practice-answer-input');
        if (showAnswerInput) {
            showAnswerInput.value = '';
        }
        if (practiceAnswerInput) {
            practiceAnswerInput.value = '';
        }
        
        // Hide next word button
        const nextWordBtn = document.getElementById('next-word-btn');
        if (nextWordBtn) {
            nextWordBtn.style.display = 'none';
        }
    },
    
    // Check user's answer
    checkAnswer() {
        const answerInput = document.getElementById('answer-input');
        if (!answerInput || !this.currentQuestion) return;
        
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.originalText.toLowerCase();
        
        if (userAnswer === correctAnswer) {
            // Correct answer
            this.currentQuestion.counter = (this.currentQuestion.counter || 0) + 1;
            
            // Check if word should be marked as learned
            if (this.currentQuestion.counter >= 15) {
                // Move to learned words
                const learnedWord = {
                    ...this.currentQuestion,
                    learnedAt: new Date().toISOString()
                };
                App.learnedWords.push(learnedWord);
                App.words = App.words.filter(w => w.id !== this.currentQuestion.id);
                App.showNotification('Word mastered! Moved to learned words.', 'success');
            }
            
        } else {
            // Incorrect answer - subtract 5 points from current score
            this.currentQuestion.counter = Math.max(0, (this.currentQuestion.counter || 0) - 5);
        }
        
        // Save data immediately
        App.saveData();
        
        // Show next word button
        const nextWordBtn = document.getElementById('next-word-btn');
        if (nextWordBtn) {
            nextWordBtn.style.display = 'inline-block';
        }
    },
    
    // Show answer without affecting counter
    showAnswer() {
        if (!this.currentQuestion) return;
        
        // Show answer in the non-functional text field
        const showAnswerInput = document.getElementById('show-answer-input');
        if (showAnswerInput) {
            showAnswerInput.value = this.currentQuestion.originalText;
        }
        
        // Show next word button
        const nextWordBtn = document.getElementById('next-word-btn');
        if (nextWordBtn) {
            nextWordBtn.style.display = 'inline-block';
        }
    },
    
    // Skip current question
    skipQuestion() {
        if (!this.currentQuestion) return;
        
        const feedback = document.getElementById('game-feedback');
        if (feedback) {
            feedback.className = 'game-feedback feedback-incorrect';
            feedback.textContent = `Skipped! The answer was: "${this.currentQuestion.originalText}"`;
            feedback.style.display = 'block';
        }
        
        this.currentStreak = 0;
        this.updateStats();
        
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    },
    
    
    // End the game
    endGame() {
        this.gameActive = false;
        
        // Save data first
        App.saveData();
        
        // Check if all words in database are learned
        const remainingWords = App.words.filter(word => 
            word.databaseId === App.currentDatabase && 
            word.counter < 15
        ).length;
        
        const isDatabaseComplete = remainingWords === 0;
        
        if (isDatabaseComplete) {
            // If database is complete, go directly to learned words module
            App.showNotification('🎉 Congratulations! You have mastered all words in this database!', 'success');
            Navigation.navigateToModule('learned-words');
        } else {
            // If not complete, show game over message
            const gameArea = document.querySelector('.game-area');
            if (!gameArea) return;
            
            let gameOverHTML = `
                <div class="game-question">
                    <div class="question-word">Game Over!</div>
                    <div class="question-instruction">Game session completed!</div>
                </div>
                
                <div class="game-controls">
                    <button class="start-game-btn" onclick="GameModule.startGame()">PLAY AGAIN</button>
                    <button class="btn-view" onclick="Navigation.navigateToModule('view-words')">VIEW WORDS</button>
                    <button class="back-btn" onclick="Navigation.navigateToModule('landing')">BACK TO MENU</button>
                </div>
            `;
            
            gameArea.innerHTML = gameOverHTML;
            App.showNotification('Game session completed!', 'success');
        }
    }
};

// Database Management Module
const DatabaseModule = {
    // Create new database
    createDatabase() {
        const name = prompt('Enter database name:');
        if (!name || name.trim() === '') {
            App.showNotification('Database name cannot be empty', 'error');
            return;
        }
        
        // For now, we'll just show a notification
        // Later this will be integrated with the actual database system
        App.showNotification(`Database "${name}" created successfully!`, 'success');
    },
    
    // Delete database
    deleteDatabase() {
        if (confirm('Are you sure you want to delete this database? This action cannot be undone.')) {
            App.showNotification('Database deleted successfully!', 'success');
        }
    },
    
};

// Import/Export Module
const ImportModule = {
    // Import word list
    importWordList() {
        const wordListTextarea = document.getElementById('word-list');
        if (!wordListTextarea) return;
        
        const words = wordListTextarea.value.split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);
        
        if (words.length === 0) {
            App.showNotification('No words to import', 'error');
            return;
        }
        
        let importedCount = 0;
        let skippedCount = 0;
        
        words.forEach(word => {
            // Check if word already exists
            const existingWord = App.words.find(w => 
                w.originalText.toLowerCase() === word.toLowerCase() || 
                w.translatedText.toLowerCase() === word.toLowerCase()
            );
            
            if (!existingWord) {
                const newWord = {
                    id: Date.now() + Math.random(),
                    english: word,
                    spanish: `[Translation for: ${word}]`,
                    score: 0,
                    attempts: 0,
                    lastPracticed: null,
                    createdAt: new Date().toISOString()
                };
                
                App.words.push(newWord);
                importedCount++;
            } else {
                skippedCount++;
            }
        });
        
        App.saveData();
        App.updateUI();
        
        App.showNotification(
            `Import completed! ${importedCount} words imported, ${skippedCount} skipped.`, 
            'success'
        );
        
        // Clear textarea
        wordListTextarea.value = '';
    },
    
    // Export word list
    exportWordList() {
        if (App.words.length === 0) {
            App.showNotification('No words to export', 'error');
            return;
        }
        
        const wordList = App.words.map(word => word.originalText).join('\n');
        const blob = new Blob([wordList], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'english_words.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        App.showNotification('Word list exported successfully!', 'success');
    }
};
