"use client";

/**
 * PushPermissionBanner Component
 *
 * Displays a banner prompting users to enable push notifications.
 * Shows only when:
 * - Push is supported
 * - Permission has not been requested yet
 * - User hasn't dismissed it
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsActiveIcon,
} from "@mui/icons-material";
import { usePushNotifications, PushPermission } from "../../hooks";

const STORAGE_KEY = "push_banner_dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PushPermissionBanner({ variant = "inline", onDismiss }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    requestPermission,
    shouldShowPermissionBanner,
  } = usePushNotifications();

  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Check if banner was dismissed recently
  useEffect(() => {
    if (!shouldShowPermissionBanner) {
      setVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < DISMISS_DURATION_MS) {
        // Still within dismiss period
        setVisible(false);
        return;
      }
    }

    // Show banner after a short delay (after page loads)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [shouldShowPermissionBanner]);

  // Handle dismiss
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
    onDismiss?.();
  };

  // Handle enable click
  const handleEnable = async () => {
    setRequesting(true);
    try {
      const result = await requestPermission();

      if (result === PushPermission.GRANTED) {
        // Success - hide banner
        setVisible(false);
      } else if (result === PushPermission.DENIED) {
        // User denied - hide banner and don't show again
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        setVisible(false);
      }
    } catch (error) {
      console.error("[PushPermissionBanner] Error requesting permission:", error);
    } finally {
      setRequesting(false);
    }
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Floating variant (bottom of screen)
  if (variant === "floating") {
    return (
      <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: isMobile ? 16 : 24,
            left: isMobile ? 16 : "auto",
            right: isMobile ? 16 : 24,
            zIndex: 1200,
            p: 2,
            borderRadius: 2,
            maxWidth: isMobile ? "100%" : 400,
            backgroundColor: "#1852FE",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <NotificationsActiveIcon sx={{ fontSize: 28, mt: 0.25 }} />

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Ativar notificações?
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1.5 }}>
                Receba alertas sobre agendamentos, lembretes e atualizações importantes.
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEnable}
                  disabled={requesting}
                  sx={{
                    backgroundColor: "white",
                    color: "#1852FE",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {requesting ? "Ativando..." : "Ativar"}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleDismiss}
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    "&:hover": { color: "white" },
                    textTransform: "none",
                  }}
                >
                  Agora nao
                </Button>
              </Box>
            </Box>

            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Slide>
    );
  }

  // Inline variant (embedded in page)
  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? 1.5 : 2,
        borderRadius: 2,
        backgroundColor: "rgba(24, 82, 254, 0.08)",
        border: "1px solid rgba(24, 82, 254, 0.2)",
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "rgba(24, 82, 254, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <NotificationsIcon sx={{ color: "#1852FE", fontSize: 20 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color="text.primary"
            sx={{ mb: 0.25 }}
          >
            Ativar notificações push
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Receba alertas em tempo real no seu navegador
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleEnable}
            disabled={requesting}
            sx={{
              backgroundColor: "#1852FE",
              "&:hover": { backgroundColor: "#1342c4" },
              textTransform: "none",
              fontSize: "12px",
              px: isMobile ? 1.5 : 2,
            }}
          >
            {requesting ? "..." : "Ativar"}
          </Button>
          <IconButton size="small" onClick={handleDismiss} sx={{ color: "text.secondary" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}

// Settings page variant - more detailed
export function PushNotificationSettings() {
  const {
    permission,
    isSupported,
    isSubscribed,
    isLoading,
    subscriptions,
    requestPermission,
    togglePush,
    sendTestNotification,
  } = usePushNotifications();

  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await sendTestNotification();
    setTimeout(() => setTesting(false), 1000);
  };

  if (!isSupported) {
    return (
      <Paper sx={{ p: 2, backgroundColor: "rgba(0,0,0,0.02)" }}>
        <Typography variant="body2" color="text.secondary">
          Notificações push não são suportadas neste navegador.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <NotificationsIcon color={isSubscribed ? "primary" : "disabled"} />
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              Notificações Push
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSubscribed
                ? "Ativado - você receberá alertas neste navegador"
                : permission === PushPermission.DENIED
                ? "Bloqueado - permissão negada no navegador"
                : "Desativado"}
            </Typography>
          </Box>
        </Box>

        {permission !== PushPermission.DENIED && (
          <Button
            variant={isSubscribed ? "outlined" : "contained"}
            size="small"
            onClick={togglePush}
            disabled={isLoading}
            sx={{ textTransform: "none" }}
          >
            {isLoading ? "..." : isSubscribed ? "Desativar" : "Ativar"}
          </Button>
        )}
      </Box>

      {isSubscribed && (
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant="text"
            size="small"
            onClick={handleTest}
            disabled={testing}
            sx={{ textTransform: "none", fontSize: "12px" }}
          >
            {testing ? "Enviando..." : "Testar notificação"}
          </Button>
        </Box>
      )}

      {permission === PushPermission.DENIED && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
          Para ativar, você precisa permitir notificações nas configurações do navegador.
        </Typography>
      )}

      {subscriptions.length > 1 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {subscriptions.length} dispositivos registrados
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
