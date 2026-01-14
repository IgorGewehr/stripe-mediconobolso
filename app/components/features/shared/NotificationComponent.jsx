"use client";

/**
 * NotificationComponent
 *
 * Unified notification center combining:
 * - In-app notifications (via WebSocket) - agendamentos, glosas, NFSe, etc.
 * - Admin reports/support messages (existing Firebase functionality)
 *
 * Refactored to use new notification hooks and support real-time updates.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  Box,
  Popover,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Badge as MuiBadge,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  BugReport as BugIcon,
  Feedback as FeedbackIcon,
  Info as InfoIcon,
  Support as SupportIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  MarkEmailRead as MarkReadIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { adminService } from "@/lib/services/api";
import { useAuth } from "../../providers/authProvider";
import { useNotifications } from "../../hooks";

// Category icons for in-app notifications
const CATEGORY_ICONS = {
  appointment_reminder: CalendarIcon,
  appointment_confirmation: CalendarIcon,
  appointment_cancellation: CalendarIcon,
  appointment_no_show: CalendarIcon,
  lab_results: InfoIcon,
  medical_alert: WarningIcon,
  billing: PaymentIcon,
  nfse_issued: ReceiptIcon,
  nfse_cancelled: ReceiptIcon,
  nfse_error: WarningIcon,
  glossa_received: PaymentIcon,
  glossa_deadline_approaching: WarningIcon,
  glossa_resolved: PaymentIcon,
  payment_received: PaymentIcon,
  payment_overdue: WarningIcon,
  system: InfoIcon,
};

// Category colors
const CATEGORY_COLORS = {
  appointment_reminder: "#2196f3",
  appointment_confirmation: "#4caf50",
  appointment_cancellation: "#f44336",
  appointment_no_show: "#ff9800",
  lab_results: "#9c27b0",
  medical_alert: "#f44336",
  billing: "#ff9800",
  nfse_issued: "#4caf50",
  nfse_cancelled: "#f44336",
  nfse_error: "#f44336",
  glossa_received: "#ff9800",
  glossa_deadline_approaching: "#f44336",
  glossa_resolved: "#4caf50",
  payment_received: "#4caf50",
  payment_overdue: "#f44336",
  system: "#9e9e9e",
};

// Priority colors
const PRIORITY_COLORS = {
  critical: "#f44336",
  high: "#ff9800",
  normal: "#2196f3",
  low: "#9e9e9e",
};

const NotificationComponent = ({ onMessageClick }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Admin reports state (existing functionality)
  const [reports, setReports] = useState([]);
  const [reportsUnreadCount, setReportsUnreadCount] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(false);

  const { user } = useAuth();

  // In-app notifications from WebSocket hook
  const {
    notifications,
    unreadCount: notificationsUnreadCount,
    isConnected,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: refreshNotifications,
  } = useNotifications();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const open = Boolean(anchorEl);

  // Total unread count
  const totalUnreadCount = notificationsUnreadCount + reportsUnreadCount;

  // Load admin reports (existing functionality)
  const loadUnreadReports = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userReports = await adminService.getUserReports(user.uid);
      const unreadReports = userReports.filter(
        (report) => report.hasUnreadResponses === true
      );
      const recentReports = userReports.slice(0, 5);

      setReports(recentReports);
      setReportsUnreadCount(unreadReports.length);
    } catch (error) {
      console.error("[NotificationComponent] Error loading reports:", error);
    }
  }, [user?.uid]);

  // Load reports periodically
  useEffect(() => {
    if (user?.uid) {
      loadUnreadReports();
      const interval = setInterval(loadUnreadReports, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [user?.uid, loadUnreadReports]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    loadUnreadReports();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (activeTab === 0) {
      // In-app notifications
      await markAllAsRead();
    } else {
      // Admin reports
      setReportsLoading(true);
      try {
        const unreadReportIds = reports
          .filter((report) => report.hasUnreadResponses === true)
          .map((report) => report.id);

        for (const reportId of unreadReportIds) {
          await adminService.markReportAsReadByUser(reportId);
        }

        await loadUnreadReports();
      } catch (error) {
        console.error("[NotificationComponent] Error marking reports as read:", error);
      }
      setReportsLoading(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    handleClose();

    // Navigate to action URL if available
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Handle report click (existing functionality)
  const handleReportClick = async (report) => {
    if (report.hasUnreadResponses) {
      try {
        await adminService.markReportAsReadByUser(report.id);
        await loadUnreadReports();
      } catch (error) {
        console.error("[NotificationComponent] Error marking report as read:", error);
      }
    }

    handleClose();
    if (onMessageClick) {
      onMessageClick({
        action: "openCentralAjuda",
        selectedReportId: report.id,
        report: report,
        tab: "messages",
      });
    }
  };

  // Format relative time
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";

    const date = dateString instanceof Date ? dateString : new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("pt-BR");
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const labels = {
      appointment_reminder: "Lembrete",
      appointment_confirmation: "Confirmacao",
      appointment_cancellation: "Cancelamento",
      appointment_no_show: "Falta",
      lab_results: "Exames",
      medical_alert: "Alerta",
      billing: "Faturamento",
      nfse_issued: "NFSe Emitida",
      nfse_cancelled: "NFSe Cancelada",
      nfse_error: "Erro NFSe",
      glossa_received: "Glosa",
      glossa_deadline_approaching: "Prazo Glosa",
      glossa_resolved: "Glosa Resolvida",
      payment_received: "Pagamento",
      payment_overdue: "Inadimplencia",
      system: "Sistema",
    };
    return labels[category] || category;
  };

  // Get report type icon (existing functionality)
  const getReportIcon = (type) => {
    switch (type) {
      case "bug":
        return <BugIcon sx={{ fontSize: 20, color: "#f44336" }} />;
      case "feedback":
        return <FeedbackIcon sx={{ fontSize: 20, color: "#2196f3" }} />;
      case "support":
        return <SupportIcon sx={{ fontSize: 20, color: "#ff9800" }} />;
      case "system":
        return <InfoIcon sx={{ fontSize: 20, color: "#4caf50" }} />;
      case "admin_chat":
        return <AdminPanelSettingsIcon sx={{ fontSize: 20, color: "#9c27b0" }} />;
      default:
        return <MessageIcon sx={{ fontSize: 20, color: "#9e9e9e" }} />;
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case "bug":
        return "Bug Report";
      case "feedback":
        return "Feedback";
      case "support":
        return "Suporte";
      case "system":
        return "Sistema";
      case "admin_chat":
        return "Chat Admin";
      default:
        return "Mensagem";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "new":
        return "Nova";
      case "in_progress":
        return "Em andamento";
      case "resolved":
        return "Resolvida";
      default:
        return "Pendente";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "#2196f3";
      case "in_progress":
        return "#ff9800";
      case "resolved":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  // Render in-app notification item
  const renderNotificationItem = (notification, index) => {
    const IconComponent = CATEGORY_ICONS[notification.category] || InfoIcon;
    const categoryColor = CATEGORY_COLORS[notification.category] || "#9e9e9e";
    const priorityColor = PRIORITY_COLORS[notification.priority] || "#9e9e9e";

    return (
      <React.Fragment key={notification.id}>
        <ListItem
          button
          onClick={() => handleNotificationClick(notification)}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 1.5 : 2,
            backgroundColor: notification.is_read
              ? "transparent"
              : "rgba(24, 82, 254, 0.04)",
            borderLeft: notification.is_read
              ? "3px solid transparent"
              : `3px solid ${priorityColor}`,
            "&:hover": {
              backgroundColor: "rgba(24, 82, 254, 0.08)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: isMobile ? 36 : 44 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: `${categoryColor}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconComponent sx={{ fontSize: 18, color: categoryColor }} />
            </Box>
          </ListItemIcon>

          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: notification.is_read ? 400 : 600,
                    color: "#111E5A",
                    flex: 1,
                    fontSize: isMobile ? "13px" : "14px",
                  }}
                  noWrap
                >
                  {notification.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? "10px" : "11px", flexShrink: 0 }}
                >
                  {formatTimeAgo(notification.created_at)}
                </Typography>
              </Box>
            }
            secondary={
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.4,
                    mb: 0.5,
                  }}
                >
                  {notification.message}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <Chip
                    label={getCategoryLabel(notification.category)}
                    size="small"
                    sx={{
                      fontSize: "10px",
                      height: "18px",
                      backgroundColor: `${categoryColor}15`,
                      color: categoryColor,
                      fontWeight: 500,
                    }}
                  />
                  {notification.priority === "critical" || notification.priority === "high" ? (
                    <Chip
                      label={notification.priority === "critical" ? "Urgente" : "Alta"}
                      size="small"
                      sx={{
                        fontSize: "9px",
                        height: "16px",
                        backgroundColor: priorityColor,
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  ) : null}
                </Box>
              </Box>
            }
          />

          {/* Delete button on hover - desktop only */}
          {!isMobile && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(notification.id);
              }}
              sx={{
                opacity: 0,
                transition: "opacity 0.2s",
                ".MuiListItem-root:hover &": { opacity: 1 },
                color: "text.secondary",
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </ListItem>
        {index < notifications.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
      </React.Fragment>
    );
  };

  // Render report item (existing functionality)
  const renderReportItem = (report, index) => {
    return (
      <React.Fragment key={report.id}>
        <ListItem
          button
          onClick={() => handleReportClick(report)}
          sx={{
            py: isMobile ? 1 : 1.5,
            px: isMobile ? 1.5 : 2,
            backgroundColor: report.hasUnreadResponses
              ? "rgba(24, 82, 254, 0.04)"
              : "transparent",
            borderLeft:
              report.type === "admin_chat"
                ? "3px solid #9c27b0"
                : report.hasUnreadResponses
                  ? "3px solid #1852FE"
                  : "3px solid transparent",
            "&:hover": {
              backgroundColor: "rgba(24, 82, 254, 0.08)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: isMobile ? 28 : 36 }}>
            {getReportIcon(report.type)}
          </ListItemIcon>

          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: report.hasUnreadResponses ? 600 : 500,
                    color: "#111E5A",
                    flex: 1,
                    fontSize: isMobile ? "13px" : "14px",
                  }}
                  noWrap
                >
                  {report.type === "admin_chat" && report.isAdminInitiated
                    ? "Conversa com Admin"
                    : report.subject || getReportTypeLabel(report.type)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? "10px" : "11px" }}
                >
                  {formatTimeAgo(report.updatedAt)}
                </Typography>
              </Box>
            }
            secondary={
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.3,
                    mb: 0.5,
                  }}
                >
                  {report.content}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 0.5 : 1,
                    mt: 0.5,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={getReportTypeLabel(report.type)}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: isMobile ? "9px" : "10px",
                      height: isMobile ? "18px" : "20px",
                      borderColor: "rgba(0, 0, 0, 0.12)",
                      ...(report.type === "admin_chat" && {
                        borderColor: "#9c27b0",
                        color: "#9c27b0",
                      }),
                    }}
                  />

                  <Chip
                    label={getStatusLabel(report.status)}
                    size="small"
                    sx={{
                      fontSize: isMobile ? "9px" : "10px",
                      height: isMobile ? "18px" : "20px",
                      backgroundColor: getStatusColor(report.status),
                      color: "white",
                      fontWeight: 500,
                    }}
                  />

                  {report.hasUnreadResponses && (
                    <Chip
                      label={report.type === "admin_chat" ? "Msg Admin!" : "Nova resposta!"}
                      size="small"
                      sx={{
                        fontSize: isMobile ? "8px" : "9px",
                        height: isMobile ? "16px" : "18px",
                        backgroundColor: report.type === "admin_chat" ? "#9c27b0" : "#f44336",
                        color: "white",
                        fontWeight: 600,
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%": { opacity: 1 },
                          "50%": { opacity: 0.7 },
                          "100%": { opacity: 1 },
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            }
          />
        </ListItem>
        {index < reports.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
      </React.Fragment>
    );
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="h-8 w-8 rounded-full relative flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Bell className="w-3.5 h-3.5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-semibold">
            {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
          </span>
        )}
      </button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isMobile ? "left" : "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: isMobile ? "left" : "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? "8px" : "12px",
            boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.12)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            maxWidth: isMobile ? "320px" : isTablet ? "380px" : "420px",
            width: isMobile ? "calc(100vw - 32px)" : "100%",
            maxHeight: isMobile ? "450px" : "550px",
            ...(isMobile && {
              position: "fixed",
              top: "16px",
              right: "16px",
              left: "16px",
              zIndex: 9999,
            }),
          },
        }}
      >
        <Paper sx={{ p: 0 }}>
          {/* Header */}
          <Box
            sx={{
              p: isMobile ? 1.5 : 2,
              pb: 0,
              borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
              backgroundColor: "#f8f9fa",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#111E5A",
                    fontSize: isMobile ? "14px" : "16px",
                  }}
                >
                  Notificacoes
                </Typography>
                {isConnected && (
                  <Tooltip title="Conectado em tempo real">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#4caf50",
                      }}
                    />
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Atualizar">
                  <IconButton
                    size="small"
                    onClick={() => {
                      refreshNotifications();
                      loadUnreadReports();
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {((activeTab === 0 && notificationsUnreadCount > 0) ||
                  (activeTab === 1 && reportsUnreadCount > 0)) && (
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<MarkReadIcon />}
                      onClick={handleMarkAllAsRead}
                      disabled={reportsLoading}
                      sx={{
                        fontSize: isMobile ? "10px" : "11px",
                        color: "#1852FE",
                        textTransform: "none",
                        minWidth: "auto",
                        px: 1,
                      }}
                    >
                      Marcar lidas
                    </Button>
                  )}
              </Box>
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                minHeight: 36,
                "& .MuiTab-root": {
                  minHeight: 36,
                  fontSize: isMobile ? "11px" : "12px",
                  textTransform: "none",
                  fontWeight: 500,
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Sistema
                    {notificationsUnreadCount > 0 && (
                      <Chip
                        label={notificationsUnreadCount}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "10px",
                          backgroundColor: "#f44336",
                          color: "white",
                        }}
                      />
                    )}
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Suporte
                    {reportsUnreadCount > 0 && (
                      <Chip
                        label={reportsUnreadCount}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "10px",
                          backgroundColor: "#9c27b0",
                          color: "white",
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Content */}
          <List sx={{ p: 0, maxHeight: isMobile ? "300px" : "380px", overflow: "auto" }}>
            {activeTab === 0 ? (
              // In-app notifications tab
              notificationsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : notifications.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 3 }}
                      >
                        Nenhuma notificacao
                      </Typography>
                    }
                  />
                </ListItem>
              ) : (
                notifications.map((notification, index) =>
                  renderNotificationItem(notification, index)
                )
              )
            ) : (
              // Reports/Support tab
              reports.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", py: 3 }}
                      >
                        Nenhuma mensagem de suporte
                      </Typography>
                    }
                  />
                </ListItem>
              ) : (
                reports.map((report, index) => renderReportItem(report, index))
              )
            )}
          </List>

          {/* Footer */}
          <Divider />
          <Box sx={{ p: isMobile ? 1 : 1.5, textAlign: "center" }}>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                handleClose();
                if (activeTab === 0) {
                  // TODO: Navigate to notifications page
                  window.location.href = "/dashboard/configuracoes?tab=notifications";
                } else if (onMessageClick) {
                  onMessageClick({
                    action: "openCentralAjuda",
                    tab: "messages",
                  });
                }
              }}
              sx={{
                fontSize: isMobile ? "11px" : "12px",
                color: "#1852FE",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              {activeTab === 0 ? "Configurar notificacoes" : "Ver todas as mensagens"}
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationComponent;
