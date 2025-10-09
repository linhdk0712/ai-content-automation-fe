import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography
} from '@mui/material';

// Default suggestions for each category
const DEFAULT_SUGGESTIONS: Record<string, Array<{value: string, label: string, displayLabel: string}>> = {
  industry: [
    { value: 'technology', label: 'Technology', displayLabel: 'Công nghệ' },
    { value: 'healthcare', label: 'Healthcare', displayLabel: 'Y tế - Sức khỏe' },
    { value: 'finance', label: 'Finance', displayLabel: 'Tài chính - Ngân hàng' },
    { value: 'education', label: 'Education', displayLabel: 'Giáo dục' },
    { value: 'retail', label: 'Retail', displayLabel: 'Bán lẻ' },
    { value: 'food_beverage', label: 'Food & Beverage', displayLabel: 'Thực phẩm & Đồ uống' }
  ],
  content_type: [
    { value: 'blog_post', label: 'Blog Post', displayLabel: 'Bài viết Blog' },
    { value: 'social_media', label: 'Social Media', displayLabel: 'Mạng xã hội' },
    { value: 'video_script', label: 'Video Script', displayLabel: 'Kịch bản Video' },
    { value: 'email_marketing', label: 'Email Marketing', displayLabel: 'Email Marketing' },
    { value: 'product_description', label: 'Product Description', displayLabel: 'Mô tả sản phẩm' },
    { value: 'press_release', label: 'Press Release', displayLabel: 'Thông cáo báo chí' }
  ],
  language: [
    { value: 'vi', label: 'Vietnamese', displayLabel: 'Tiếng Việt' },
    { value: 'en', label: 'English', displayLabel: 'English' },
    { value: 'zh', label: 'Chinese', displayLabel: '中文' },
    { value: 'ja', label: 'Japanese', displayLabel: '日本語' },
    { value: 'ko', label: 'Korean', displayLabel: '한국어' }
  ],
  tone: [
    { value: 'professional', label: 'Professional', displayLabel: 'Chuyên nghiệp' },
    { value: 'friendly', label: 'Friendly', displayLabel: 'Thân thiện' },
    { value: 'casual', label: 'Casual', displayLabel: 'Thoải mái' },
    { value: 'formal', label: 'Formal', displayLabel: 'Trang trọng' },
    { value: 'humorous', label: 'Humorous', displayLabel: 'Hài hước' },
    { value: 'persuasive', label: 'Persuasive', displayLabel: 'Thuyết phục' }
  ],
  target_audience: [
    { value: 'young_adults', label: 'Young Adults', displayLabel: 'Người trẻ (18-35)' },
    { value: 'professionals', label: 'Professionals', displayLabel: 'Chuyên gia' },
    { value: 'students', label: 'Students', displayLabel: 'Sinh viên' },
    { value: 'parents', label: 'Parents', displayLabel: 'Phụ huynh' },
    { value: 'seniors', label: 'Seniors', displayLabel: 'Người cao tuổi' },
    { value: 'entrepreneurs', label: 'Entrepreneurs', displayLabel: 'Doanh nhân' }
  ],
  ai_provider: [
    { value: 'openai', label: 'OpenAI', displayLabel: 'OpenAI (GPT)' },
    { value: 'anthropic', label: 'Anthropic', displayLabel: 'Anthropic (Claude)' },
    { value: 'google', label: 'Google', displayLabel: 'Google (Gemini)' },
    { value: 'microsoft', label: 'Microsoft', displayLabel: 'Microsoft (Copilot)' },
    { value: 'meta', label: 'Meta', displayLabel: 'Meta (Llama)' },
    { value: 'cohere', label: 'Cohere', displayLabel: 'Cohere' }
  ]
};

const PREDEFINED_CATEGORIES = [
  { value: 'industry', label: 'Industry', description: 'Các ngành nghề và lĩnh vực kinh doanh' },
  { value: 'content_type', label: 'Content Type', description: 'Các loại nội dung (video, blog, social post, etc.)' },
  { value: 'language', label: 'Language', description: 'Ngôn ngữ cho nội dung' },
  { value: 'tone', label: 'Tone', description: 'Giọng điệu và phong cách viết' },
  { value: 'target_audience', label: 'Target Audience', description: 'Đối tượng mục tiêu' },
  { value: 'ai_provider', label: 'AI Provider', description: 'Các nhà cung cấp AI (OpenAI, Claude, etc.)' }
];

const ListOfValuesDemo: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        List of Values Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Đây là demo các categories và default values có sẵn trong hệ thống quản lý List of Values.
      </Typography>

      <Grid container spacing={3}>
        {PREDEFINED_CATEGORIES.map((category) => (
          <Grid item xs={12} md={6} key={category.value}>
            <Card>
              <CardHeader
                title={category.label}
                subheader={category.description}
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {DEFAULT_SUGGESTIONS[category.value]?.map((suggestion) => (
                    <Chip
                      key={suggestion.value}
                      label={suggestion.displayLabel}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ListOfValuesDemo;