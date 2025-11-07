'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    useTheme,
    useMediaQuery,
    styled,
    Fade,
    Slide,
    IconButton,
    Box,
    Typography,
} from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';

const StyledResponsiveDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: theme.breakpoints.down('sm') ? 0 : '20px',
        border: theme.breakpoints.down('sm') ? 'none' : '1px solid #E5E7EB',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: theme.breakpoints.down('sm') 
            ? 'none' 
            : '0px 20px 40px rgba(0, 0, 0, 0.1)',
        maxHeight: theme.breakpoints.down('sm') ? '100vh' : '95vh',
        margin: theme.breakpoints.down('sm') ? 0 : '16px',
        width: theme.breakpoints.down('sm') ? '100%' : 'calc(100% - 32px)',
        overflow: 'hidden',
        position: 'relative',
        // Safe area insets for mobile
        paddingBottom: theme.breakpoints.down('sm') ? 'env(safe-area-inset-bottom)' : 0,
    },
    '& .MuiBackdrop-root': {
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
}));

const ResponsiveDialogHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.breakpoints.down('sm') ? '16px' : '24px',
    borderBottom: '1px solid #E5E7EB',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
}));

const ResponsiveDialogContent = styled(DialogContent)(({ theme }) => ({
    padding: theme.breakpoints.down('sm') ? '16px' : '24px',
    flex: 1,
    overflow: 'auto',
    // Better scrolling on mobile
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': {
        width: '6px',
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#E5E7EB',
        borderRadius: '3px',
        '&:hover': {
            background: '#D1D5DB',
        },
    },
}));

const ResponsiveDialogActions = styled(DialogActions)(({ theme }) => ({
    padding: theme.breakpoints.down('sm') ? '16px' : '24px',
    borderTop: '1px solid #E5E7EB',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
    gap: theme.breakpoints.down('sm') ? '8px' : '12px',
    flexDirection: theme.breakpoints.down('sm') ? 'column' : 'row',
    '& .MuiButton-root': {
        minHeight: theme.breakpoints.down('sm') ? '48px' : '40px',
        fontSize: theme.breakpoints.down('sm') ? '16px' : '14px',
        fontWeight: 600,
        borderRadius: '12px',
        textTransform: 'none',
        width: theme.breakpoints.down('sm') ? '100%' : 'auto',
    },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ResponsiveDialog = ({ 
    open, 
    onClose, 
    title, 
    children, 
    actions,
    maxWidth = 'md',
    disableEscapeKeyDown = false,
    disableBackdropClick = false,
    showCloseButton = true,
    titleIcon,
    ...props 
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const handleClose = (event, reason) => {
        if (disableBackdropClick && reason === 'backdropClick') return;
        if (disableEscapeKeyDown && reason === 'escapeKeyDown') return;
        onClose?.(event, reason);
    };

    const getMaxWidth = () => {
        if (isMobile) return false;
        if (isTablet) return 'sm';
        return maxWidth;
    };

    return (
        <StyledResponsiveDialog
            open={open}
            onClose={handleClose}
            fullScreen={isMobile || isTablet}
            maxWidth={getMaxWidth()}
            TransitionComponent={Transition}
            transitionDuration={300}
            {...props}
        >
            {/* Header */}
            <ResponsiveDialogHeader>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {titleIcon && (
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #1852FE 0%, #4285F4 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                            }}
                        >
                            {titleIcon}
                        </Box>
                    )}
                    <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        component="h2"
                        sx={{
                            fontWeight: 700,
                            color: '#1F2937',
                            fontSize: isMobile ? '1.1rem' : '1.25rem',
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
                
                {showCloseButton && (
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: '#6B7280',
                            '&:hover': {
                                backgroundColor: '#F3F4F6',
                                color: '#374151',
                            },
                        }}
                    >
                        <CloseRounded />
                    </IconButton>
                )}
            </ResponsiveDialogHeader>

            {/* Content */}
            <ResponsiveDialogContent>
                {children}
            </ResponsiveDialogContent>

            {/* Actions */}
            {actions && (
                <ResponsiveDialogActions>
                    {actions}
                </ResponsiveDialogActions>
            )}
        </StyledResponsiveDialog>
    );
};

export default ResponsiveDialog;