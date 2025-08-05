'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '@/contexts/AuthContext';

const theme = createTheme({
  components: {
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '12px 16px',
          borderRadius: '8px',
          '&:focus': {
            borderRadius: '8px',
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
            borderWidth: '2px',
          }
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
          borderRadius: '8px',
          margin: '2px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }
        }
      }
    }
  }
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
} 