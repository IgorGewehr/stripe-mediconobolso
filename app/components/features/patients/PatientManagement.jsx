"use client";
import React, { useState } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PatientsTable from './PatientsTable';
import PacienteTemplate from './PacienteTemplate';

export default function PatientManagement() {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [view, setView] = useState('table'); // 'table' or 'details'

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setView('details');
    };

    const handleBackToTable = () => {
        setSelectedPatient(null);
        setView('table');
    };

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            {view === 'details' && (
                <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
                    <IconButton
                        onClick={handleBackToTable}
                        sx={{
                            backgroundColor: '#1852FE',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#0A44E4',
                            },
                            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            )}

            {view === 'table' ? (
                <PatientsTable onPatientSelect={handlePatientSelect} />
            ) : (
                <PacienteTemplate patient={selectedPatient} />
            )}
        </Box>
    );
}