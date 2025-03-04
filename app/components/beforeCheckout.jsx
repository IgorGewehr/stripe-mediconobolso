"use client";

import React from "react";
import { Box, Grid } from "@mui/material";
import PlanSelector from "./planSelector";

const ImageAndBoxScreen = () => {
    return (
        <Grid container sx={{ height: "100vh" }}>
            {/* Lado com a imagem */}
            <Grid
                item
                xs={12}
                md={6}
                sx={{
                    backgroundImage: "url('/planos.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            />

            {/* Lado com a box em branco */}
            <Grid
                item
                xs={12}
                md={6}
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Box
                    sx={{
                        width: "80%",
                        height: "80%",
                        border: "1px dashed #ccc",
                    }}
                >
                    <PlanSelector/>
                </Box>
            </Grid>
        </Grid>
    );
};

export default ImageAndBoxScreen;
