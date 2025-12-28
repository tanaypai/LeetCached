import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import { tokyoNight } from '../theme';

const tabs = [
  { value: 'calendar', label: 'Calendar', icon: CalendarMonthIcon },
  { value: 'manage', label: 'Manage', icon: ListAltIcon },
  { value: 'help', label: 'Help', icon: HelpOutlineIcon },
  { value: 'settings', label: 'Settings', icon: SettingsIcon },
];

function NavTabs({ activeTab, onTabChange }) {
  return (
    <Box
      sx={{
        borderBottom: `1px solid ${tokyoNight.border}`,
        bgcolor: tokyoNight.bgDark,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => onTabChange(newValue)}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          '& .MuiTabs-indicator': {
            bgcolor: tokyoNight.primary,
            height: 2,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            icon={<tab.icon sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={tab.label}
            sx={{
              minHeight: 40,
              fontSize: 11,
              fontWeight: 500,
              color: tokyoNight.textMuted,
              gap: 0.5,
              '&.Mui-selected': {
                color: tokyoNight.primary,
              },
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}

export default NavTabs;
