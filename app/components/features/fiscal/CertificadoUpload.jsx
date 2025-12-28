'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Security as SecurityIcon,
  CheckCircle as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CloudUpload as CloudIcon,
} from '@mui/icons-material';
import { useCertificados } from '../../hooks/useNfse';

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Status badge color
const getStatusColor = (status) => {
  switch (status) {
    case 'valido':
      return 'success';
    case 'expirando':
      return 'warning';
    case 'atencao':
      return 'info';
    case 'expirado':
      return 'error';
    default:
      return 'default';
  }
};

// Status label
const getStatusLabel = (status) => {
  switch (status) {
    case 'valido':
      return 'Valido';
    case 'expirando':
      return 'Expirando em breve';
    case 'atencao':
      return 'Atenção';
    case 'expirado':
      return 'Expirado';
    default:
      return status;
  }
};

// Upload Dialog Component
function UploadDialog({ open, onClose, onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [usoPrincipal, setUsoPrincipal] = useState('nfse');
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);

  const { validate, isValidating } = useCertificados();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.pfx') && !selectedFile.name.endsWith('.p12')) {
        setError('Arquivo deve ser um certificado .pfx ou .p12');
        return;
      }
      setFile(selectedFile);
      setValidationResult(null);
      setError(null);
    }
  };

  const handleValidate = async () => {
    if (!file || !password) {
      setError('Informe o arquivo e a senha');
      return;
    }

    try {
      setError(null);
      const result = await validate({ file, password });
      setValidationResult(result);
      if (!result.valido && result.erros?.length > 0) {
        setError(result.erros.join(', '));
      }
    } catch (err) {
      setError(err.message || 'Erro ao validar certificado');
    }
  };

  const handleUpload = async () => {
    if (!file || !password) {
      setError('Informe o arquivo e a senha');
      return;
    }

    try {
      await onUpload({ file, password, usoPrincipal });
      handleClose();
    } catch (err) {
      setError(err.message || 'Erro ao fazer upload do certificado');
    }
  };

  const handleClose = () => {
    setFile(null);
    setPassword('');
    setUsoPrincipal('nfse');
    setValidationResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload de Certificado Digital</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              border: '2px dashed',
              borderColor: file ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' },
            }}
            onClick={() => document.getElementById('cert-file-input').click()}
          >
            <input
              id="cert-file-input"
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <CloudIcon sx={{ fontSize: 48, color: file ? 'primary.main' : 'grey.400' }} />
            <Typography variant="body1" sx={{ mt: 1 }}>
              {file ? file.name : 'Clique para selecionar o arquivo .pfx'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Certificado digital A1 (arquivo .pfx ou .p12)
            </Typography>
          </Box>

          <TextField
            label="Senha do Certificado"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />

          <FormControl fullWidth>
            <InputLabel>Uso Principal</InputLabel>
            <Select
              value={usoPrincipal}
              label="Uso Principal"
              onChange={(e) => setUsoPrincipal(e.target.value)}
            >
              <MenuItem value="nfse">NFSe - Nota Fiscal de Servico</MenuItem>
              <MenuItem value="tiss">TISS - Convenios</MenuItem>
              <MenuItem value="prescricao">Prescricao Digital</MenuItem>
              <MenuItem value="geral">Uso Geral</MenuItem>
            </Select>
          </FormControl>

          {validationResult && validationResult.valido && (
            <Alert severity="success" icon={<ValidIcon />}>
              <Typography variant="subtitle2">Certificado Valido</Typography>
              <Typography variant="body2">
                <strong>Titular:</strong> {validationResult.common_name}
              </Typography>
              <Typography variant="body2">
                <strong>Documento:</strong> {validationResult.documento}
              </Typography>
              <Typography variant="body2">
                <strong>Emissor:</strong> {validationResult.emissor}
              </Typography>
              <Typography variant="body2">
                <strong>Validade:</strong> {formatDate(validationResult.data_emissao)} ate{' '}
                {formatDate(validationResult.data_expiracao)}
              </Typography>
              <Typography variant="body2">
                <strong>Dias restantes:</strong> {validationResult.dias_restantes}
              </Typography>
            </Alert>
          )}

          {(isValidating || isUploading) && <LinearProgress />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleValidate}
          disabled={!file || !password || isValidating}
          variant="outlined"
        >
          Validar
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || !password || isUploading}
          variant="contained"
          startIcon={<UploadIcon />}
        >
          {isUploading ? 'Enviando...' : 'Fazer Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Component
export default function CertificadoUpload({ onCertificadoSelect }) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    certificados,
    isLoading,
    error,
    upload,
    isUploading,
    desativar,
    delete: deleteCert,
  } = useCertificados({ apenasAtivos: true });

  const handleUpload = async (data) => {
    await upload(data);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este certificado?')) {
      await deleteCert(id);
    }
  };

  if (error) {
    return (
      <Alert severity="error">Erro ao carregar certificados: {error.message}</Alert>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Certificados Digitais"
        subheader="Gerencie seus certificados A1 para assinatura digital"
        action={
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadOpen(true)}
          >
            Novo Certificado
          </Button>
        }
      />
      <CardContent>
        {isLoading ? (
          <LinearProgress />
        ) : certificados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SecurityIcon sx={{ fontSize: 64, color: 'grey.400' }} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              Nenhum certificado cadastrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Faca upload de um certificado digital A1 para emitir NFSe
            </Typography>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadOpen(true)}
              sx={{ mt: 2 }}
            >
              Adicionar Certificado
            </Button>
          </Box>
        ) : (
          <List>
            {certificados.map((cert) => (
              <ListItem
                key={cert.id}
                sx={{
                  border: 1,
                  borderColor: 'grey.200',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: cert.ativo ? 'background.paper' : 'grey.50',
                }}
              >
                <ListItemIcon>
                  <SecurityIcon
                    color={cert.status_validade === 'expirado' ? 'error' : 'primary'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">{cert.common_name}</Typography>
                      <Chip
                        size="small"
                        label={getStatusLabel(cert.status_validade)}
                        color={getStatusColor(cert.status_validade)}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" component="div">
                        Documento: {cert.documento || '-'} | Emissor: {cert.emissor}
                      </Typography>
                      <Typography variant="caption" component="div">
                        Valido ate: {formatDate(cert.data_expiracao)} ({cert.dias_restantes} dias)
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Selecionar">
                    <IconButton
                      edge="end"
                      onClick={() => onCertificadoSelect?.(cert)}
                      disabled={cert.status_validade === 'expirado'}
                    >
                      <ValidIcon color={cert.status_validade !== 'expirado' ? 'success' : 'disabled'} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton edge="end" onClick={() => handleDelete(cert.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
    </Card>
  );
}
