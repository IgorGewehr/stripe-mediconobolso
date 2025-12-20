"use client";

import React from 'react';
import { Box, Skeleton, Paper, alpha } from '@mui/material';

// Skeleton for conversation list item
export const ConversationItemSkeleton = () => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      mb: 1,
      borderRadius: '8px',
      border: '1px solid #E5E7EB',
    }}
  >
    <Box display="flex" gap={1.5}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box flex={1}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="20%" height={20} />
        </Box>
        <Skeleton variant="text" width="80%" height={20} />
        <Box display="flex" gap={0.5} mt={1}>
          <Skeleton variant="rounded" width={70} height={20} />
          <Skeleton variant="rounded" width={60} height={20} />
        </Box>
      </Box>
    </Box>
  </Paper>
);

// Skeleton for conversation list
export const ConversationListSkeleton = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <ConversationItemSkeleton key={index} />
    ))}
  </>
);

// Skeleton for message bubble (client)
export const ClientMessageSkeleton = () => (
  <Box display="flex" justifyContent="flex-start" gap={1.5}>
    <Skeleton variant="circular" width={36} height={36} />
    <Paper
      elevation={0}
      sx={{
        p: 2,
        maxWidth: '70%',
        bgcolor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 2,
      }}
    >
      <Skeleton variant="text" width={200} height={20} />
      <Skeleton variant="text" width={150} height={20} />
      <Skeleton variant="text" width={80} height={16} sx={{ mt: 1 }} />
    </Paper>
  </Box>
);

// Skeleton for message bubble (doctor/AI)
export const DoctorMessageSkeleton = () => (
  <Box display="flex" justifyContent="flex-end" gap={1.5}>
    <Paper
      elevation={0}
      sx={{
        p: 2,
        maxWidth: '70%',
        bgcolor: alpha('#4285F4', 0.08),
        borderRadius: 2,
      }}
    >
      <Skeleton variant="text" width={180} height={20} />
      <Skeleton variant="text" width={220} height={20} />
      <Skeleton variant="text" width={120} height={20} />
      <Skeleton variant="text" width={80} height={16} sx={{ mt: 1 }} />
    </Paper>
    <Skeleton variant="circular" width={36} height={36} />
  </Box>
);

// Skeleton for messages list
export const MessagesListSkeleton = () => (
  <Box sx={{ p: 2 }}>
    <Box display="flex" justifyContent="center" mb={2}>
      <Skeleton variant="rounded" width={180} height={28} />
    </Box>
    <ClientMessageSkeleton />
    <Box height={16} />
    <DoctorMessageSkeleton />
    <Box height={16} />
    <ClientMessageSkeleton />
    <Box height={16} />
    <DoctorMessageSkeleton />
  </Box>
);

// Skeleton for header
export const ConversationHeaderSkeleton = () => (
  <Box
    sx={{
      p: 2,
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
    }}
  >
    <Skeleton variant="circular" width={40} height={40} />
    <Box flex={1}>
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="text" width="30%" height={18} />
    </Box>
    <Skeleton variant="rounded" width={100} height={32} />
  </Box>
);

// Full page skeleton
export const ConversationsPageSkeleton = () => (
  <Box sx={{ display: 'flex', height: '100%' }}>
    {/* Sidebar */}
    <Box
      sx={{
        width: 360,
        borderRight: '1px solid #E5E7EB',
        p: 2,
      }}
    >
      <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2 }} />
      <ConversationListSkeleton count={6} />
    </Box>

    {/* Main content */}
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ConversationHeaderSkeleton />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <MessagesListSkeleton />
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
        <Skeleton variant="rounded" width="100%" height={44} />
      </Box>
    </Box>
  </Box>
);

export default ConversationsPageSkeleton;
