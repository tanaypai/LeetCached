import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { tokyoNight } from '../theme';

function Header() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    try {
      const manifest = chrome.runtime.getManifest();
      setVersion(manifest.version);
    } catch (err) {
      setVersion('1.1.0');
    }
  }, []);

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1.75,
        py: 1.25,
        bgcolor: tokyoNight.bgDark,
        borderBottom: `1px solid ${tokyoNight.border}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="img"
            src="../icons/icon48.png"
            alt="LeetCached"
            sx={{ width: 28, height: 28, objectFit: 'contain' }}
          />
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: tokyoNight.text,
            letterSpacing: '-0.5px',
          }}
        >
          Leet<Box component="span" sx={{ color: tokyoNight.gold }}>Cached</Box>
        </Typography>
      </Box>
    </Box>
  );
}

export default Header;
