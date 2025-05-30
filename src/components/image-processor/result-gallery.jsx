import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from '../iconify';
import { Image } from '../image';

// ----------------------------------------------------------------------

export function ResultGallery({
  results = [],
  onDownload,
  onDownloadAll,
  onDelete,
  onShare,
  showComparison = true,
}) {
  const [selectedResult, setSelectedResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePreview = (result) => {
    setSelectedResult(result);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedResult(null);
  };

  const handleDownload = async (result) => {
    try {
      const response = await fetch(result.imageURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `processed-${result.filename || 'image'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (onDownload) {
        onDownload(result);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleShare = async (result) => {
    if (navigator.share) {
      try {
        const response = await fetch(result.imageURL);
        const blob = await response.blob();
        const file = new File([blob], `processed-${result.filename || 'image'}.png`, {
          type: blob.type,
        });

        await navigator.share({
          title: 'Processed Image',
          files: [file],
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(result.imageURL);
        // You might want to show a toast notification here
      } catch (error) {
        console.error('Copy to clipboard error:', error);
      }
    }
    
    if (onShare) {
      onShare(result);
    }
  };

  if (results.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Iconify
          icon="solar:gallery-bold-duotone"
          width={64}
          sx={{ mb: 2, opacity: 0.5, color: 'text.secondary' }}
        />
        <Typography variant="h6" color="text.secondary">
          Chưa có kết quả nào
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload và xử lý ảnh để xem kết quả tại đây
        </Typography>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h6">
          Kết quả xử lý ({results.length})
        </Typography>
        
        {results.length > 0 && (
          <Button
            variant="contained"
            onClick={onDownloadAll}
            startIcon={<Iconify icon="solar:download-bold" />}
          >
            Tải tất cả
          </Button>
        )}
      </Box>

      {/* Results Grid */}
      <Grid container spacing={3}>
        {results.map((result, index) => (
          <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card
              sx={{
                position: 'relative',
                overflow: 'hidden',
                '&:hover .overlay': {
                  opacity: 1,
                },
              }}
            >
              {/* Image */}
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '100%', // 1:1 Aspect Ratio
                  cursor: 'pointer',
                }}
                onClick={() => handlePreview(result)}
              >
                <Image
                  src={result.imageURL}
                  alt={result.filename}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Overlay */}
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <IconButton
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    <Iconify icon="solar:eye-bold" />
                  </IconButton>
                </Box>
              </Box>

              {/* Info */}
              <Box sx={{ p: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.filename}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {result.operation && (
                      <Chip
                        label={result.operation}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                    
                    {result.cost && (
                      <Chip
                        label={`$${result.cost.toFixed(4)}`}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                    )}
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <Tooltip title="Tải xuống">
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(result)}
                    >
                      <Iconify icon="solar:download-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Chia sẻ">
                    <IconButton
                      size="small"
                      onClick={() => handleShare(result)}
                    >
                      <Iconify icon="solar:share-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Xem chi tiết">
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(result)}
                    >
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </Tooltip>

                  {onDelete && (
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(result)}
                      >
                        <Iconify icon="solar:trash-bin-minimalistic-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedResult && (
            <Box>
              {/* Image Preview */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: '70vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                }}
              >
                <Image
                  src={selectedResult.imageURL}
                  alt={selectedResult.filename}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              </Box>

              {/* Details */}
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {selectedResult.filename}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {selectedResult.operation && (
                    <Chip
                      label={selectedResult.operation}
                      variant="outlined"
                      color="primary"
                    />
                  )}
                  
                  {selectedResult.cost && (
                    <Chip
                      label={`Chi phí: $${selectedResult.cost.toFixed(4)}`}
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                </Box>

                {selectedResult.processingTime && (
                  <Typography variant="body2" color="text.secondary">
                    Thời gian xử lý: {selectedResult.processingTime}ms
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePreview}>
            Đóng
          </Button>
          
          {selectedResult && (
            <>
              <Button
                onClick={() => handleShare(selectedResult)}
                startIcon={<Iconify icon="solar:share-bold" />}
              >
                Chia sẻ
              </Button>
              
              <Button
                variant="contained"
                onClick={() => handleDownload(selectedResult)}
                startIcon={<Iconify icon="solar:download-bold" />}
              >
                Tải xuống
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
