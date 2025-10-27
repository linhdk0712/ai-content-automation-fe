import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { generateContentId } from '../../utils/uuid';
import { useI18n } from '../../hooks/useI18n';

interface SendToWorkflowButtonProps {
    content: string;
    title?: string;
    metadata?: {
        industry?: string;
        contentType?: string;
        language?: string;
        tone?: string;
        targetAudience?: string;
        [key: string]: any;
    };
    contentId?: number;
    variant?: 'contained' | 'outlined' | 'text';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    disabled?: boolean;
    onSuccess?: (runId: string) => void;
    onError?: (error: Error) => void;
    onStart?: () => void;
    onFinish?: () => void;
}

const SendToWorkflowButton: React.FC<SendToWorkflowButtonProps> = ({
    content,
    title,
    metadata,
    contentId,
    variant = 'contained',
    size = 'medium',
    fullWidth = false,
    disabled = false,
    onSuccess,
    onError,
    onStart,
    onFinish
}) => {
    const { t } = useI18n();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSendToWorkflow = async () => {
        if (!content?.trim()) {
            const error = new Error(t('sendToWorkflow.noContentError'));
            onError?.(error);
            return;
        }

        setIsProcessing(true);
        onStart?.();

        try {
            const workflowData = {
                title: title || 'Generated Content',
                input: content,
                metadata: {
                    industry: metadata?.industry,
                    contentType: metadata?.contentType,
                    language: metadata?.language,
                    tone: metadata?.tone,
                    targetAudience: metadata?.targetAudience,
                    ...metadata
                }
            };

            // Use existing content ID or generate a new one
            const workflowContentId = contentId || generateContentId();
            console.log('Using content ID for workflow:', workflowContentId);

            const run = await triggerAiAvatarWorkflow(workflowContentId, workflowData);

            onSuccess?.(run.id?.toString() || run.runId);

            // Navigate to workflow run page after a short delay
            setTimeout(() => {
                window.location.href = `/workflows/run/${run.id}`;
            }, 1500);
        } catch (error) {
            console.error('Failed to send to workflow:', error);
            onError?.(error instanceof Error ? error : new Error('Unknown error'));
        } finally {
            setIsProcessing(false);
            onFinish?.();
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <Send />}
            onClick={handleSendToWorkflow}
            disabled={disabled || isProcessing || !content?.trim()}
            sx={{
                borderRadius: 2,
                fontWeight: 600,
                ...(variant === 'contained' && {
                    bgcolor: 'primary.main',
                    '&:hover': {
                        bgcolor: 'primary.dark',
                    }
                })
            }}
        >
            {isProcessing ? t('sendToWorkflow.sending') : t('sendToWorkflow.sendToWorkflow')}
        </Button>
    );
};

export default SendToWorkflowButton;