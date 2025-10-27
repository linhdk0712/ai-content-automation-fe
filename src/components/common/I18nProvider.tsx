import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { i18nManager } from '../../utils/internationalization/i18nManager';

interface I18nProviderProps {
    children: React.ReactNode;
}

const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeI18n = async () => {
            try {
                // Get the current language from the i18n manager
                const currentLanguage = i18nManager.getCurrentLanguage();

                // Load the current language translations
                await i18nManager.loadLanguage(currentLanguage);

                // Also load English as fallback if current language is not English
                if (currentLanguage !== 'en') {
                    await i18nManager.loadLanguage('en');
                }

                setIsLoading(false);
            } catch (err) {
                console.error('Failed to initialize i18n:', err);
                setError('Failed to load translations');
                setIsLoading(false);
            }
        };

        initializeI18n();
    }, []);

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    gap: 2
                }}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Loading translations...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    gap: 2
                }}
            >
                <Typography variant="h6" color="error">
                    {error}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Please refresh the page to try again.
                </Typography>
            </Box>
        );
    }

    return <>{children}</>;
};

export default I18nProvider;