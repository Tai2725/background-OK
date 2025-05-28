'use client';

import { useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Button,
  TextField,
  Typography,
  CardContent,
  CardActionArea,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { BACKGROUND_STYLES } from 'src/lib/runware';

// ----------------------------------------------------------------------

// Helper function to get category icon
const getCategoryIcon = (category) => {
  const iconMap = {
    studio: 'solar:camera-bold-duotone',
    nature: 'solar:leaf-bold-duotone',
    interior: 'solar:home-bold-duotone',
    luxury: 'solar:crown-bold-duotone',
    natural: 'solar:tree-bold-duotone',
  };
  return iconMap[category] || 'solar:gallery-bold-duotone';
};

export function BackgroundStyleSelector({
  selectedStyle,
  onStyleSelect,
  customPrompt,
  onCustomPromptChange,
  disabled = false,
}) {
  const [expandedAccordion, setExpandedAccordion] = useState('presets');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const handleStyleClick = (style) => {
    if (!disabled && onStyleSelect) {
      onStyleSelect(style);
    }
  };

  const handleCustomPromptSubmit = () => {
    if (customPrompt.trim() && onStyleSelect) {
      onStyleSelect({
        id: 'custom',
        name: 'Custom Prompt',
        prompt: customPrompt.trim(),
        category: 'custom',
      });
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(BACKGROUND_STYLES.map(style => style.category))];

  // Filter styles by category
  const filteredStyles = selectedCategory === 'all'
    ? BACKGROUND_STYLES
    : BACKGROUND_STYLES.filter(style => style.category === selectedCategory);

  const categoryLabels = {
    all: 'Tất Cả',
    studio: 'Studio',
    nature: 'Thiên Nhiên',
    interior: 'Nội Thất',
    luxury: 'Sang Trọng',
    natural: 'Tự Nhiên',
  };

  return (
    <Box>
      {/* Style Presets */}
      <Accordion
        expanded={expandedAccordion === 'presets'}
        onChange={handleAccordionChange('presets')}
        defaultExpanded
      >
        <AccordionSummary expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:palette-bold-duotone" />
            <Typography variant="h6">Style Có Sẵn</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* Category Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Danh Mục:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={categoryLabels[category] || category}
                  variant={selectedCategory === category ? 'filled' : 'outlined'}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Style Grid */}
          <Grid container spacing={2}>
            {filteredStyles.map((style) => (
              <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={style.id}>
                <Card
                  sx={{
                    cursor: disabled ? 'default' : 'pointer',
                    border: 2,
                    borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: disabled ? 'transparent' : 'primary.light',
                      transform: disabled ? 'none' : 'translateY(-2px)',
                    },
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  <CardActionArea
                    onClick={() => handleStyleClick(style)}
                    disabled={disabled}
                  >
                    {/* Style Label Content */}
                    <CardContent sx={{ p: 3, minHeight: 160 }}>
                      {/* Header with Category and Selected Indicator */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Iconify
                            icon={getCategoryIcon(style.category)}
                            width={24}
                            sx={{
                              color: selectedStyle?.id === style.id ? 'primary.main' : 'text.secondary',
                              transition: 'color 0.3s ease',
                            }}
                          />
                          <Chip
                            label={categoryLabels[style.category] || style.category}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              color: selectedStyle?.id === style.id ? 'primary.main' : 'text.secondary',
                              borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'grey.300',
                            }}
                          />
                        </Box>

                        {/* Selected Indicator */}
                        {selectedStyle?.id === style.id && (
                          <Box
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify icon="solar:check-bold" width={16} />
                          </Box>
                        )}
                      </Box>

                      {/* Style Name */}
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: selectedStyle?.id === style.id ? 'primary.main' : 'text.primary',
                          transition: 'color 0.3s ease',
                        }}
                      >
                        {style.name}
                      </Typography>

                      {/* Style Description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.875rem',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {style.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Prompt */}
      <Accordion
        expanded={expandedAccordion === 'custom'}
        onChange={handleAccordionChange('custom')}
        sx={{ mt: 2 }}
      >
        <AccordionSummary expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:pen-bold-duotone" />
            <Typography variant="h6">Custom Prompt</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Mô tả chi tiết background bạn muốn tạo bằng tiếng Anh
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Ví dụ: modern minimalist studio background with soft lighting, clean white backdrop, professional photography setup..."
              value={customPrompt}
              onChange={(e) => onCustomPromptChange?.(e.target.value)}
              disabled={disabled}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              onClick={handleCustomPromptSubmit}
              disabled={disabled || !customPrompt.trim()}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            >
              Sử Dụng Custom Prompt
            </Button>

            {/* Tips */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.main' }}>
                💡 Tips cho prompt tốt:
              </Typography>
              <Typography variant="caption" color="info.dark" component="div">
                • Mô tả rõ ràng về màu sắc, ánh sáng, chất liệu
                <br />
                • Sử dụng từ khóa như "professional", "clean", "modern"
                <br />
                • Tránh các từ phủ định, thay vào đó dùng từ tích cực
                <br />
                • Ví dụ: "bright white studio background" thay vì "not dark background"
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Selected Style Display */}
      {selectedStyle && (
        <Card sx={{ mt: 3, bgcolor: 'primary.lighter' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Iconify icon="solar:check-circle-bold" sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="subtitle2" color="primary.main">
                  Đã chọn: {selectedStyle.name}
                </Typography>
                <Typography variant="caption" color="primary.dark">
                  Prompt: {selectedStyle.prompt}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
