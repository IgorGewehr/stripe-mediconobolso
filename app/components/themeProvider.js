import {
    CssBaseline,
    ThemeProvider as MuiThemeProvider,
    createTheme,
} from "@mui/material";
import React from "react";
import AuthForms from "./authForms";

const appTheme = createTheme({
    palette: {
        primary: {
            main: "#1D4ED8", // Example color, replace with actual Tailwind color
        },
        secondary: {
            main: "#9333EA", // Example color, replace with actual Tailwind color
        },
        error: {
            main: "#EF4444", // Example color, replace with actual Tailwind color
        },
        // Add other colors from tailwind.config.js and tailwind.css
    },
    typography: {
        fontFamily: "Arial, sans-serif", // Example font, replace with actual Tailwind font
        h1: {
            fontSize: "2.25rem", // Example size, replace with actual Tailwind size
            fontWeight: 700,
        },
        h2: {
            fontSize: "1.875rem", // Example size, replace with actual Tailwind size
            fontWeight: 600,
        },
        subtitle1: {
            fontSize: "1.25rem", // Example size, replace with actual Tailwind size
            fontWeight: 500,
        },
        body1: {
            fontSize: "1rem", // Example size, replace with actual Tailwind size
            fontWeight: 400,
        },
        // Add other typography styles as needed
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: ({ theme }) => ({
                    ...theme.typography.body1,
                }),
                head: ({ theme }) => ({
                    ...theme.typography.subtitle1,
                }),
                body: ({ theme }) => ({
                    ...theme.typography.body1,
                }),
            },
        },
        MuiListItemText: {
            styleOverrides: {
                primary: ({ theme }) => ({
                    ...theme.typography.h2,
                }),
                secondary: ({ theme }) => ({
                    ...theme.typography.body1,
                }),
            },
        },
    },
});

export const ThemeProvider = ({ children }) => {
    return (
        <MuiThemeProvider theme={appTheme}>
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    );
};

export default ThemeProvider;