'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Fade,
  alpha,
  Stack,
  Button,
  TextField,
  useTheme,
  Typography,
  IconButton,
  CardContent,
  CardActionArea,
  InputAdornment,
} from '@mui/material';
import { BACKGROUND_STYLES } from 'src/lib/constants/background-styles';

import { Iconify } from 'src/components/iconify';

import styles from './background-style-selector.module.css';

// ----------------------------------------------------------------------

export function BackgroundStyleSelector({
  selectedStyle,
  onStyleSelect,
  customPrompt,
  onCustomPromptChange,
  disabled = false,
}) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [localPrompt, setLocalPrompt] = useState(customPrompt || '');
  const [promptError, setPromptError] = useState('');
  const textFieldRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Sync local prompt with external prop
  useEffect(() => {
    setLocalPrompt(customPrompt || '');
  }, [customPrompt]);

  const handleStyleClick = useCallback(
    (style) => {
      if (!disabled && onStyleSelect) {
        onStyleSelect(style);
        // Tự động cập nhật custom prompt với prompt của style đã chọn
        if (onCustomPromptChange) {
          onCustomPromptChange(style.prompt);
        }
      }
    },
    [disabled, onStyleSelect, onCustomPromptChange]
  );

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
  const categories = useMemo(
    () => ['all', ...new Set(BACKGROUND_STYLES.map((style) => style.category))],
    []
  );

  // Filter styles by category - memoized
  const filteredStyles = useMemo(
    () =>
      selectedCategory === 'all'
        ? BACKGROUND_STYLES
        : BACKGROUND_STYLES.filter((style) => style.category === selectedCategory),
    [selectedCategory]
  );

  const categoryLabels = useMemo(
    () => ({
      all: 'Tất Cả',
      studio: 'Studio',
      nature: 'Tự Nhiên',
      luxury: 'Sang Trọng',
      technology: 'Công Nghệ',
      fantasy: 'Huyền Bí',
      interior: 'Nội Thất',
    }),
    []
  );

  // Debounced prompt change handler
  const handleCustomPromptChange = useCallback(
    (e) => {
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
    },
    [onCustomPromptChange]
  );

  // Clear prompt handler
  const handleClearPrompt = useCallback(() => {
    setLocalPrompt('');
    setPromptError('');
    if (onCustomPromptChange) {
      onCustomPromptChange('');
    }
  }, [onCustomPromptChange]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    },
    []
  );

  return (
    <Box>
      {/* Ultra Compact Header */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
            🎨 Chọn Style Background
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filteredStyles.length} styles
          </Typography>
        </Stack>

        {/* Compact Category Filter */}
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={categoryLabels[category] || category}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              color={selectedCategory === category ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(category)}
              size="small"
              sx={{
                cursor: 'pointer',
                fontSize: '0.75rem',
                height: 28,
                fontWeight: selectedCategory === category ? 600 : 500,
                '&:hover': {
                  bgcolor: selectedCategory === category ? 'primary.main' : 'primary.lighter',
                },
              }}
            />
          ))}
        </Box>

        {/* Quick Stats */}
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Chọn style có sẵn hoặc tự tạo prompt bên dưới
        </Typography>
      </Box>

      {/* Ultra Compact Style Grid */}
      <Box className={styles.styleGrid}>
        {filteredStyles.map((style) => (
          <Box key={style.id}>
              <Card
                className={styles.styleCard}
                sx={{
                  cursor: disabled ? 'default' : 'pointer',
                  border: 1.5,
                  borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: disabled ? 'grey.300' : 'primary.main',
                    boxShadow: disabled ? 1 : 3,
                  },
                  opacity: disabled ? 0.6 : 1,
                  boxShadow: selectedStyle?.id === style.id ? 3 : 0.5,
                  bgcolor: selectedStyle?.id === style.id ? 'primary.lighter' : 'background.paper',
                }}
              >
                <CardActionArea onClick={() => handleStyleClick(style)} disabled={disabled} sx={{ height: '100%' }}>
                  <CardContent className={styles.cardContent}>
                    {/* Compact Header */}
                    <Box className={styles.cardHeader}>
                      <Chip
                        label={categoryLabels[style.category] || style.category}
                        size="small"
                        variant="outlined"
                        color={selectedStyle?.id === style.id ? 'primary' : 'default'}
                        sx={{
                          fontSize: '0.65rem',
                          height: 18,
                          fontWeight: 500,
                          '& .MuiChip-label': { px: 0.5 },
                        }}
                      />

                      {/* Minimal Selected Indicator */}
                      {selectedStyle?.id === style.id && (
                        <Box
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="solar:check-bold" width={12} />
                        </Box>
                      )}
                    </Box>

                    {/* Compact Style Name */}
                    <Typography
                      variant="subtitle2"
                      className={styles.cardTitle}
                      sx={{
                        color: selectedStyle?.id === style.id ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {style.name}
                    </Typography>

                    {/* Ultra Compact Description */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      className={styles.cardDescription}
                    >
                      {style.description}
                    </Typography>

                    {/* Minimal Prompt Preview */}
                    <Box
                      className={styles.promptPreview}
                      sx={{
                        bgcolor: selectedStyle?.id === style.id ? alpha(theme.palette.primary.main, 0.1) : 'grey.50',
                        borderColor: selectedStyle?.id === style.id ? 'primary.main' : 'grey.300',
                      }}
                    >
                      <Typography
                        variant="caption"
                        className={styles.promptText}
                        sx={{
                          color: selectedStyle?.id === style.id ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        {style.prompt.split(',').slice(0, 3).join(', ')}...
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
      </Box>

      {/* Ultra Compact Custom Prompt */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          borderRadius: 2,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:pen-bold" width={12} sx={{ color: 'white' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
            ✏️ Tự Tạo Mô Tả
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            (Tiếng Anh)
          </Typography>
        </Stack>

        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          rows={2.5}
          placeholder="golden sand beach, soft sunlight, crystal water..."
          value={localPrompt}
          onChange={handleCustomPromptChange}
          disabled={disabled}
          error={Boolean(promptError)}
          helperText={promptError || `${localPrompt.length}/500`}
          slotProps={{
            input: {
              endAdornment: localPrompt && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearPrompt}
                    disabled={disabled}
                    size="small"
                    sx={{ mr: -0.5 }}
                  >
                    <Iconify icon="solar:close-circle-bold" width={16} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.paper',
              fontSize: '0.875rem',
              '& textarea': {
                resize: 'vertical',
                fontSize: '0.875rem',
              },
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              },
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.7rem',
              margin: '4px 0 0 0',
            },
          }}
        />

        {/* Compact Action Button */}
        {localPrompt.trim() && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleCustomPromptSubmit}
            disabled={disabled || Boolean(promptError)}
            startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            sx={{
              py: 1.2,
              mb: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              fontSize: '0.875rem',
              height: 40,
            }}
          >
            ✨ Sử Dụng Mô Tả Này
          </Button>
        )}

        {/* Ultra Compact Tips */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: alpha(theme.palette.info.main, 0.03),
            borderRadius: 1.5,
            border: 0.5,
            borderColor: alpha(theme.palette.info.main, 0.15),
          }}
        >
          <Typography variant="caption" sx={{ color: 'info.main', fontWeight: 600, mb: 0.75, display: 'block', fontSize: '0.7rem' }}>
            💡 Tips: Dùng từ khóa đơn giản như "golden sand", "soft lighting", "crystal water"
          </Typography>
        </Box>
      </Box>

      {/* Ultra Compact Status Display */}
      {(selectedStyle || localPrompt?.trim()) && (
        <Fade in>
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: selectedStyle ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.primary.main, 0.08),
              border: 1,
              borderColor: selectedStyle ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.primary.main, 0.3),
              borderRadius: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: selectedStyle ? 'success.main' : 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon={selectedStyle ? 'solar:check-circle-bold' : 'solar:pen-bold'}
                  width={12}
                  sx={{ color: 'white' }}
                />
              </Box>
              <Typography
                variant="caption"
                fontWeight={600}
                color={selectedStyle ? 'success.main' : 'primary.main'}
                sx={{ fontSize: '0.75rem' }}
              >
                {selectedStyle ? `✓ ${selectedStyle.name}` : '✏️ Custom'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem', ml: 'auto' }}
              >
                {(localPrompt || selectedStyle?.prompt || '').length} chars
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                lineHeight: 1.4,
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {(localPrompt || selectedStyle?.prompt || '').substring(0, 100)}...
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Minimal No Selection Display */}
      {!selectedStyle && !localPrompt?.trim() && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: alpha(theme.palette.grey[100], 0.5),
            border: 0.5,
            borderColor: 'grey.300',
            borderStyle: 'dashed',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            👆 Chọn style hoặc viết mô tả để tiếp tục
          </Typography>
        </Box>
      )}
    </Box>
  );
}
