import React from 'react';
import {
    Box,
    Typography,
    Button,
    Avatar,
    Paper,
    Grid,
    styled
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Componente unificado de ConsultationCard
const ConsultationCard = () => {
    // Dados do médico - poderiam vir como props
    const doctorData = {
        image: "https://cdn.builder.io/api/v1/image/assets/1ae30801c2434a3482dcef12978a69e3/5dbcc352b83cd6065a99ef151672be45e44c5d6a3edb74f981c5d0b0147ceea7",
        name: "Valéria Santos",
        time: "Hoje, 14:00"
    };

    return (
        <StyledPaper elevation={3}>
            <Grid container spacing={2}>
                {/* Seção de Próxima Consulta (esquerda) */}
                <Grid item xs={12} md={7}>
                    <Box sx={styles.consultationSection}>
                        <Typography variant="subtitle1" sx={styles.sectionTitle}>
                            Sua próxima consulta:
                        </Typography>

                        {/* Detalhes da Consulta */}
                        <Box sx={styles.doctorDetails}>
                            <Avatar
                                src={doctorData.image}
                                alt={doctorData.name}
                                sx={styles.doctorAvatar}
                            />
                            <Box>
                                <Typography variant="h6" sx={styles.doctorName}>
                                    {doctorData.name}
                                </Typography>
                                <Box sx={styles.timeContainer}>
                                    <AccessTimeIcon sx={styles.timeIcon} />
                                    <Typography variant="body2" sx={styles.timeText}>
                                        {doctorData.time}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Botão de Detalhes */}
                        <IconButton variant="outlined" color="inherit" sx={styles.detailsButton}>
                            <Typography sx={styles.buttonText}>Ver Detalhes</Typography>
                            <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Grid>

                {/* Seção de Ações (direita) */}
                <Grid item xs={12} md={5}>
                    <Box sx={styles.actionsSection}>
                        {/* Botão de Agenda */}
                        <IconButton
                            variant="contained"
                            color="inherit"
                            sx={styles.agendaButton}
                        >
                            <Typography sx={styles.buttonText}>Ir para a Agenda</Typography>
                            <CalendarTodayIcon fontSize="small" />
                        </IconButton>

                        {/* Botões de navegação */}
                        <Box sx={styles.navigationButtons}>
                            <IconButton
                                variant="outlined"
                                color="inherit"
                                sx={styles.navButton}
                            >
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                                variant="outlined"
                                color="inherit"
                                sx={styles.navButton}
                            >
                                <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </StyledPaper>
    );
};

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.primary.dark,
    borderRadius: 24,
    maxWidth: 565,
    padding: theme.spacing(2),
    color: 'white',
}));

// Botão customizado para manter o layout consistente
const IconButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: 100,
    padding: theme.spacing(1, 2.5),
    minHeight: 43,
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    color: variant === 'contained' ? theme.palette.primary.main : 'white',
    backgroundColor: variant === 'contained' ? 'white' : 'transparent',
    border: variant === 'outlined' ? '1px solid white' : 'none',
    fontWeight: variant === 'contained' ? 500 : 400,
    '&:hover': {
        backgroundColor: variant === 'contained' ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)',
    },
}));

// Estilos organizados por seções
const styles = {
    consultationSection: {
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    actionsSection: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        padding: 2,
    },
    sectionTitle: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 2,
    },
    doctorDetails: {
        display: 'flex',
        gap: 2,
        marginTop: 2,
    },
    doctorAvatar: {
        width: 53,
        height: 53,
    },
    doctorName: {
        fontSize: 20,
        lineHeight: 1,
    },
    timeContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        marginTop: 1.5,
        color: '#FFC107', // Cor amarela para o horário
    },
    timeIcon: {
        fontSize: 17,
    },
    timeText: {
        fontSize: 16,
        lineHeight: 1,
    },
    detailsButton: {
        alignSelf: 'flex-start',
        marginTop: 2,
        marginLeft: 1,
    },
    agendaButton: {
        marginBottom: 3,
    },
    navigationButtons: {
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
    },
    navButton: {
        minWidth: 'auto',
        width: 40,
        height: 40,
        padding: 0,
    },
    buttonText: {
        textTransform: 'none',
    },
};

export default ConsultationCard;