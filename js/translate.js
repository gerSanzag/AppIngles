// Google Translate Integration
const TranslateService = {
    // API Key for Google Translate (you'll need to get this)
    apiKey: '', // Will be set by user
    
    // Set API key
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('googleTranslate_apiKey', key);
    },
    
    // Load API key from localStorage
    loadApiKey() {
        const savedKey = localStorage.getItem('googleTranslate_apiKey');
        if (savedKey) {
            this.apiKey = savedKey;
        }
    },
    
    // Detect language of text
    async detectLanguage(text) {
        if (!this.apiKey) {
            throw new Error('Google Translate API key not set');
        }
        
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text
            })
        });
        
        const data = await response.json();
        return data.data.detections[0][0].language;
    },
    
    // Translate text with multiple options
    async translateText(text, targetLanguage = 'en', sourceLanguage = 'auto') {
        if (!this.apiKey) {
            throw new Error('Google Translate API key not set');
        }
        
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: targetLanguage,
                source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
                format: 'text'
            })
        });
        
        const data = await response.json();
        return data.data.translations[0];
    },
    
    // Get translation for a word (simplified - only Google Translate)
    async getMultipleTranslations(text, targetLanguage = 'en') {
        try {
            // Detect source language
            const sourceLanguage = await this.detectLanguage(text);
            
            let targetLang;
            if (sourceLanguage === 'en') {
                targetLang = 'es'; // English to Spanish
            } else if (sourceLanguage === 'es') {
                targetLang = 'en'; // Spanish to English
            } else {
                targetLang = 'en'; // Other languages to English
            }
            
            // Get translation from Google Translate only
            const translation = await this.translateText(text, targetLang, sourceLanguage);
            
            // Return single translation (no hardcoded alternatives)
            return [{
                text: translation.translatedText,
                detectedSourceLanguage: sourceLanguage,
                confidence: translation.detectedSourceLanguage ? 1 : 0.8
            }];
            
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('Translation failed: ' + error.message);
        }
    },
    
    
    // Check if API key is set
    hasApiKey() {
        return this.apiKey && this.apiKey.trim() !== '';
    },
    
    // Show API key setup dialog
    showApiKeyDialog() {
        const currentKey = this.apiKey || '';
        const newKey = prompt(
            'Enter your Google Translate API Key:\n\n' +
            'To get an API key:\n' +
            '1. Go to https://console.cloud.google.com/\n' +
            '2. Create a new project or select existing\n' +
            '3. Enable Cloud Translation API\n' +
            '4. Create credentials (API Key)\n' +
            '5. Copy the API key here',
            currentKey
        );
        
        if (newKey !== null) {
            this.setApiKey(newKey.trim());
            App.showNotification('API key saved successfully!', 'success');
            return true;
        }
        return false;
    }
};

// Initialize API key on load
TranslateService.loadApiKey();
