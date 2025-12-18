"use client";

import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";
import React from "react";

const appTheme = createTheme({
    palette: {
        primary: {
            main: "#1D4ED8",
        },
        secondary: {
            main: "#9333EA",
        },
        error: {
            main: "#EF4444",
        },
    },
    typography: {
        fontFamily: "Arial, sans-serif",
        h1: {
            fontSize: "2.25rem",
            fontWeight: 700,
        },
        h2: {
            fontSize: "1.875rem",
            fontWeight: 600,
        },
        subtitle1: {
            fontSize: "1.25rem",
            fontWeight: 500,
        },
        body1: {
            fontSize: "1rem",
            fontWeight: 400,
        },
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
