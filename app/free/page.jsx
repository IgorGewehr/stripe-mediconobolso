// app/free/page.jsx
import FreeSignupForm from '../components/features/forms/FreeSignUpForm';
import { Box } from '@mui/material';

export default function Page() {
    return (
        <Box
            sx={{
                height: '100vh',          // ocupa toda a viewport
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <FreeSignupForm />
        </Box>
    );
}
