import { Avatar, Box, Typography } from "@mui/material";
import React from "react";
import depoiment from "../../public/depoiment.svg";

const ProfileCard = () => {
    return (
        <Box display="flex" alignItems="center" width={287} height={51}>
            <Avatar
                src={depoiment}
                alt="Dr. José Magalhaes"
                sx={{ width: 51, height: 51 }}
            />
            <Box ml={2}>
                <Typography variant="h6" color="primary">
                    Dr. José Magalhaes
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Cardiologista no Hospital Santa Fé
                </Typography>
            </Box>
        </Box>
    );
};

export default ProfileCard;
