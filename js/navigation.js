// Navigation System
const Navigation = {
    // Navigate to a specific module
    navigateToModule(moduleName) {
        console.log('Navigating to:', moduleName);
        
        // Hide all modules
        const modules = document.querySelectorAll('.module');
        modules.forEach(module => {
            module.classList.remove('active');
            module.style.display = 'none';
        });
        
        // Show target module
        const targetModule = document.getElementById(moduleName);
        if (targetModule) {
            targetModule.classList.add('active');
            targetModule.style.display = 'block';
            App.currentModule = moduleName;
            
            console.log('Module activated:', moduleName);
            
            // Update UI for the new module
            App.updateUI();
            
            // Module-specific initialization
            this.initializeModule(moduleName);
        } else {
            console.error('Module not found:', moduleName);
        }
    },
    
    // Initialize module-specific functionality
    initializeModule(moduleName) {
        switch (moduleName) {
            case 'landing':
                this.initializeLanding();
                break;
            case 'add-words':
                this.initializeAddWords();
                break;
            case 'view-words':
                this.initializeViewWords();
                break;
            case 'game':
                this.initializeGame();
                break;
            case 'learned-words':
                this.initializeLearnedWords();
                break;
        }
    },
    
    // Initialize landing page
    initializeLanding() {
        // Landing page is already set up in HTML
        console.log('Landing page initialized');
    },
    
    // Initialize add words module
    initializeAddWords() {
        const wordInput = document.getElementById('word-input');
        if (wordInput) {
            wordInput.focus();
        }
        
        // Clear any previous input
        if (wordInput) {
            wordInput.value = '';
        }
        
        const wordListTextarea = document.getElementById('word-list');
        if (wordListTextarea) {
            wordListTextarea.value = '';
        }
    },
    
    // Initialize view words module
    initializeViewWords() {
        // Display current words
        App.displayWords();
        
        // Clear search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
    },
    
    // Initialize game module
    initializeGame() {
        // Check if there are words to play with
        if (App.words.length === 0) {
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                gameArea.innerHTML = `
                    <div class="game-message">Add some words to start playing</div>
                    <button class="start-game-btn" onclick="Navigation.navigateToModule('add-words')">START GAME</button>
                `;
            }
        } else {
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                gameArea.innerHTML = `
                    <div class="game-message">Ready to start learning!</div>
                    <button class="start-game-btn" onclick="GameModule.startGame()">START GAME</button>
                `;
            }
        }
    },
    
    // Initialize learned words module
    initializeLearnedWords() {
        // Display learned words
        App.displayLearnedWords();
    }
};

// Global navigation function
function navigateToModule(moduleName) {
    Navigation.navigateToModule(moduleName);
}

// Debug function to check module visibility
function debugModules() {
    const modules = document.querySelectorAll('.module');
    console.log('=== MODULE DEBUG ===');
    modules.forEach(module => {
        console.log(`Module ${module.id}:`, {
            display: module.style.display,
            classList: module.classList.toString(),
            visible: module.offsetParent !== null,
            computedDisplay: window.getComputedStyle(module).display
        });
    });
    console.log('Current module:', App.currentModule);
    console.log('Words count:', App.words.length);
}

// Emergency function to force show landing page
function forceShowLanding() {
    console.log('Force showing landing page...');
    const landingModule = document.getElementById('landing');
    if (landingModule) {
        // Hide all modules
        const modules = document.querySelectorAll('.module');
        modules.forEach(module => {
            module.classList.remove('active');
            module.style.display = 'none';
        });
        
        // Show landing
        landingModule.classList.add('active');
        landingModule.style.display = 'block';
        App.currentModule = 'landing';
        
        console.log('Landing page forced to show');
    }
}
