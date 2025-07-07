import { Chip, Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';

const SecretaryIndicator = ({ isSecretary, secretaryName, doctorName }) => {
    if (!isSecretary) return null;

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            backgroundColor: '#E3F2FD',
            borderRadius: 2,
            border: '1px solid #2196F3'
        }}>
            <BadgeIcon sx={{ color: '#2196F3', fontSize: 20 }} />
            <Box>
                <Typography variant="caption" sx={{
                    color: '#1976D2',
                    fontWeight: 600,
                    display: 'block',
                    lineHeight: 1.2
                }}>
                    Secretária: {secretaryName}
                </Typography>
                <Typography variant="caption" sx={{
                    color: '#666',
                    fontSize: '11px',
                    lineHeight: 1.2
                }}>
                    Trabalhando para Dr. {doctorName}
                </Typography>
            </Box>
        </Box>
    );
};

export default SecretaryIndicator;