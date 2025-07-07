// app/free/page.jsx
import FreeSignupForm from '../components/organismsComponents/freeSignUpForm';
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
