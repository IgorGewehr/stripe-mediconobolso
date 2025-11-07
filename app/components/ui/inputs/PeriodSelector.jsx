import React, { useState } from 'react';
import { Button, Menu, MenuItem, Box, Typography } from '@mui/material';

const PeriodSelector = ({ changeView }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleButtonClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (view) => {
        changeView(view);
        handleClose();
    };

    return (
        <>
            <Button
                variant="outlined"
                onClick={handleButtonClick}
                sx={{
                    backgroundColor: 'white',
                    borderRadius: '50px',
                    border: '1.522px solid rgba(0, 0, 0, 0.20)',
                    textTransform: 'none',
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 150,
                }}
            >
                <Box
                    component="img"
                    src="/periodo.svg"
                    alt="Período"
                    sx={{ width: 20, height: 20, mr: 1 }}
                />
                <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'left' }}>
                    Período
                </Typography>
                <Box
                    component="img"
                    src="/downarrow.svg"
                    alt="Abrir menu"
                    sx={{ width: 20, height: 20 }}
                />
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem onClick={() => handleSelect('day')}>Dia</MenuItem>
                <MenuItem onClick={() => handleSelect('week')}>Semana</MenuItem>
                <MenuItem onClick={() => handleSelect('month')}>Mês</MenuItem>
            </Menu>
        </>
    );
};

export default PeriodSelector;
