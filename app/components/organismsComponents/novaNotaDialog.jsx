import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    styled,
    InputBase,
    Chip,
    Tooltip
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const theme = createTheme({
    palette: {
        primary: {
            main: '#3461FF',
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            400: '#94A3B8',
            500: '#64748B',
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        width: '1338px',
        height: '882px',
        flexShrink: 0,
        borderRadius: '50px',
        border: '1px solid #EAECEF',
        background: '#FFF',
        boxShadow: '0px 4px 10px 0px rgba(0, 0, 0, 0.07)',
        margin: 0,
        maxWidth: 'none',
        maxHeight: 'none',
    },
    '& .MuiBackdrop-root': {
        backdropFilter: 'blur(4px)',
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: '50px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '10px 20px',
    boxShadow: 'none',
    minHeight: '48px',
    '&.Mui-disabled': {
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
        opacity: 0.8,
    },
}));

const AttachmentChip = styled(Box)(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
    padding: '8px 12px',
    borderRadius: '4px',
    margin: '0 12px 12px 0',
    fontWeight: 500,
    fontSize: '14px',
    color: '#64748B',
}));

const BackButton = styled(IconButton)(({ theme }) => ({
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#F6F7F9',
    '&:hover': {
        backgroundColor: '#EAECEF'
    },
}));

const PatientNoteDialog = ({ open, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('Paciente mencionou aumento de fadiga e dores muscular');
    const [attachments, setAttachments] = useState([
        { name: 'ecs-rodrigo.pdf', size: '1.2MB' },
        { name: 'pas-rodrigo.pdf', size: '1.5MB' }
    ]);
    const [isQuickNote, setIsQuickNote] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileUpload = () => {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.doc,.docx,.jpg,.png';

        // Trigger click to open file explorer
        fileInput.click();

        // Handle file selection
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setAttachments([...attachments, {
                    name: file.name,
                    size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`
                }]);
            }
        };
    };

    const handleRemoveAttachment = (index) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate saving process
        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 1500);
    };

    return (
        <ThemeProvider theme={theme}>
            <StyledDialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="xl"
                aria-labelledby="patient-note-dialog"
            >
                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ p: 3, pl: 4, display: 'flex', alignItems: 'center' }}>
                        <BackButton onClick={onClose}>
                            <ArrowBackIcon />
                        </BackButton>
                    </Box>

                    {/* Main Content */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            px: 6,
                            pt: 0,
                            pb: 4,
                            maxWidth: '1070px',
                            mx: 'auto',
                            width: '100%'
                        }}
                    >
                        {/* Icon and Title */}
                        <Box sx={{ textAlign: 'center', mb: 6 }}>
                            <Box
                                component="img"
                                src="/newnota.svg"
                                alt="New Note"
                                sx={{
                                    width: '37.398px',
                                    height: '41.553px',
                                    mb: 3
                                }}
                            />
                            <Typography
                                variant="h4"
                                sx={{
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: '#101828'
                                }}
                            >
                                Criar nova nota
                            </Typography>
                        </Box>

                        {/* Note Type Selector */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 5,
                            width: '100%',
                            justifyContent: 'center',
                            '& > *': { mx: 1 }
                        }}>
                            <Box sx={{ position: 'relative' }}>
                                <StyledButton
                                    variant={isQuickNote ? "contained" : "outlined"}
                                    color="primary"
                                    sx={{
                                        px: 4,
                                        minWidth: '160px',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                    }}
                                    onClick={() => setIsQuickNote(true)}
                                >
                                    Nota Rápida
                                </StyledButton>
                                <IconButton
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        right: -10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: '#3461FF',
                                        color: 'white',
                                        width: 24,
                                        height: 24,
                                        '&:hover': { backgroundColor: '#2951E3' }
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>

                            <Typography sx={{ color: '#94A3B8', mx: 2, fontWeight: 500 }}>ou</Typography>

                            <StyledButton
                                variant={!isQuickNote ? "contained" : "outlined"}
                                color="primary"
                                endIcon={<KeyboardArrowDownIcon />}
                                sx={{
                                    px: 4,
                                    minWidth: '200px',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                }}
                                onClick={() => setIsQuickNote(false)}
                            >
                                Escolha a consulta
                            </StyledButton>
                        </Box>

                        {/* Note Editor */}
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                flex: 1,
                                border: '1px solid #EAECEF',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Title area */}
                            <Box sx={{ p: 4, pb: 3, borderBottom: '1px solid #EAECEF' }}>
                                <InputBase
                                    fullWidth
                                    placeholder="Digite aqui o título..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    sx={{
                                        fontSize: '18px',
                                        fontWeight: 500,
                                        color: '#101828',
                                        mb: 1,
                                        '&::placeholder': {
                                            color: '#94A3B8',
                                            opacity: 1
                                        }
                                    }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Box
                                        component="span"
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: '#3461FF',
                                            display: 'inline-block',
                                            mr: 1
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#64748B',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}
                                    >
                                        Data de criação: 04/12/2024
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Content area */}
                            <Box sx={{ p: 4, flex: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    variant="standard"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    InputProps={{
                                        disableUnderline: true,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '16px',
                                            lineHeight: 1.5,
                                            color: '#475467'
                                        }
                                    }}
                                />
                            </Box>

                            {/* Formatting toolbar */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    borderTop: '1px solid #EAECEF',
                                    p: 1.5,
                                    px: 2.5
                                }}
                            >
                                <Tooltip title="Lista com marcadores">
                                    <IconButton size="small" sx={{ color: '#64748B' }}>
                                        <FormatListBulletedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Lista numerada">
                                    <IconButton size="small" sx={{ color: '#64748B' }}>
                                        <FormatListNumberedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
                                <Tooltip title="Negrito">
                                    <IconButton size="small" sx={{ color: '#64748B' }}>
                                        <FormatBoldIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Itálico">
                                    <IconButton size="small" sx={{ color: '#64748B' }}>
                                        <FormatItalicIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Cor do texto">
                                    <IconButton size="small" sx={{ color: '#64748B' }}>
                                        <TextFormatIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1.5 }} />
                                <Tooltip title="Inserir link">
                                    <IconButton size="small" sx={{ color: '#64748B' }}>
                                        <InsertLinkIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {/* Attachments */}
                            {attachments.length > 0 && (
                                <Box sx={{ px: 3, py: 2, borderTop: '1px solid #EAECEF' }}>
                                    {attachments.map((file, index) => (
                                        <AttachmentChip key={index}>
                                            <PdfIcon fontSize="small" sx={{ mr: 1, color: '#F24E1E' }} />
                                            {file.name}
                                            <Typography
                                                component="span"
                                                sx={{
                                                    fontSize: '14px',
                                                    color: '#94A3B8',
                                                    ml: 1,
                                                    fontWeight: 400
                                                }}
                                            >
                                                {file.size}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveAttachment(index)}
                                                sx={{
                                                    ml: 1,
                                                    p: 0.5,
                                                    color: '#94A3B8'
                                                }}
                                            >
                                                <CloseIcon fontSize="small" sx={{ fontSize: '16px' }} />
                                            </IconButton>
                                        </AttachmentChip>
                                    ))}
                                </Box>
                            )}

                            {/* Actions */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderTop: '1px solid #EAECEF',
                                    p: 3
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleFileUpload}
                                    sx={{
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        borderColor: '#D0D5DD',
                                        color: '#344054',
                                        '&:hover': {
                                            borderColor: '#B0B7C3',
                                            backgroundColor: 'rgba(52, 64, 84, 0.04)'
                                        }
                                    }}
                                >
                                    Adicionar Exame
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    sx={{
                                        borderRadius: '8px',
                                        minWidth: '120px',
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        textTransform: 'none',
                                        py: '10px'
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Box
                                            component="img"
                                            src="/checkmark.svg"
                                            alt="Saved"
                                            sx={{
                                                width: 20,
                                                height: 20
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <Box
                                                component="img"
                                                src="/salvar.svg"
                                                alt="Save"
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    mr: 1.5
                                                }}
                                            />
                                            Salvar
                                        </>
                                    )}
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </DialogContent>
            </StyledDialog>
        </ThemeProvider>
    );
};

export default PatientNoteDialog;