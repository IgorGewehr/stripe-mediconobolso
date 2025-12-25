'use client';

import { useState, useCallback } from 'react';

/**
 * useDialogState Hook
 *
 * Provides standardized dialog state management.
 * Reduces boilerplate for dialog open/close, loading, and error handling.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.initialOpen - Initial open state (default: false)
 * @param {Function} options.onOpen - Callback when dialog opens
 * @param {Function} options.onClose - Callback when dialog closes
 * @returns {Object} Dialog state and handlers
 *
 * @example
 * const dialog = useDialogState();
 *
 * <Button onClick={dialog.open}>Open</Button>
 * <Dialog open={dialog.isOpen} onClose={dialog.close}>
 *   {dialog.isLoading && <CircularProgress />}
 *   {dialog.error && <Alert severity="error">{dialog.error}</Alert>}
 * </Dialog>
 */
export function useDialogState(options = {}) {
  const {
    initialOpen = false,
    onOpen = null,
    onClose = null
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogData, setDialogData] = useState(null);

  /**
   * Open the dialog
   * @param {any} data - Optional data to pass to the dialog
   */
  const open = useCallback((data = null) => {
    setDialogData(data);
    setError(null);
    setIsOpen(true);

    if (onOpen) {
      onOpen(data);
    }
  }, [onOpen]);

  /**
   * Close the dialog
   */
  const close = useCallback(() => {
    setIsOpen(false);
    setError(null);
    setIsLoading(false);

    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * Close dialog and clear data
   */
  const closeAndReset = useCallback(() => {
    close();
    setDialogData(null);
  }, [close]);

  /**
   * Toggle dialog open state
   */
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  /**
   * Set error state
   */
  const setErrorState = useCallback((err) => {
    setError(err);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update dialog data
   */
  const updateData = useCallback((newData) => {
    setDialogData(prev => ({ ...prev, ...newData }));
  }, []);

  return {
    // State
    isOpen,
    isLoading,
    error,
    data: dialogData,
    hasError: !!error,

    // Actions
    open,
    close,
    closeAndReset,
    toggle,
    setLoading,
    setError: setErrorState,
    clearError,
    setData: setDialogData,
    updateData,

    // Props helpers for Material-UI Dialog
    dialogProps: {
      open: isOpen,
      onClose: close
    }
  };
}

/**
 * useConfirmDialog Hook
 *
 * Specialized hook for confirmation dialogs with confirm/cancel actions.
 *
 * @example
 * const confirmDialog = useConfirmDialog({
 *   onConfirm: async () => {
 *     await deleteItem(id);
 *   }
 * });
 *
 * <Button onClick={() => confirmDialog.open({ id: 123 })}>Delete</Button>
 * <ConfirmDialog
 *   {...confirmDialog.dialogProps}
 *   onConfirm={confirmDialog.handleConfirm}
 *   loading={confirmDialog.isLoading}
 * />
 */
export function useConfirmDialog(options = {}) {
  const {
    onConfirm = null,
    onCancel = null,
    closeOnConfirm = true
  } = options;

  const dialog = useDialogState();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) {
      if (closeOnConfirm) dialog.close();
      return;
    }

    setIsConfirming(true);
    dialog.setLoading(true);

    try {
      await onConfirm(dialog.data);
      if (closeOnConfirm) {
        dialog.closeAndReset();
      }
    } catch (err) {
      dialog.setError(err.message || 'Operation failed');
    } finally {
      setIsConfirming(false);
      dialog.setLoading(false);
    }
  }, [onConfirm, dialog, closeOnConfirm]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    dialog.close();
  }, [onCancel, dialog]);

  return {
    ...dialog,
    isConfirming,
    handleConfirm,
    handleCancel,
    confirmProps: {
      open: dialog.isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      loading: dialog.isLoading
    }
  };
}

/**
 * useSnackbar Hook
 *
 * Provides snackbar/notification state management.
 * Often used alongside dialogs for feedback.
 *
 * @example
 * const snackbar = useSnackbar();
 *
 * snackbar.showSuccess('Item saved!');
 * snackbar.showError('Failed to save');
 *
 * <Snackbar {...snackbar.props}>
 *   <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
 * </Snackbar>
 */
export function useSnackbar(options = {}) {
  const {
    autoHideDuration = 6000,
    defaultSeverity = 'info'
  } = options;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState(defaultSeverity);

  const show = useCallback((msg, sev = defaultSeverity) => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, [defaultSeverity]);

  const showSuccess = useCallback((msg) => show(msg, 'success'), [show]);
  const showError = useCallback((msg) => show(msg, 'error'), [show]);
  const showWarning = useCallback((msg) => show(msg, 'warning'), [show]);
  const showInfo = useCallback((msg) => show(msg, 'info'), [show]);

  const close = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  return {
    open,
    message,
    severity,
    show,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    close,
    props: {
      open,
      autoHideDuration,
      onClose: close
    },
    alertProps: {
      severity,
      onClose: close
    }
  };
}

export default useDialogState;
