'use client';

import { useState, useMemo } from 'react';

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
  Fade,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  Divider,
  alpha,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { BACKGROUND_STYLES } from 'src/lib/runware';

// ----------------------------------------------------------------------

export function StyleSelectionPanel({
  selectedStyle,
  customPrompt,
  onStyleSelect,
  onCustomPromptChange,
  onEnhancePrompt,
  disabled = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedAccordion, setExpandedAccordion] = useState('presets');
  const [localPrompt, setLocalPrompt] = useState(customPrompt || '');

  // Get unique categories
  const categories = useMemo(() =>
    ['all', ...new Set(BACKGROUND_STYLES.map(style => style.category))],
    []
  );

  // Filter styles by category
  const filteredStyles = useMemo(() =>
    selectedCategory === 'all'
      ? BACKGROUND_STYLES.slice(0, 12) // Limit to 12 styles for compact display
      : BACKGROUND_STYLES.filter(style => style.category === selectedCategory).slice(0, 8),
    [selectedCategory]
  );

  const categoryLabels = useMemo(() => ({
    all: 'Tất Cả',
    studio: 'Studio',
    nature: 'Thiên Nhiên',
    interior: 'Nội Thất',
    luxury: 'Sang Trọng',
    natural: 'Tự Nhiên',
  }), []);

  // Handle accordion change
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // Handle style selection
  const handleStyleClick = (style) => {
    if (!disabled && onStyleSelect) {
      onStyleSelect(style);
      // Auto-fill custom prompt
      setLocalPrompt(style.prompt);
      if (onCustomPromptChange) {
        onCustomPromptChange(style.prompt);
      }
    }
  };

  // Handle custom prompt change
  const handlePromptChange = (event) => {
    const value = event.target.value;
    setLocalPrompt(value);
    if (onCustomPromptChange) {
      onCustomPromptChange(value);
    }
    // Clear selected style if user types custom prompt
    if (value.trim() && selectedStyle && onStyleSelect) {
      onStyleSelect(null);
    }
  };

  // Clear prompt
  const handleClearPrompt = () => {
    setLocalPrompt('');
    if (onCustomPromptChange) {
      onCustomPromptChange('');
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: (theme) => `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            p: 3,
            color: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Iconify icon="solar:palette-bold-duotone" width={24} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Chọn Style Background
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Chọn từ thư viện hoặc tùy chỉnh prompt của riêng bạn
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Style Presets Accordion */}
          <Accordion
            expanded={expandedAccordion === 'presets'}
            onChange={handleAccordionChange('presets')}
            sx={{
              mb: 2,
              borderRadius: 2,
              '&:before': { display: 'none' },
              boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.grey[500], 0.1)}`,
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              sx={{
                borderRadius: 2,
                '&.Mui-expanded': {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <Iconify icon="solar:gallery-bold" width={20} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Style Có Sẵn
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chọn từ {BACKGROUND_STYLES.length} style được thiết kế sẵn
                  </Typography>
                </Box>
                {selectedStyle && (
                  <Chip
                    label={selectedStyle.name}
                    size="small"
                    color="primary"
                    variant="filled"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Box>
            </AccordionSummary>

          <AccordionDetails sx={{ p: 3 }}>
            {/* Category Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                🏷️ Danh Mục Style
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={categoryLabels[category] || category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    size="medium"
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      fontWeight: 600,
                      px: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Style Grid - Modern */}
            <Grid container spacing={3}>
              {filteredStyles.map((style) => (
                <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={style.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      cursor: disabled ? 'default' : 'pointer',
                      border: 2,
                      borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'transparent',
                      borderRadius: 3,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      background: selectedStyle?.id === style.id
                        ? (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`
                        : 'background.paper',
                      '&:hover': {
                        borderColor: disabled ? 'transparent' : 'primary.main',
                        transform: disabled ? 'none' : 'translateY(-4px)',
                        boxShadow: disabled ? 'none' : (theme) => `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                      },
                      opacity: disabled ? 0.6 : 1,
                      height: 160,
                    }}
                  >
                    {/* Selection Indicator */}
                    {selectedStyle?.id === style.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: 0,
                          height: 0,
                          borderStyle: 'solid',
                          borderWidth: '0 40px 40px 0',
                          borderColor: 'transparent primary.main transparent transparent',
                          zIndex: 1,
                        }}
                      />
                    )}
                    {selectedStyle?.id === style.id && (
                      <Iconify
                        icon="solar:check-circle-bold"
                        width={16}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: 'white',
                          zIndex: 2,
                        }}
                      />
                    )}

                    <CardActionArea
                      onClick={() => handleStyleClick(style)}
                      disabled={disabled}
                      sx={{ height: '100%', p: 2.5 }}
                    >
                      <Stack spacing={1.5} sx={{ height: '100%' }}>
                        {/* Header with Icon */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: selectedStyle?.id === style.id ? 'primary.main' : 'primary.lighter',
                              color: selectedStyle?.id === style.id ? 'white' : 'primary.main',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Iconify icon="solar:magic-stick-3-bold" width={16} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: selectedStyle?.id === style.id ? 'primary.main' : 'text.primary',
                                fontSize: '0.875rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {style.name}
                            </Typography>
                            <Chip
                              label={categoryLabels[style.category] || style.category}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.7rem',
                                height: 18,
                                mt: 0.5,
                                borderRadius: 1,
                              }}
                            />
                          </Box>
                        </Stack>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {style.description}
                        </Typography>

                        {/* Prompt Preview - Modern */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: selectedStyle?.id === style.id
                              ? (theme) => alpha(theme.palette.primary.main, 0.08)
                              : (theme) => alpha(theme.palette.grey[500], 0.08),
                            borderRadius: 2,
                            border: 1,
                            borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'transparent',
                            mt: 'auto',
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            <Iconify
                              icon="solar:code-bold"
                              width={12}
                              color={selectedStyle?.id === style.id ? 'primary.main' : 'text.secondary'}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                color: selectedStyle?.id === style.id ? 'primary.main' : 'text.secondary',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            >
                              Prompt
                            </Typography>
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{
                              color: selectedStyle?.id === style.id ? 'primary.dark' : 'text.primary',
                              fontSize: '0.7rem',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontFamily: 'monospace',
                            }}
                          >
                            {style.prompt}
                          </Typography>
                        </Paper>
                      </Stack>
                    </CardActionArea>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

          {/* Custom Prompt Accordion */}
          <Accordion
            expanded={expandedAccordion === 'custom'}
            onChange={handleAccordionChange('custom')}
            sx={{
              borderRadius: 2,
              '&:before': { display: 'none' },
              boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.grey[500], 0.1)}`,
            }}
          >
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              sx={{
                borderRadius: 2,
                '&.Mui-expanded': {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'secondary.lighter',
                    color: 'secondary.main',
                  }}
                >
                  <Iconify icon="solar:pen-new-square-bold" width={20} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Tùy Chỉnh Prompt
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Viết prompt chi tiết để tạo background theo ý muốn
                  </Typography>
                </Box>
                {customPrompt?.trim() && !selectedStyle && (
                  <Chip
                    label="Custom"
                    size="small"
                    color="secondary"
                    variant="filled"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  />
                )}
              </Box>
            </AccordionSummary>

          <AccordionDetails sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Prompt Input */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  ✍️ Viết Prompt Của Bạn
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Ví dụ: modern minimalist studio background with soft lighting, clean white backdrop, professional photography setup, high quality, detailed..."
                  value={localPrompt}
                  onChange={handlePromptChange}
                  disabled={disabled}
                  helperText={`${localPrompt.length}/500 ký tự`}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                  InputProps={{
                    endAdornment: localPrompt && (
                      <InputAdornment position="end">
                        <Tooltip title="Xóa prompt">
                          <IconButton
                            onClick={handleClearPrompt}
                            disabled={disabled}
                            size="small"
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                bgcolor: 'error.lighter',
                              },
                            }}
                          >
                            <Iconify icon="solar:close-circle-bold" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Enhance Prompt Button */}
                {localPrompt.trim() && onEnhancePrompt && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      const enhanced = onEnhancePrompt(localPrompt);
                      setLocalPrompt(enhanced);
                    }}
                    startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ✨ Tăng Cường Prompt
                  </Button>
                )}
              </Box>

              {/* Quick Suggestions */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  💡 Gợi Ý Nhanh
                </Typography>
                <Grid container spacing={1}>
                  {[
                    { text: 'professional studio background', color: 'primary' },
                    { text: 'modern minimalist backdrop', color: 'secondary' },
                    { text: 'soft gradient background', color: 'info' },
                    { text: 'luxury elegant setting', color: 'warning' },
                    { text: 'natural outdoor environment', color: 'success' },
                    { text: 'abstract artistic background', color: 'error' },
                  ].map((suggestion) => (
                    <Grid item key={suggestion.text}>
                      <Chip
                        label={suggestion.text}
                        size="medium"
                        variant="outlined"
                        color={suggestion.color}
                        onClick={() => {
                          setLocalPrompt(suggestion.text);
                          if (onCustomPromptChange) {
                            onCustomPromptChange(suggestion.text);
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette[suggestion.color].main, 0.2)}`,
                          },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Advanced Tips */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'info.lighter',
                      color: 'info.main',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon="solar:lightbulb-bold" width={20} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'info.main' }}>
                      Mẹo Viết Prompt Hiệu Quả
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        • Mô tả chi tiết về môi trường, ánh sáng, màu sắc
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Sử dụng từ khóa chất lượng: "high quality", "detailed", "professional"
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Tránh từ phủ định, thay vào đó mô tả điều bạn muốn
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Độ dài tối ưu: 50-200 ký tự cho kết quả tốt nhất
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </AccordionDetails>
        </Accordion>

          {/* Selection Status */}
          {(selectedStyle || customPrompt?.trim()) && (
            <Fade in={true}>
              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 3,
                  background: selectedStyle
                    ? (theme) => `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`
                    : (theme) => `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
                  border: 2,
                  borderColor: selectedStyle ? 'success.main' : 'secondary.main',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative Element */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 100,
                    height: 100,
                    background: selectedStyle
                      ? (theme) => `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.1)} 0%, transparent 70%)`
                      : (theme) => `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
                    transform: 'translate(30px, -30px)',
                  }}
                />

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: selectedStyle ? 'success.main' : 'secondary.main',
                      color: 'white',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Iconify
                      icon={selectedStyle ? "solar:check-circle-bold" : "solar:pen-new-square-bold"}
                      width={24}
                    />
                  </Box>
                  <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: selectedStyle ? 'success.main' : 'secondary.main',
                        mb: 0.5,
                      }}
                    >
                      {selectedStyle ? `✨ Đã chọn: ${selectedStyle.name}` : '🎨 Custom Prompt'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStyle
                        ? 'Style background đã được chọn và sẵn sàng để tạo'
                        : 'Prompt tùy chỉnh đã được thiết lập'
                      }
                    </Typography>
                    {(selectedStyle || customPrompt?.trim()) && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          Prompt sẽ được sử dụng:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            color: 'text.primary',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {selectedStyle?.prompt || customPrompt}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Fade>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
