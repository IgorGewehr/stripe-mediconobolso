"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  IconButton,
  alpha,
  Chip,
  Alert
} from '@mui/material';
import {
  Facebook,
  Close,
  CheckCircle,
  Business
} from '@mui/icons-material';

/**
 * Dialog para selecionar uma página do Facebook após OAuth
 */
const FacebookPageSelector = ({
  open,
  onClose,
  pages = [],
  onSelect,
  isLoading = false
}) => {
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id || '');

  const handleConfirm = () => {
    const selectedPage = pages.find(p => p.id === selectedPageId);
    if (selectedPage && onSelect) {
      onSelect(selectedPage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#1877F2',
          color: '#FFFFFF',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Facebook />
          <Typography variant="h6">
            Selecione uma Página
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : pages.length === 0 ? (
          <Alert severity="warning">
            Nenhuma página encontrada. Você precisa ser administrador de pelo menos uma página do Facebook.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Escolha qual página do Facebook você deseja conectar para receber mensagens:
            </Typography>

            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
              >
                {pages.map((page) => (
                  <Box
                    key={page.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      border: `2px solid ${selectedPageId === page.id ? '#1877F2' : '#E5E7EB'}`,
                      bgcolor: selectedPageId === page.id ? alpha('#1877F2', 0.05) : 'transparent',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#1877F2',
                        bgcolor: alpha('#1877F2', 0.05),
                      },
                    }}
                    onClick={() => setSelectedPageId(page.id)}
                  >
                    <FormControlLabel
                      value={page.id}
                      control={
                        <Radio
                          sx={{
                            color: '#1877F2',
                            '&.Mui-checked': { color: '#1877F2' },
                          }}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={2} sx={{ ml: 1 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              bgcolor: alpha('#1877F2', 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Business sx={{ color: '#1877F2' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {page.name}
                            </Typography>
                            {page.category && (
                              <Chip
                                label={page.category}
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  bgcolor: alpha('#1877F2', 0.1),
                                  color: '#1877F2',
                                  fontWeight: 500,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Box>
                ))}
              </RadioGroup>
            </FormControl>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>O que acontece ao conectar:</strong>
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li>Você receberá mensagens do Messenger neste sistema</li>
                <li>Poderá responder diretamente pelo sistema</li>
                <li>Opcionalmente, a IA pode responder automaticamente</li>
              </Box>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedPageId || isLoading}
          startIcon={<CheckCircle />}
          sx={{
            bgcolor: '#1877F2',
            '&:hover': {
              bgcolor: '#166FE5',
            },
          }}
        >
          Conectar Página
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FacebookPageSelector;
