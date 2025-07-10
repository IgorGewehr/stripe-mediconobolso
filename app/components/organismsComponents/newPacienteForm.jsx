import { Box, Grid, FormControl, InputLabel, TextField, Select, MenuItem, RadioGroup, FormControlLabel, Radio, InputAdornment, FormLabel, useTheme, useMediaQuery } from '@mui/material';

function NewPacienteForm() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: isMobile ? '100vw' : isTablet ? '700px' : '900px',
                height: 'auto',
                minHeight: isMobile ? '100vh' : '400px',
                borderRadius: isMobile ? '16px' : isTablet ? '24px' : '32px',
                border: '1px solid #EAECEF',
                background: '#FFF',
                flexShrink: 0,
                padding: isMobile ? 2 : isTablet ? 2.5 : 3,
                margin: isMobile ? '8px' : 'auto',
                overflowY: isMobile ? 'auto' : 'visible',
            }}
        >
            <Grid container spacing={2}>
                {/* Coluna Esquerda */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        {/* Nome Completo */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Nome Completo*
                                </InputLabel>
                                <TextField
                                    placeholder="Digite seu nome completo"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Data de Nascimento */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Data de Nascimento*
                                </InputLabel>
                                <TextField
                                    placeholder="DD/MM/AAAA"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <img src="/nascimento.svg" alt="Calendário" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Tipo Sanguíneo */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Tipo Sanguíneo*
                                </InputLabel>
                                <Select
                                    value=""
                                    displayEmpty
                                    sx={{
                                        borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                        fontSize: isMobile ? '14px' : '16px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(17, 30, 90, 0.30)',
                                        },
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Selecione um...
                                    </MenuItem>
                                    <MenuItem value="A+">A+</MenuItem>
                                    <MenuItem value="A-">A-</MenuItem>
                                    <MenuItem value="B+">B+</MenuItem>
                                    <MenuItem value="B-">B-</MenuItem>
                                    <MenuItem value="AB+">AB+</MenuItem>
                                    <MenuItem value="AB-">AB-</MenuItem>
                                    <MenuItem value="O+">O+</MenuItem>
                                    <MenuItem value="O-">O-</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Gênero */}
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Gênero*
                                </FormLabel>
                                <RadioGroup row={!isMobile} sx={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 2 }}>
                                    <FormControlLabel
                                        value="masculino"
                                        control={<Radio />}
                                        label={
                                            <>
                                                <img
                                                    src="/gMasculino.svg"
                                                    alt="Masculino"
                                                    style={{ marginRight: 8, verticalAlign: 'middle' }}
                                                />
                                                Masculino
                                            </>
                                        }
                                    />
                                    <FormControlLabel
                                        value="feminino"
                                        control={<Radio />}
                                        label={
                                            <>
                                                <img
                                                    src="/gFeminino.svg"
                                                    alt="Feminino"
                                                    style={{ marginRight: 8, verticalAlign: 'middle' }}
                                                />
                                                Feminino
                                            </>
                                        }
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        {/* Endereço */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Endereço
                                </InputLabel>
                                <TextField
                                    placeholder="Digite seu endereço"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Cidade */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Cidade
                                </InputLabel>
                                <TextField
                                    placeholder="Digite sua cidade"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Estado */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Estado
                                </InputLabel>
                                <Select
                                    value=""
                                    displayEmpty
                                    sx={{
                                        borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                        fontSize: isMobile ? '14px' : '16px',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(17, 30, 90, 0.30)',
                                        },
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Selecione um...
                                    </MenuItem>
                                    <MenuItem value="SP">São Paulo</MenuItem>
                                    <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                                    <MenuItem value="MG">Minas Gerais</MenuItem>
                                    {/* Adicione outros estados conforme necessário */}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* CPF */}
                        <Grid item xs={12} sm={6} md={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    CPF
                                </InputLabel>
                                <TextField
                                    placeholder="000.000.000-00"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Coluna Direita */}
                <Grid item xs={12} md={6}>
                    <Grid container direction="column" spacing={2}>
                        {/* Email */}
                        <Grid item>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Email*
                                </InputLabel>
                                <TextField
                                    placeholder="contato@popolente.com"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Telefone */}
                        <Grid item>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Telefone*
                                </InputLabel>
                                <TextField
                                    placeholder="85 91234-5678"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <img src="/telefone.svg" alt="Telefone" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* CEP */}
                        <Grid item>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    CEP
                                </InputLabel>
                                <TextField
                                    placeholder="00000-000"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: isMobile ? '8px' : isTablet ? '16px' : '999px',
                                            fontSize: isMobile ? '14px' : '16px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}

export default NewPacienteForm;