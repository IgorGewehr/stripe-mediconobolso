import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';

const PatientRegistrationForm = () => {
    // Estados para cada seção de texto
    const [medicationInput, setMedicationInput] = useState('');
    const [medications, setMedications] = useState([]);

    const [diseaseInput, setDiseaseInput] = useState('');
    const [diseases, setDiseases] = useState([]);

    const [allergyInput, setAllergyInput] = useState('');
    const [allergies, setAllergies] = useState([]);

    const [surgeryInput, setSurgeryInput] = useState('');
    const [surgeries, setSurgeries] = useState([]);

    const [activityInput, setActivityInput] = useState('');
    const [activities, setActivities] = useState([]);

    // Estados para perguntas binárias
    const [consumesAlcohol, setConsumesAlcohol] = useState('Não');
    const [isSmoker, setIsSmoker] = useState('Não');

    // Função para adicionar itens às listas
    const addItem = (input, setInput, items, setItems) => {
        if (input.trim() !== '') {
            setItems([...items, input.trim()]);
            setInput(''); // Limpa o campo após adicionar
        }
    };

    // Função para remover itens das listas
    const removeItem = (index, items, setItems) => {
        setItems(items.filter((_, i) => i !== index));
    };

    return (
        <Box
            sx={{
                width: '732px',
                height: '919px',
                flexShrink: 0,
                borderRadius: '40px',
                border: '1px solid #EAECEF',
                background: '#FFF',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
            }}
        >
            {/* Seção Medicamentos */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    Medicamentos
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TextField
                        value={medicationInput}
                        onChange={(e) => setMedicationInput(e.target.value)}
                        placeholder="Digite o medicamento"
                        sx={{ flex: 1 }}
                    />
                    <IconButton
                        onClick={() =>
                            addItem(medicationInput, setMedicationInput, medications, setMedications)
                        }
                        sx={{ backgroundColor: '#1976D2', '&:hover': { backgroundColor: '#115293' } }}
                    >
                        <img
                            src="/plusicon.svg"
                            alt="Adicionar"
                            style={{ width: '16px', height: '16px' }}
                        />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {medications.map((med, index) => (
                        <Chip
                            key={index}
                            label={med}
                            onDelete={() => removeItem(index, medications, setMedications)}
                            sx={{ backgroundColor: '#E3F2FD', color: '#111E5A' }} // Azul claro
                        />
                    ))}
                </Box>
            </Box>

            {/* Seção Doenças */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    Doenças
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TextField
                        value={diseaseInput}
                        onChange={(e) => setDiseaseInput(e.target.value)}
                        placeholder="Digite a doença"
                        sx={{ flex: 1 }}
                    />
                    <IconButton
                        onClick={() => addItem(diseaseInput, setDiseaseInput, diseases, setDiseases)}
                        sx={{ backgroundColor: '#1976D2', '&:hover': { backgroundColor: '#115293' } }}
                    >
                        <img
                            src="/plusicon.svg"
                            alt="Adicionar"
                            style={{ width: '16px', height: '16px' }}
                        />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {diseases.map((disease, index) => (
                        <Chip
                            key={index}
                            label={disease}
                            onDelete={() => removeItem(index, diseases, setDiseases)}
                            sx={{ backgroundColor: '#FFF9C4', color: '#111E5A' }} // Amarelo
                        />
                    ))}
                </Box>
            </Box>

            {/* Seção Alergias */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    Alergias
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TextField
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        placeholder="Digite a alergia"
                        sx={{ flex: 1 }}
                    />
                    <IconButton
                        onClick={() => addItem(allergyInput, setAllergyInput, allergies, setAllergies)}
                        sx={{ backgroundColor: '#1976D2', '&:hover': { backgroundColor: '#115293' } }}
                    >
                        <img
                            src="/plusicon.svg"
                            alt="Adicionar"
                            style={{ width: '16px', height: '16px' }}
                        />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {allergies.map((allergy, index) => (
                        <Chip
                            key={index}
                            label={allergy}
                            onDelete={() => removeItem(index, allergies, setAllergies)}
                            sx={{ backgroundColor: '#F5F5F5', color: '#111E5A' }} // Cinza claro
                        />
                    ))}
                </Box>
            </Box>

            {/* Seção Cirurgias */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    Cirurgias
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TextField
                        value={surgeryInput}
                        onChange={(e) => setSurgeryInput(e.target.value)}
                        placeholder="Digite a cirurgia"
                        sx={{ flex: 1 }}
                    />
                    <IconButton
                        onClick={() => addItem(surgeryInput, setSurgeryInput, surgeries, setSurgeries)}
                        sx={{ backgroundColor: '#1976D2', '&:hover': { backgroundColor: '#115293' } }}
                    >
                        <img
                            src="/plusicon.svg"
                            alt="Adicionar"
                            style={{ width: '16px', height: '16px' }}
                        />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {surgeries.map((surgery, index) => (
                        <Chip
                            key={index}
                            label={surgery}
                            onDelete={() => removeItem(index, surgeries, setSurgeries)}
                            sx={{ backgroundColor: '#F5F5F5', color: '#111E5A' }} // Cinza claro
                        />
                    ))}
                </Box>
            </Box>

            {/* Seção Atividade Física */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    Atividade Física
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TextField
                        value={activityInput}
                        onChange={(e) => setActivityInput(e.target.value)}
                        placeholder="Digite a atividade"
                        sx={{ flex: 1 }}
                    />
                    <IconButton
                        onClick={() => addItem(activityInput, setActivityInput, activities, setActivities)}
                        sx={{ backgroundColor: '#1976D2', '&:hover': { backgroundColor: '#115293' } }}
                    >
                        <img
                            src="/plusicon.svg"
                            alt="Adicionar"
                            style={{ width: '16px', height: '16px' }}
                        />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {activities.map((activity, index) => (
                        <Chip
                            key={index}
                            label={activity}
                            onDelete={() => removeItem(index, activities, setActivities)}
                            sx={{ backgroundColor: '#F5F5F5', color: '#111E5A' }} // Cinza claro
                        />
                    ))}
                </Box>
            </Box>

            {/* Seção Consome Álcool? */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    Consome Álcool?
                </Typography>
                <ToggleButtonGroup
                    value={consumesAlcohol}
                    exclusive
                    onChange={(e, value) => value && setConsumesAlcohol(value)}
                    sx={{ marginTop: '10px' }}
                >
                    <ToggleButton
                        value="Sim"
                        sx={{
                            borderRadius: '20px',
                            color: consumesAlcohol === 'Sim' ? '#FFF' : '#111E5A',
                            backgroundColor: consumesAlcohol === 'Sim' ? '#1976D2' : '#EAECEF',
                            '&:hover': { backgroundColor: consumesAlcohol === 'Sim' ? '#115293' : '#D0D4D9' },
                        }}
                    >
                        Sim
                    </ToggleButton>
                    <ToggleButton
                        value="Não"
                        sx={{
                            borderRadius: '20px',
                            color: consumesAlcohol === 'Não' ? '#FFF' : '#111E5A',
                            backgroundColor: consumesAlcohol === 'Não' ? '#1976D2' : '#EAECEF',
                            '&:hover': { backgroundColor: consumesAlcohol === 'Não' ? '#115293' : '#D0D4D9' },
                        }}
                    >
                        Não
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Seção É Fumante? */}
            <Box>
                <Typography
                    variant="h6"
                    sx={{
                        color: '#111E5A',
                        fontFamily: 'Gellix',
                        fontSize: '16px',
                        fontWeight: 500,
                        lineHeight: '24px',
                        textTransform: 'uppercase',
                    }}
                >
                    É Fumante?
                </Typography>
                <ToggleButtonGroup
                    value={isSmoker}
                    exclusive
                    onChange={(e, value) => value && setIsSmoker(value)}
                    sx={{ marginTop: '10px' }}
                >
                    <ToggleButton
                        value="Sim"
                        sx={{
                            borderRadius: '20px',
                            color: isSmoker === 'Sim' ? '#FFF' : '#111E5A',
                            backgroundColor: isSmoker === 'Sim' ? '#1976D2' : '#EAECEF',
                            '&:hover': { backgroundColor: isSmoker === 'Sim' ? '#115293' : '#D0D4D9' },
                        }}
                    >
                        Sim
                    </ToggleButton>
                    <ToggleButton
                        value="Não"
                        sx={{
                            borderRadius: '20px',
                            color: isSmoker === 'Não' ? '#FFF' : '#111E5A',
                            backgroundColor: isSmoker === 'Não' ? '#1976D2' : '#EAECEF',
                            '&:hover': { backgroundColor: isSmoker === 'Não' ? '#115293' : '#D0D4D9' },
                        }}
                    >
                        Não
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Box>
    );
};

export default PatientRegistrationForm;