import { Box, Grid, FormControl, InputLabel, TextField, Select, MenuItem, RadioGroup, FormControlLabel, Radio, InputAdornment, FormLabel } from '@mui/material';

function NewPacienteForm() {
    return (
        <Box
            sx={{
                width: 1536,
                height: 498,
                borderRadius: '40px',
                border: '1px solid #EAECEF',
                background: '#FFF',
                flexShrink: 0,
                padding: 4,
            }}
        >
            <Grid container spacing={2}>
                {/* Coluna Esquerda */}
                <Grid item xs={6}>
                    <Grid container spacing={2}>
                        {/* Nome Completo */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Data de Nascimento */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Tipo Sanguíneo */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                        borderRadius: '999px',
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
                        <Grid item xs={6}>
                            <FormControl component="fieldset">
                                <FormLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Gênero*
                                </FormLabel>
                                <RadioGroup row>
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
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Cidade */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Estado */}
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                        borderRadius: '999px',
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
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
                                            '& fieldset': { borderColor: 'rgba(17, 30, 90, 0.30)' },
                                        },
                                    }}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Coluna Direita */}
                <Grid item xs={6}>
                    <Grid container direction="column" spacing={2}>
                        {/* Email */}
                        <Grid item>
                            <FormControl fullWidth>
                                <InputLabel
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix',
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
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
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
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
                                        fontSize: '16px',
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
                                            borderRadius: '999px',
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