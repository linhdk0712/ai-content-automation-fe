// Script debug i18n trong browser console
// Chạy script này để kiểm tra trạng thái i18n

console.log('🔍 Debugging i18n status...');

// Check localStorage
const savedLang = localStorage.getItem('preferred-language');
console.log('📱 localStorage language:', savedLang);

// Check browser languages
console.log('🌐 Browser languages:', navigator.languages);

// Check if i18nManager exists
if (window.i18nManager) {
    console.log('✅ i18nManager found');
    console.log('🔤 Current language:', window.i18nManager.getCurrentLanguage());
    console.log('🌍 Supported languages:', window.i18nManager.getSupportedLanguages());

    // Test some translations
    const testKeys = [
        'workflowTimeline.title',
        'workflowTimeline.description',
        'workflow.title',
        'contentCreator.contentGeneration'
    ];

    console.log('🧪 Testing translations:');
    testKeys.forEach(key => {
        const translation = window.i18nManager.t(key);
        console.log(`  ${key}: "${translation}"`);
    });

    // Check if translations are loaded
    console.log('📚 Loaded languages:', Array.from(window.i18nManager.translations?.keys() || []));
} else {
    console.log('❌ i18nManager not found on window object');
}

// Check document language
console.log('📄 Document language:', document.documentElement.lang);
console.log('📄 Document direction:', document.documentElement.dir);

// Check for translation files
console.log('🔍 Testing translation file access...');
fetch('/locales/en.json')
    .then(response => {
        console.log('✅ English translations accessible:', response.ok);
        return response.json();
    })
    .then(data => {
        console.log('📖 English translations loaded:', Object.keys(data));
    })
    .catch(error => {
        console.error('❌ Failed to load English translations:', error);
    });

fetch('/locales/vi.json')
    .then(response => {
        console.log('✅ Vietnamese translations accessible:', response.ok);
        return response.json();
    })
    .then(data => {
        console.log('📖 Vietnamese translations loaded:', Object.keys(data));
    })
    .catch(error => {
        console.error('❌ Failed to load Vietnamese translations:', error);
    });