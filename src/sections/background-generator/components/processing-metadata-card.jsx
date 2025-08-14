'use client';

import { useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Collapse,
  Typography,
  CardContent,
  CardActions,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ProcessingMetadataCard({ metadata, sx, ...other }) {
  const [expanded, setExpanded] = useState(false);

  if (!metadata) {
    return null;
  }

  const { analysis = {}, modelSelection = {}, optimizedParams = {} } = metadata;

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ ...sx }} {...other}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h6" component="div">
            Thông tin xử lý
          </Typography>
          <Chip
            label={modelSelection.model || 'Unknown'}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Stack>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Model Selection Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Model được chọn
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={modelSelection.config?.name || 'Unknown Model'}
                color="primary"
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {modelSelection.reason}
              </Typography>
            </Stack>
          </Box>

          {/* Basic Stats */}
          <Stack direction="row" spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Độ phức tạp
              </Typography>
              <Typography variant="body2">{analysis.imageComplexity || 'Medium'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Kích thước
              </Typography>
              <Typography variant="body2">
                {analysis.dimensions
                  ? `${analysis.dimensions[0]}x${analysis.dimensions[1]}`
                  : 'Unknown'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Chi phí ước tính
              </Typography>
              <Typography variant="body2" color="success.main">
                ${(analysis.megapixels * modelSelection.config?.costPerMegapixel || 0).toFixed(3)}
              </Typography>
            </Box>
          </Stack>

          {/* Expandable Details */}
          <Collapse in={expanded}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {/* Image Analysis Details */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Phân tích ảnh
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Loại đối tượng:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analysis.subjectType || 'Unknown'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Độ phức tạp background:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analysis.backgroundComplexity || 'Unknown'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Điều kiện ánh sáng:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {analysis.lightingConditions || 'Unknown'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Độ phức tạp mask:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(analysis.maskComplexity * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              {/* Optimized Parameters */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tham số tối ưu
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Steps:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {optimizedParams.steps || 'N/A'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">CFG Scale:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {optimizedParams.CFGScale || 'N/A'}
                    </Typography>
                  </Stack>
                  {optimizedParams.strength && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Strength:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {optimizedParams.strength}
                      </Typography>
                    </Stack>
                  )}
                  {optimizedParams.maskMargin && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Mask Margin:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {optimizedParams.maskMargin}px
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* Model Configuration */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cấu hình model
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Sử dụng Strength:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {modelSelection.config?.useStrength ? 'Có' : 'Không'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Sử dụng Mask Margin:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {modelSelection.config?.useMaskMargin ? 'Có' : 'Không'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Chi phí/Megapixel:</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${modelSelection.config?.costPerMegapixel || 0}
                    </Typography>
                  </Stack>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Phù hợp cho:
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {modelSelection.config?.bestFor?.map((use, index) => (
                        <Chip
                          key={index}
                          label={use}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          onClick={handleToggle}
          startIcon={<Iconify icon={expanded ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill'} />}
        >
          {expanded ? 'Thu gọn' : 'Xem chi tiết'}
        </Button>
      </CardActions>
    </Card>
  );
}
