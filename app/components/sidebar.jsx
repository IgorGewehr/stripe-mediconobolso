"use client";

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

const Sidebar = ({ initialSelected = "Dashboard", userName = "Médico", onMenuSelect }) => {
    const [selected, setSelected] = useState(initialSelected);
    const firstName = userName.split(" ")[0];

    const principalItems = [
        { label: "Dashboard", icon: "/dashboard.svg" },
        { label: "Pacientes", icon: "/pacientes.svg" },
        { label: "Receitas", icon: "/receitas.svg" },
        { label: "Agenda", icon: "/agenda.svg" },
    ];

    const suporteItems = [
        { label: "Central de Ajuda", icon: "/centralajuda.svg" },
        { label: "Reportar", icon: "/reportar.svg" },
    ];

    const handleMenuClick = (label) => {
        setSelected(label);
        if (onMenuSelect) onMenuSelect(label);
    };

    const nonSelectedButtonStyles = {
        color: "#111E5A",
        fontFamily: "Gellix",
        fontSize: "16px",
        fontWeight: 500,
        textTransform: "none",
        justifyContent: "flex-start",
        px: 1,
        "&:hover": {
            backgroundColor: "rgba(0,0,0,0.05)",
        },
    };

    const selectedButtonStyles = {
        width: "148px",
        height: "33px",
        borderRadius: "99px",
        opacity: 0.77,
        backgroundColor: "#2971FF",
        color: "#FFF",
        fontFamily: "Gellix",
        fontSize: "16px",
        fontWeight: 500,
        textTransform: "none",
    };

    const iconStyles = {
        width: "16px",
        height: "16px",
        mr: 1,
    };

    return (
        <Box
            sx={{
                backgroundColor: "#89BDFF",
                height: "100vh",
                width: "250px",
                position: "relative",
                p: 2,
                boxSizing: "border-box",
            }}
        >
            {/* Logo e Títulos */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                    component="img"
                    src="/ico.svg"
                    alt="Logo"
                    sx={{ width: "44px", height: "47.466px", flexShrink: 0 }}
                />
                <Box sx={{ ml: 1 }}>
                    <Typography
                        sx={{
                            color: "#2971FF",
                            fontFamily: "Gellix",
                            fontSize: "23.855px",
                            fontWeight: 400,
                        }}
                    >
                        Médico
                    </Typography>
                    <Typography
                        sx={{
                            color: "#31343A",
                            fontFamily: "Gellix",
                            fontSize: "9.19px",
                            letterSpacing: "3.033px",
                            fontWeight: 400,
                        }}
                    >
                        no bolso
                    </Typography>
                </Box>
            </Box>

            {/* Seção de Menu */}
            <Box sx={{ mt: "78.53px" }}>
                {/* Categoria Principal */}
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "14px",
                        fontWeight: 500,
                        opacity: 0.33,
                    }}
                >
                    Principal
                </Typography>
                <Box>
                    {principalItems.map((item, index) => (
                        <Box key={item.label} sx={{ mt: index === 0 ? "23px" : "25px" }}>
                            <Button
                                onClick={() => handleMenuClick(item.label)}
                                variant={selected === item.label ? "contained" : "text"}
                                sx={selected === item.label ? selectedButtonStyles : nonSelectedButtonStyles}
                                startIcon={
                                    <Box component="img" src={item.icon} alt={item.label} sx={iconStyles} />
                                }
                            >
                                {item.label}
                            </Button>
                        </Box>
                    ))}
                </Box>

                {/* Categoria Suporte */}
                <Box sx={{ mt: "35px" }}>
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "14px",
                            fontWeight: 500,
                            opacity: 0.33,
                        }}
                    >
                        Suporte
                    </Typography>
                    <Box>
                        {suporteItems.map((item, index) => (
                            <Box key={item.label} sx={{ mt: index === 0 ? "23px" : "25px" }}>
                                <Button
                                    onClick={() => handleMenuClick(item.label)}
                                    variant={selected === item.label ? "contained" : "text"}
                                    sx={selected === item.label ? selectedButtonStyles : nonSelectedButtonStyles}
                                    startIcon={
                                        <Box component="img" src={item.icon} alt={item.label} sx={iconStyles} />
                                    }
                                >
                                    {item.label}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Área do Médico (fixa 50px acima do fim) */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: "50px",
                    left: 2,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Box
                    component="img"
                    src="/doctorimage.png"
                    alt="Doctor"
                    sx={{
                        width: "43px",
                        height: "43px",
                        borderRadius: "33.594px",
                        border: "1.344px solid #2971FF",
                        flexShrink: 0,
                        background: 'lightgray 50% / cover no-repeat',
                    }}
                />
                <Typography
                    sx={{
                        ml: 2,
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500,
                    }}
                >
                    {`Dr ${firstName}`}
                </Typography>
            </Box>
        </Box>
    );
};

export default Sidebar;
