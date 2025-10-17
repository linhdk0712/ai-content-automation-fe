// Script để reset ngôn ngữ về English và clear cache
// Chạy script này trong browser console để debug language issues

console.log('🔄 Resetting language to English...');

// Clear localStorage language setting
localStorage.removeItem('preferred-language');
console.log('✅ Cleared localStorage language setting');

// Force set to English
localStorage.setItem('preferred-language', 'en');
console.log('✅ Set language to English in localStorage');

// Clear any cached translations
if (window.i18nManager) {
    console.log('🔄 Clearing translation cache...');
    // Force reload English translations
    window.i18nManager.changeLanguage('en').then(() => {
        console.log('✅ Language changed to English');
        window.location.reload();
    }).catch(error => {
        console.error('❌ Failed to change language:', error);
    });
} else {
    console.log('⚠️ i18nManager not found, reloading page...');
    window.location.reload();
}