// Game Module
const GameModule = {
    currentQuestion: null,
    gameActive: false,
    currentScore: 0,
    currentStreak: 0,
    
    // Start the game
    startGame() {
        if (App.words.length === 0) {
            App.showNotification('Please add some words first!', 'error');
            return;
        }
        
        this.gameActive = true;
        this.currentScore = 0;
        this.currentStreak = 0;
        
        this.showGameInterface();
        this.nextQuestion();
    },
    
    // Show game interface
    showGameInterface() {
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        gameArea.innerHTML = `
            <div class="game-stats">
                <div class="stat-item">
                    <div class="stat-value" id="current-score">0</div>
                    <div class="stat-label">Score</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="current-streak">0</div>
                    <div class="stat-label">Streak</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="words-remaining">${App.words.length}</div>
                    <div class="stat-label">Remaining</div>
                </div>
            </div>
            
            <div class="game-question" id="game-question">
                <div class="question-word" id="question-word">Loading...</div>
                <div class="question-instruction">Write the English translation</div>
            </div>
            
            <div class="game-answer">
                <input type="text" id="answer-input" placeholder="Type your answer here..." autocomplete="off">
            </div>
            
            <div class="game-feedback" id="game-feedback" style="display: none;"></div>
            
            <div class="game-controls">
                <button class="btn-add" onclick="GameModule.checkAnswer()">CHECK ANSWER</button>
                <button class="btn-view" onclick="GameModule.skipQuestion()">SKIP</button>
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
        if (App.words.length === 0) {
            this.endGame();
            return;
        }
        
        // Select random word
        const randomIndex = Math.floor(Math.random() * App.words.length);
        this.currentQuestion = App.words[randomIndex];
        
        // Update question display
        const questionWord = document.getElementById('question-word');
        if (questionWord) {
            questionWord.textContent = this.currentQuestion.translatedText;
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
    },
    
    // Check user's answer
    checkAnswer() {
        const answerInput = document.getElementById('answer-input');
        if (!answerInput || !this.currentQuestion) return;
        
        const userAnswer = answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuestion.originalText.toLowerCase();
        
        const feedback = document.getElementById('game-feedback');
        if (!feedback) return;
        
        if (userAnswer === correctAnswer) {
            // Correct answer
            this.currentScore += 10;
            this.currentStreak += 1;
            
            feedback.className = 'game-feedback feedback-correct';
            feedback.textContent = `Correct! +10 points (Streak: ${this.currentStreak})`;
            feedback.style.display = 'block';
            
            // Update word score
            this.currentQuestion.score += 10;
            this.currentQuestion.attempts += 1;
            this.currentQuestion.lastPracticed = new Date().toISOString();
            
            // Check if word should be marked as learned
            if (this.currentQuestion.score >= 15) {
                App.learnedWords.push(this.currentQuestion);
                App.words = App.words.filter(w => w.id !== this.currentQuestion.id);
                App.showNotification('Word mastered! Moved to learned words.', 'success');
            }
            
        } else {
            // Incorrect answer
            this.currentScore = Math.max(0, this.currentScore - 5);
            this.currentStreak = 0;
            
            feedback.className = 'game-feedback feedback-incorrect';
            feedback.textContent = `Incorrect! The answer was: "${this.currentQuestion.originalText}" (-5 points)`;
            feedback.style.display = 'block';
            
            this.currentQuestion.attempts += 1;
        }
        
        // Update stats display
        this.updateStats();
        
        // Save data
        App.saveData();
        
        // Move to next question after delay
        setTimeout(() => {
            this.nextQuestion();
        }, 2000);
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
    
    // Update game statistics
    updateStats() {
        const scoreElement = document.getElementById('current-score');
        const streakElement = document.getElementById('current-streak');
        const remainingElement = document.getElementById('words-remaining');
        
        if (scoreElement) {
            scoreElement.textContent = this.currentScore;
        }
        
        if (streakElement) {
            streakElement.textContent = this.currentStreak;
        }
        
        if (remainingElement) {
            remainingElement.textContent = App.words.length;
        }
    },
    
    // End the game
    endGame() {
        this.gameActive = false;
        
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const finalScore = this.currentScore;
        const wordsLearned = App.learnedWords.length;
        
        gameArea.innerHTML = `
            <div class="game-question">
                <div class="question-word">Game Over!</div>
                <div class="question-instruction">Final Score: ${finalScore} points</div>
            </div>
            
            <div class="game-stats">
                <div class="stat-item">
                    <div class="stat-value">${finalScore}</div>
                    <div class="stat-label">Final Score</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${wordsLearned}</div>
                    <div class="stat-label">Words Learned</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${App.words.length}</div>
                    <div class="stat-label">Words Remaining</div>
                </div>
            </div>
            
            <div class="game-controls">
                <button class="start-game-btn" onclick="GameModule.startGame()">PLAY AGAIN</button>
                <button class="btn-view" onclick="Navigation.navigateToModule('view-words')">VIEW WORDS</button>
                <button class="back-btn" onclick="Navigation.navigateToModule('landing')">BACK TO MENU</button>
            </div>
        `;
        
        // Update app stats
        App.gameStats.score = Math.max(App.gameStats.score, finalScore);
        App.gameStats.correct += this.currentScore / 10;
        App.saveData();
        
        App.showNotification(`Game completed! Final score: ${finalScore}`, 'success');
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
