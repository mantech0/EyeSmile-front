import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const AnalyzingScreen: React.FC = () => {
  return (
    <Container maxWidth="sm" sx={{ my: 4, py: 4, textAlign: 'center', height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* メガネアイコン - シンプルな黒い丸メガネ */}
      <Box sx={{ mb: 4 }}>
        <svg width="120" height="60" viewBox="0 0 120 60">
          <g fill="none" stroke="black" strokeWidth="6">
            <circle cx="40" cy="30" r="20" />
            <circle cx="80" cy="30" r="20" />
            <path d="M0 30 L20 30" />
            <path d="M100 30 L120 30" />
          </g>
        </svg>
      </Box>
      
      {/* 点線の枠線内に「解析中......」のテキスト */}
      <Box 
        sx={{ 
          p: 2, 
          px: 4,
          width: '70%',
          maxWidth: '300px',
          margin: '0 auto'
        }}
      >
        <Typography variant="h6" align="center">
          解析中.......
        </Typography>
      </Box>
    </Container>
  );
};

export default AnalyzingScreen; 