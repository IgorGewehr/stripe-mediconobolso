'use client';
import React from 'react';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  Box,
  Fab,
  Zoom,
} from '@mui/material';
import {
  DashboardRounded,
  PeopleRounded,
  DescriptionRounded,
  CalendarMonthRounded,
  AddRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const navigationItems = [
  { label: 'Dashboard', value: 'dashboard', icon: DashboardRounded },
  { label: 'Pacientes', value: 'pacientes', icon: PeopleRounded },
  { label: 'Receitas', value: 'receitas', icon: DescriptionRounded },
  { label: 'Agenda', value: 'agenda', icon: CalendarMonthRounded },
];

const BottomNavigation = ({ 
  activePage, 
  onNavigate, 
  notificationCounts = {},
  onFabClick,
  showFab = true 
}) => {
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    if (newValue !== activePage) {
      onNavigate(newValue);
    }
  };

  const fabActions = [
    { icon: <PeopleRounded />, label: 'Novo Paciente', action: 'patient' },
    { icon: <DescriptionRounded />, label: 'Nova Receita', action: 'prescription' },
    { icon: <CalendarMonthRounded />, label: 'Novo Agendamento', action: 'appointment' },
  ];

  const [fabOpen, setFabOpen] = React.useState(false);

  const handleFabClick = () => {
    setFabOpen(!fabOpen);
  };

  const handleActionClick = (action) => {
    setFabOpen(false);
    if (onFabClick) {
      onFabClick(action);
    }
  };

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: `1px solid ${theme.palette.divider}`,
          pb: 'env(safe-area-inset-bottom)',
        }}
        elevation={3}
      >
        <MuiBottomNavigation
          value={activePage}
          onChange={handleChange}
          showLabels
          sx={{
            height: 56,
            backgroundColor: theme.palette.background.paper,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 0',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              marginTop: 2,
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={
                <Badge
                  badgeContent={notificationCounts[item.value] || 0}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    },
                  }}
                >
                  <item.icon 
                    sx={{ 
                      fontSize: 24,
                      transition: 'all 0.2s ease',
                    }} 
                  />
                </Badge>
              }
              sx={{
                '&.Mui-selected': {
                  '& .MuiSvgIcon-root': {
                    fontSize: 26,
                    transform: 'translateY(-2px)',
                  },
                },
              }}
            />
          ))}
        </MuiBottomNavigation>
      </Paper>

      {/* FAB for quick actions */}
      {showFab && (
        <>
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleFabClick}
            sx={{
              position: 'fixed',
              bottom: 72,
              right: 16,
              zIndex: theme.zIndex.appBar + 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            <AddRounded />
          </Fab>

          {/* Backdrop */}
          {fabOpen && (
            <Box
              onClick={() => setFabOpen(false)}
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: theme.zIndex.appBar,
                opacity: fabOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}

          {/* FAB Actions */}
          {fabActions.map((action, index) => (
            <Zoom
              key={action.action}
              in={fabOpen}
              timeout={{
                enter: 300 + index * 50,
                exit: 300 - index * 50,
              }}
              unmountOnExit
            >
              <Fab
                size="small"
                color="secondary"
                aria-label={action.label}
                onClick={() => handleActionClick(action.action)}
                sx={{
                  position: 'fixed',
                  bottom: 72 + (index + 1) * 60,
                  right: 16,
                  zIndex: theme.zIndex.appBar,
                }}
              >
                {action.icon}
              </Fab>
            </Zoom>
          ))}

          {/* FAB Labels */}
          {fabActions.map((action, index) => (
            <Zoom
              key={`${action.action}-label`}
              in={fabOpen}
              timeout={{
                enter: 300 + index * 50,
                exit: 300 - index * 50,
              }}
              unmountOnExit
            >
              <Paper
                elevation={2}
                sx={{
                  position: 'fixed',
                  bottom: 72 + (index + 1) * 60 + 8,
                  right: 72,
                  zIndex: theme.zIndex.appBar,
                  padding: '4px 12px',
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  {action.label}
                </motion.div>
              </Paper>
            </Zoom>
          ))}
        </>
      )}
    </>
  );
};

export default BottomNavigation;