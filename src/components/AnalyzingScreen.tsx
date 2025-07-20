import React from 'react';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';

interface AnalyzingScreenProps {
  progress: number;
  message: string;
}

const AnalyzingScreen: React.FC<AnalyzingScreenProps> = ({ progress, message }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        backgroundColor: '#f5f5f5',
        margin: 0,
        padding: 0,
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        {message}
      </Typography>
      
      <Box sx={{ width: '80%', maxWidth: 400, mt: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#1976d2',
              borderRadius: 5
            }
          }} 
        />
        <Typography variant="body2" align="center" sx={{ mt: 1 }}>
          {progress}%
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyzingScreen; 