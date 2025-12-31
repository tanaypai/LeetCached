import React, { useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Paper, Link, Divider } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import InfoIcon from '@mui/icons-material/Info';
import { tokyoNight } from '../theme';

const sections = [
  { id: 'getting-started', label: 'Getting Started', icon: RocketLaunchIcon },
  { id: 'calendar', label: 'Calendar View', icon: CalendarMonthIcon },
  { id: 'manage', label: 'Manage Problems', icon: ListAltIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'tips', label: 'Tips & Tricks', icon: TipsAndUpdatesIcon },
  { id: 'about', label: 'About', icon: InfoIcon },
];

const helpContent = {
  'getting-started': {
    title: 'Getting Started with LeetCached',
    content: (
      <>
        <Typography variant="body2" sx={{ mb: 2, color: tokyoNight.textMuted, fontSize: 12 }}>
          LeetCached helps you master LeetCode problems using spaced repetition—a proven technique for long-term retention.
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>How to Add Problems</Typography>
        <Box component="ol" sx={{ pl: 2, mb: 2, fontSize: 11, color: tokyoNight.textMuted }}>
          <li>Navigate to any LeetCode problem page</li>
          <li>Click the "Add to LeetCached" button that appears</li>
          <li>Select a schedule preset or customize your own</li>
          <li>The problem will be added to your review schedule</li>
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>Why Spaced Repetition?</Typography>
        <Typography variant="body2" sx={{ color: tokyoNight.textMuted, fontSize: 11 }}>
          Reviewing problems at increasing intervals helps transfer knowledge from short-term to long-term memory, 
          making you better prepared for coding interviews.
        </Typography>
      </>
    ),
  },
  calendar: {
    title: 'Calendar View',
    content: (
      <>
        <Typography variant="body2" sx={{ mb: 2, color: tokyoNight.textMuted, fontSize: 12 }}>
          The calendar shows your scheduled problem reviews at a glance.
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>Features</Typography>
        <Box component="ul" sx={{ pl: 2, fontSize: 11, color: tokyoNight.textMuted }}>
          <li><strong style={{ color: tokyoNight.text }}>Color dots</strong> - Green for completed, orange for pending</li>
          <li><strong style={{ color: tokyoNight.text }}>Stats cards</strong> - See problems due today, this week, and total</li>
          <li><strong style={{ color: tokyoNight.text }}>Click dates</strong> - View and mark problems as complete</li>
          <li><strong style={{ color: tokyoNight.text }}>Navigation</strong> - Use arrows to browse months</li>
        </Box>
      </>
    ),
  },
  manage: {
    title: 'Manage Problems',
    content: (
      <>
        <Typography variant="body2" sx={{ mb: 2, color: tokyoNight.textMuted, fontSize: 12 }}>
          The Manage tab gives you full control over your problem list.
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>Capabilities</Typography>
        <Box component="ul" sx={{ pl: 2, fontSize: 11, color: tokyoNight.textMuted }}>
          <li><strong style={{ color: tokyoNight.text }}>Search</strong> - Find problems by title or difficulty</li>
          <li><strong style={{ color: tokyoNight.text }}>Sort</strong> - Click column headers to sort</li>
          <li><strong style={{ color: tokyoNight.text }}>Edit</strong> - Modify scheduled review dates</li>
          <li><strong style={{ color: tokyoNight.text }}>Delete</strong> - Remove problems you no longer want to track</li>
        </Box>
      </>
    ),
  },
  settings: {
    title: 'Settings',
    content: (
      <>
        <Typography variant="body2" sx={{ mb: 2, color: tokyoNight.textMuted, fontSize: 12 }}>
          Customize your schedule presets and preferences.
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>Schedule Presets</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: tokyoNight.textMuted, fontSize: 11 }}>
          Presets define the day intervals for your spaced repetition schedule. 
          Click any preset card to edit or delete it. Use "Add Preset" to create custom schedules.
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>Built-in Presets</Typography>
        <Box component="ul" sx={{ pl: 2, fontSize: 11, color: tokyoNight.textMuted }}>
          <li><strong style={{ color: tokyoNight.text }}>Standard</strong> - Day 1, 3, 7 (balanced approach)</li>
          <li><strong style={{ color: tokyoNight.text }}>Intensive</strong> - Day 1, 2, 4 (interview prep)</li>
          <li><strong style={{ color: tokyoNight.text }}>Relaxed</strong> - Day 2, 7, 14 (casual practice)</li>
        </Box>
      </>
    ),
  },
  tips: {
    title: 'Tips & Tricks',
    content: (
      <>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>🎯 Maximize Your Learning</Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2, fontSize: 11, color: tokyoNight.textMuted }}>
          <li>Try to solve problems without looking at your previous solution first</li>
          <li>If stuck for 15+ minutes, review the solution then retry later</li>
          <li>Focus on understanding patterns, not memorizing solutions</li>
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 12 }}>📅 Scheduling Tips</Typography>
        <Box component="ul" sx={{ pl: 2, fontSize: 11, color: tokyoNight.textMuted }}>
          <li>Use Intensive preset when preparing for upcoming interviews</li>
          <li>Use Relaxed preset for long-term skill maintenance</li>
          <li>Customize schedules for particularly challenging problems</li>
        </Box>
      </>
    ),
  },
  about: {
    title: 'About LeetCached',
    content: (
      <>
        <Typography variant="body2" sx={{ mb: 2, color: tokyoNight.textMuted, fontSize: 12 }}>
          LeetCached is a Chrome extension that helps you retain and master LeetCode problems 
          using the science of spaced repetition.
        </Typography>
        <Divider sx={{ my: 2, borderColor: tokyoNight.border }} />
        <Typography variant="body2" sx={{ color: tokyoNight.textDim, fontSize: 10 }}>
          Made with ♥ for the coding interview community
        </Typography>
        <Link
          href="https://github.com"
          target="_blank"
          rel="noopener"
          sx={{ fontSize: 10, color: tokyoNight.primary }}
        >
          View on GitHub
        </Link>
      </>
    ),
  },
};

function HelpView() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const current = helpContent[activeSection];

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <Box
        sx={{
          width: 180,
          bgcolor: tokyoNight.bgDark,
          borderRight: `1px solid ${tokyoNight.border}`,
          overflow: 'auto',
        }}
      >
        <List dense disablePadding>
          {sections.map((section) => (
            <ListItemButton
              key={section.id}
              selected={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
              sx={{
                py: 1,
                '&.Mui-selected': {
                  bgcolor: tokyoNight.surfaceHover,
                  borderRight: `2px solid ${tokyoNight.primary}`,
                },
                '&:hover': { bgcolor: tokyoNight.surfaceHover },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <section.icon sx={{ fontSize: 16, color: activeSection === section.id ? tokyoNight.primary : tokyoNight.textMuted }} />
              </ListItemIcon>
              <ListItemText
                primary={section.label}
                primaryTypographyProps={{
                  fontSize: 11,
                  fontWeight: activeSection === section.id ? 600 : 400,
                  color: activeSection === section.id ? tokyoNight.text : tokyoNight.textMuted,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Paper sx={{ p: 2, bgcolor: tokyoNight.surface }}>
          <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: tokyoNight.text }}>
            {current.title}
          </Typography>
          {current.content}
        </Paper>
      </Box>
    </Box>
  );
}

export default HelpView;
