import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { i18nManager } from '../../utils/internationalization/i18nManager';
import { useI18n } from '../../hooks/useI18n';

const I18nDebug: React.FC = () => {
    const { t, currentLanguage, supportedLanguages } = useI18n();
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [testResults, setTestResults] = useState<any>({});

    useEffect(() => {
        const updateDebugInfo = () => {
            setDebugInfo({
                currentLanguage: i18nManager.getCurrentLanguage(),
                supportedLanguages: i18nManager.getSupportedLanguages(),
                isRTL: i18nManager.isRTL(),
                browserLanguages: navigator.languages,
                localStorage: localStorage.getItem('preferred-language'),
            });
        };

        updateDebugInfo();
        const interval = setInterval(updateDebugInfo, 1000);
        return () => clearInterval(interval);
    }, []);

    const testTranslations = async () => {
        const testKeys = [
            'contentCreator.contentGeneration',
            'contentCreator.contentSettings',
            'contentCreator.styleAndLanguage',
            'contentCreator.targetAudience',
            'contentCreator.readyToGenerate',
            'common.create',
            'common.content'
        ];

        const results: any = {};

        for (const key of testKeys) {
            results[key] = {
                translation: t(key),
                isTranslated: t(key) !== key
            };
        }

        setTestResults(results);
    };

    const testLanguageLoad = async (lang: string) => {
        try {
            console.log(`Testing language load for: ${lang}`);
            await i18nManager.loadLanguage(lang);
            console.log(`Successfully loaded: ${lang}`);

            // Test a few translations
            const testKey = 'contentCreator.contentGeneration';
            const translation = i18nManager.t(testKey);
            console.log(`Test translation for ${testKey}: ${translation}`);

            alert(`Language ${lang} loaded successfully. Test translation: ${translation}`);
        } catch (error) {
            console.error(`Failed to load language ${lang}:`, error);
            alert(`Failed to load language ${lang}: ${error}`);
        }
    };

    return (
        <Box sx={{ p: 2, maxWidth: 800 }}>
            <Typography variant="h6" gutterBottom>
                i18n Debug Information
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Current State
                </Typography>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Language Tests
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {supportedLanguages.map((lang) => (
                        <Button
                            key={lang.code}
                            variant="outlined"
                            size="small"
                            onClick={() => testLanguageLoad(lang.code)}
                        >
                            Test {lang.code}
                        </Button>
                    ))}
                </Box>
                <Button variant="contained" onClick={testTranslations}>
                    Test Current Translations
                </Button>
            </Paper>

            {Object.keys(testResults).length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Translation Test Results
                    </Typography>
                    {Object.entries(testResults).map(([key, result]: [string, any]) => (
                        <Alert
                            key={key}
                            severity={result.isTranslated ? 'success' : 'error'}
                            sx={{ mb: 1 }}
                        >
                            <strong>{key}:</strong> {result.translation}
                        </Alert>
                    ))}
                </Paper>
            )}

            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Sample Translations
                </Typography>
                <Typography>contentCreator.contentGeneration: {t('contentCreator.contentGeneration')}</Typography>
                <Typography>contentCreator.contentSettings: {t('contentCreator.contentSettings')}</Typography>
                <Typography>contentCreator.styleAndLanguage: {t('contentCreator.styleAndLanguage')}</Typography>
                <Typography>contentCreator.targetAudience: {t('contentCreator.targetAudience')}</Typography>
                <Typography>common.create: {t('common.create')}</Typography>
            </Paper>
        </Box>
    );
};

export default I18nDebug;