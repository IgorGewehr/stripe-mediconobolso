'use client';

/**
 * @fileoverview DoctorFilter Component
 * @description Dropdown filter for selecting doctors in multi-clinic mode
 */

import { useMemo } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    Typography,
} from '@mui/material';
import { PersonOutline } from '@mui/icons-material';
import { useAuth } from '../../providers/authProvider';
import { useClinicPermissions } from '../../hooks/useClinicPermissions';

/**
 * Dropdown filter for selecting doctors
 * Only renders if in multi-doctor mode and has more than one accessible doctor
 *
 * @param {Object} props
 * @param {string|null} props.value - Currently selected doctor ID (null = all)
 * @param {(doctorId: string|null) => void} props.onChange - Change handler
 * @param {string} [props.label='Médico'] - Label for the dropdown
 * @param {boolean} [props.showAllOption=true] - Show "All doctors" option
 * @param {boolean} [props.disabled=false] - Disable the dropdown
 * @param {string} [props.size='small'] - Size of the dropdown
 * @param {Object} [props.sx] - Additional styles
 * @param {'schedule'|'patients'|'assign'} [props.context='schedule'] - Context for filtering doctors
 */
export function DoctorFilter({
    value,
    onChange,
    label = 'Médico',
    showAllOption = true,
    disabled = false,
    size = 'small',
    sx = {},
    context = 'schedule',
}) {
    const { isMultiDoctorClinic } = useAuth();
    const {
        isClinicAdmin,
        canViewAllSchedules,
        canViewAllPatients,
        getScheduleableDoctors,
        getAssignableDoctors,
        getPatientFilterDoctors,
    } = useClinicPermissions();

    // Get doctors based on context
    const doctors = useMemo(() => {
        switch (context) {
            case 'patients':
                return getPatientFilterDoctors();
            case 'assign':
                return getAssignableDoctors();
            case 'schedule':
            default:
                return getScheduleableDoctors();
        }
    }, [context, getScheduleableDoctors, getAssignableDoctors, getPatientFilterDoctors]);

    // Determine if "All" option should be shown
    const shouldShowAllOption = useMemo(() => {
        if (!showAllOption) return false;
        switch (context) {
            case 'patients':
                return canViewAllPatients;
            case 'assign':
                return false; // Never show "all" for assign
            case 'schedule':
            default:
                return canViewAllSchedules;
        }
    }, [showAllOption, context, canViewAllPatients, canViewAllSchedules]);

    // Don't render if not multi-doctor or only one doctor
    if (!isMultiDoctorClinic || doctors.length <= 1) {
        return null;
    }

    return (
        <FormControl
            size={size}
            sx={{ minWidth: 200, ...sx }}
            disabled={disabled}
        >
            <InputLabel id="doctor-filter-label">{label}</InputLabel>
            <Select
                labelId="doctor-filter-label"
                value={value || 'all'}
                onChange={(e) => onChange(e.target.value === 'all' ? null : e.target.value)}
                label={label}
                startAdornment={
                    <PersonOutline sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />
                }
            >
                {shouldShowAllOption && (
                    <MenuItem value="all">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>Todos os médicos</Typography>
                            <Chip
                                size="small"
                                label={doctors.length}
                                sx={{ height: 20, fontSize: '0.75rem' }}
                            />
                        </Box>
                    </MenuItem>
                )}
                {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>
                                Dr(a). {doctor.name}
                            </Typography>
                            {doctor.specialty && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ ml: 0.5 }}
                                >
                                    ({doctor.specialty})
                                </Typography>
                            )}
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export default DoctorFilter;
