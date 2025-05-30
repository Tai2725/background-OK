'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

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
  Fade,
  Zoom,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { BACKGROUND_STYLES } from 'src/lib/runware';

// ----------------------------------------------------------------------

export function BackgroundStyleSelector({
  selectedStyle,
  onStyleSelect,
  customPrompt,
  onCustomPromptChange,
  disabled = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localPrompt, setLocalPrompt] = useState(customPrompt || '');
  const [promptError, setPromptError] = useState('');
  const textFieldRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sync local prompt with external prop
  useEffect(() => {
    setLocalPrompt(customPrompt || '');
  }, [customPrompt]);



  const handleStyleClick = useCallback((style) => {
    if (!disabled && onStyleSelect) {
      onStyleSelect(style);
      // Tự động cập nhật custom prompt với prompt của style đã chọn
      if (onCustomPromptChange) {
        onCustomPromptChange(style.prompt);
      }
    }
  }, [disabled, onStyleSelect, onCustomPromptChange]);

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

  // Get unique categories - memoized
  const categories = useMemo(() =>
    ['all', ...new Set(BACKGROUND_STYLES.map(style => style.category))],
    []
  );

  // Filter styles by category - memoized
  const filteredStyles = useMemo(() =>
    selectedCategory === 'all'
      ? BACKGROUND_STYLES
      : BACKGROUND_STYLES.filter(style => style.category === selectedCategory),
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

  // Debounced prompt change handler
  const handleCustomPromptChange = useCallback((e) => {
    const value = e.target.value;
    setLocalPrompt(value);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Validate prompt
    if (value.length > 500) {
      setPromptError('Prompt không được vượt quá 500 ký tự');
    } else if (value.trim() && value.trim().length < 10) {
      setPromptError('Prompt phải có ít nhất 10 ký tự');
    } else {
      setPromptError('');
    }

    // Debounce the external callback
    debounceTimeoutRef.current = setTimeout(() => {
      if (onCustomPromptChange) {
        onCustomPromptChange(value);
      }
    }, 300);
  }, [onCustomPromptChange]);

  // Clear prompt handler
  const handleClearPrompt = useCallback(() => {
    setLocalPrompt('');
    setPromptError('');
    if (onCustomPromptChange) {
      onCustomPromptChange('');
    }
  }, [onCustomPromptChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box>
      {/* Style Presets */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Style Background Có Sẵn
        </Typography>

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
                sx={{ cursor: 'pointer' }}
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
                    boxShadow: disabled ? 1 : 3,
                  },
                  opacity: disabled ? 0.6 : 1,
                  boxShadow: selectedStyle?.id === style.id ? 3 : 1,
                }}
              >
                <CardActionArea
                  onClick={() => handleStyleClick(style)}
                  disabled={disabled}
                >
                  <CardContent sx={{ p: 2.5, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                    {/* Header with Category and Selected Indicator */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
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

                      {/* Selected Indicator */}
                      {selectedStyle?.id === style.id && (
                        <Zoom in={true}>
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
                            <Iconify icon="solar:check-bold" width={14} />
                          </Box>
                        </Zoom>
                      )}
                    </Box>

                    {/* Style Name */}
                    <Typography
                      variant="subtitle1"
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
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}
                    >
                      {style.description}
                    </Typography>

                    {/* Prompt Preview */}
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: selectedStyle?.id === style.id ? 'primary.lighter' : 'grey.50',
                        borderRadius: 1,
                        border: 1,
                        borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'grey.200',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: selectedStyle?.id === style.id ? 'primary.main' : 'text.secondary',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Iconify icon="solar:chat-round-bold" width={12} />
                        Prompt:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: selectedStyle?.id === style.id ? 'primary.dark' : 'text.primary',
                          fontSize: '0.75rem',
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
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Custom Prompt */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Hoặc Tùy Chỉnh Prompt
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mô tả chi tiết background bạn muốn tạo bằng tiếng Anh
        </Typography>

        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          rows={4}
          placeholder="Ví dụ: modern minimalist studio background with soft lighting, clean white backdrop, professional photography setup..."
          value={localPrompt}
          onChange={handleCustomPromptChange}
          disabled={disabled}
          error={Boolean(promptError)}
          helperText={promptError || `${localPrompt.length}/500 ký tự`}
          InputProps={{
            endAdornment: localPrompt && (
              <InputAdornment position="end">
                <Tooltip title="Xóa prompt">
                  <IconButton
                    onClick={handleClearPrompt}
                    disabled={disabled}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <Iconify icon="solar:close-circle-bold" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& textarea': {
                resize: 'vertical',
              },
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
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleCustomPromptSubmit}
            disabled={disabled || !localPrompt.trim() || Boolean(promptError)}
            startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            sx={{
              flex: 1,
              py: 1.5,
              fontWeight: 600,
            }}
          >
            Sử Dụng Custom Prompt
          </Button>

          {localPrompt && (
            <Tooltip title="Xóa tất cả">
              <IconButton
                onClick={handleClearPrompt}
                disabled={disabled}
                color="error"
                sx={{
                  border: 1,
                  borderColor: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.lighter',
                  },
                }}
              >
                <Iconify icon="solar:trash-bin-minimalistic-bold" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Tips */}
        <Box sx={{
          p: 3,
          bgcolor: 'info.lighter',
          borderRadius: 2,
          border: 1,
          borderColor: 'info.main',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Iconify icon="solar:lightbulb-bolt-bold" color="info.main" width={20} />
            <Typography variant="subtitle2" sx={{ color: 'info.main', fontWeight: 600 }}>
              Tips cho prompt hiệu quả
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              'Mô tả rõ ràng về màu sắc, ánh sáng, chất liệu',
              'Sử dụng từ khóa như "professional", "clean", "modern"',
              'Tránh các từ phủ định, thay vào đó dùng từ tích cực',
              'Ví dụ: "bright white studio background" thay vì "not dark background"'
            ].map((tip, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'info.main',
                    mt: 0.75,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" color="info.dark">
                  {tip}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Prompt Status Display */}
      {(selectedStyle || localPrompt?.trim()) && (
        <Fade in={true}>
          <Card sx={{
            mt: 3,
            bgcolor: selectedStyle ? 'success.lighter' : 'primary.lighter',
            border: 2,
            borderColor: selectedStyle ? 'success.main' : 'primary.main',
            borderRadius: 2,
            transition: 'all 0.3s ease',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: selectedStyle ? 'success.main' : 'primary.main',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <Iconify
                    icon={selectedStyle ? "solar:check-circle-bold" : "solar:pen-bold"}
                    width={20}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: selectedStyle ? 'success.main' : 'primary.main',
                  }}>
                    {selectedStyle ? `Đã chọn: ${selectedStyle.name}` : 'Custom Prompt'}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        color: 'text.primary',
                        wordBreak: 'break-word',
                      }}
                    >
                      {localPrompt || selectedStyle?.prompt || ''}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {(localPrompt || selectedStyle?.prompt || '').length} ký tự
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* No Selection Display */}
      {!selectedStyle && !localPrompt?.trim() && (
        <Fade in={true}>
          <Card sx={{
            mt: 3,
            bgcolor: 'grey.50',
            border: 2,
            borderColor: 'grey.300',
            borderStyle: 'dashed',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                textAlign: 'center',
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'grey.200',
                    color: 'grey.600',
                  }}
                >
                  <Iconify icon="solar:info-circle-bold" width={30} />
                </Box>
                <Box>
                  <Typography variant="h6" color="text.primary" sx={{ mb: 1, fontWeight: 600 }}>
                    Chưa chọn prompt
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vui lòng chọn một style có sẵn hoặc nhập custom prompt để tiếp tục
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
}
