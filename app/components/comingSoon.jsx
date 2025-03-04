"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

const ComingSoon = () => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            p={2}
        >
            <Typography variant="h3" align="center" gutterBottom>
                Obrigado!
            </Typography>
            <Typography variant="h5" align="center">
                Nosso aplicativo estará disponível em breve.
            </Typography>
        </Box>
    );
};

export default ComingSoon;
