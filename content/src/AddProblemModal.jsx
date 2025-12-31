import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography, TextField, IconButton, Tooltip, Chip, Button } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  timelineOppositeContentClasses,
} from '@mui/lab';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// Tokyo Night theme
const tokyoNight = {
  bg: '#1a1b26',
  bgDark: '#16161e',
  surface: '#24283b',
  surfaceHover: '#292e42',
  primary: '#7aa2f7',
  primaryHover: '#89b4fa',
  secondary: '#bb9af7',
  text: '#c0caf5',
  textMuted: '#9aa5ce',
  textDim: '#565f89',
  border: '#414868',
  green: '#9ece6a',
  cyan: '#7dcfff',
  orange: '#ff9e64',
  red: '#f7768e',
  yellow: '#e0af68',
  gold: '#efab4e',
};

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: tokyoNight.primary },
    background: { default: tokyoNight.bg, paper: tokyoNight.surface },
    text: { primary: tokyoNight.text, secondary: tokyoNight.textMuted },
  },
  typography: {
    fontFamily: '"JetBrains Mono", monospace',
  },
});

// Default presets
const DEFAULT_PRESETS = [
  { id: 'standard', name: 'Standard', intervals: [1, 3, 7] },
  { id: 'intensive', name: 'Intensive', intervals: [1, 2, 4] },
  { id: 'relaxed', name: 'Relaxed', intervals: [2, 7, 14] },
];

function AddProblemModal({ 
  problemInfo = {}, 
  onClose, 
  onAdd, 
  onSkip,
  presets = DEFAULT_PRESETS,
  extensionIconUrl = '' 
}) {
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id || 'standard');
  const [isEditMode, setIsEditMode] = useState(false);
  const [customIntervals, setCustomIntervals] = useState([1, 3, 7]);
  const [isAdded, setIsAdded] = useState(false);
  const [editableDates, setEditableDates] = useState([]);

  // All presets including custom option
  const allPresets = useMemo(() => [
    ...presets,
    { id: 'custom', name: 'Custom', intervals: customIntervals },
  ], [presets, customIntervals]);

  // Get current intervals (from presets)
  const currentIntervals = useMemo(() => {
    if (selectedPresetId === 'custom') {
      return customIntervals;
    }
    const preset = presets.find(p => p.id === selectedPresetId);
    return preset?.intervals || [1, 3, 7];
  }, [selectedPresetId, presets, customIntervals]);

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert intervals to dates
  const intervalsToDateStrings = (intervals) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return intervals.map(days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return formatDateLocal(date);
    });
  };

  // Convert dates back to intervals (days from today)
  const dateStringsToIntervals = (dateStrings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateStrings.map(dateStr => {
      // Parse date string as local date
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const diffTime = date - today;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays); // At least 1 day
    }).sort((a, b) => a - b);
  };

  // Sync editableDates when entering edit mode or changing preset
  useEffect(() => {
    setEditableDates(intervalsToDateStrings(currentIntervals));
  }, [selectedPresetId]);

  // Handle entering/exiting edit mode
  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode - convert dates back to intervals and save to custom
      const validDates = editableDates.filter(d => d && d.length > 0).sort();
      if (validDates.length > 0) {
        const newIntervals = dateStringsToIntervals(validDates);
        setCustomIntervals(newIntervals);
        setSelectedPresetId('custom');
      }
    } else {
      // Entering edit mode - convert current intervals to dates
      setEditableDates(intervalsToDateStrings(currentIntervals));
    }
    setIsEditMode(!isEditMode);
  };

  // Handle changing a date value
  const handleDateChange = (index, value) => {
    const newDates = [...editableDates];
    newDates[index] = value;
    setEditableDates(newDates.sort());
  };

  // Handle adding a new date
  const handleAddDate = () => {
    let lastDate;
    if (editableDates.length > 0) {
      const lastDateStr = editableDates[editableDates.length - 1];
      const [year, month, day] = lastDateStr.split('-').map(Number);
      lastDate = new Date(year, month - 1, day);
    } else {
      lastDate = new Date();
    }
    lastDate.setDate(lastDate.getDate() + 7); // Add 7 days after last
    setEditableDates([...editableDates, formatDateLocal(lastDate)].sort());
  };

  // Handle removing a date
  const handleRemoveDate = (index) => {
    if (editableDates.length > 1) {
      const newDates = editableDates.filter((_, i) => i !== index);
      setEditableDates(newDates);
    }
  };

  // Compute preview dates with labels
  const previewDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const datesToUse = isEditMode ? editableDates : intervalsToDateStrings(currentIntervals);
    
    return datesToUse.map((isoDate, idx) => {
      // Parse as local date
      const [year, month, day] = isoDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const diffTime = date - today;
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let label;
      if (days === 1) {
        label = 'Tomorrow';
      } else if (days < 7) {
        label = `In ${days} days`;
      } else if (days === 7) {
        label = 'In 1 week';
      } else if (days < 30) {
        const weeks = Math.round(days / 7);
        label = `In ${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.round(days / 30);
        label = `In ${months} month${months > 1 ? 's' : ''}`;
      }
      
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return { days, label, dateStr, date, isoDate, index: idx };
    });
  }, [currentIntervals, isEditMode, editableDates]);

  const getDifficultyClass = (difficulty) => {
    return (difficulty || 'medium').toLowerCase();
  };

  const handleAdd = () => {
    if (onAdd) {
      onAdd(problemInfo, currentIntervals);
    }
    setIsAdded(true);
    setTimeout(() => {
      onClose?.();
    }, 1200);
  };

  const handleSkip = () => {
    onSkip?.();
    onClose?.();
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('lc-modal-overlay')) {
      onClose?.();
    }
  };

  const logoUrl = extensionIconUrl || (typeof chrome !== 'undefined' && chrome.runtime 
    ? chrome.runtime.getURL('icons/icon48.png') 
    : '');

  return (
    <ThemeProvider theme={theme}>
      <div className="lc-modal-overlay" onClick={handleOverlayClick}>
        <div className="lc-modal">
          {/* Header with Logo */}
          <div className="lc-modal-header">
            <div className="lc-header-brand">
              {logoUrl && <img src={logoUrl} alt="LeetCached" className="lc-logo" />}
              <h2 className="lc-header-title">Leet<span style={{ color: tokyoNight.gold }}>Cached</span></h2>
            </div>
            <button className="lc-close-btn" onClick={onClose} title="Close">
              &times;
            </button>
          </div>

          {/* Body */}
          <div className="lc-modal-body">
            {/* Problem Info */}
            <div className="lc-problem-info">
              <div className="lc-problem-meta">
                <span className={`lc-difficulty ${getDifficultyClass(problemInfo.difficulty)}`}>
                  {problemInfo.difficulty || 'Medium'}
                </span>
              </div>
              <h3 className="lc-problem-title">{problemInfo.title || 'Unknown Problem'}</h3>
              {problemInfo.topics?.length > 0 && (
                <div className="lc-topics-row">
                  {problemInfo.topics.map((topic, idx) => (
                    <span key={idx} className="lc-topic-tag">{topic}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule Presets */}
            <div>
              <span className="lc-section-label">Schedule Preset</span>
              <div className="lc-schedule-grid">
                {allPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`lc-schedule-option ${selectedPresetId === preset.id ? 'active' : ''}`}
                    onClick={() => setSelectedPresetId(preset.id)}
                  >
                    <div className="lc-schedule-card">
                      <div className="lc-schedule-card-header">
                        <span className="lc-schedule-card-title">{preset.name}</span>
                        <div className="lc-radio-indicator"></div>
                      </div>
                      {preset.id === 'custom' ? (
                        <span className="lc-schedule-card-desc">Set your own intervals</span>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {preset.intervals.map((interval, idx) => (
                            <Chip
                              key={idx}
                              label={`Day ${interval}`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 9,
                                borderRadius: 1,
                                bgcolor: `${tokyoNight.primary}15`,
                                color: tokyoNight.primary,
                                border: `1px solid ${tokyoNight.primary}50`,
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Reviews Timeline - MUI */}
            <div className="lc-preview">
              <div className="lc-preview-header">
                <span className="lc-preview-title">Upcoming Reviews</span>
                <Tooltip title={isEditMode ? 'Save changes' : 'Edit dates'}>
                  <IconButton 
                    size="small"
                    onClick={handleToggleEditMode}
                    sx={{ 
                      color: tokyoNight.primary,
                      p: 0.5,
                      '&:hover': { bgcolor: `${tokyoNight.primary}20` }
                    }}
                  >
                    {isEditMode ? <CheckIcon sx={{ fontSize: 16 }} /> : <EditIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              </div>
              
              {/* Box-based Timeline (same as ManageView) */}
              <Box sx={{ mb: 1 }}>
                {previewDates.map((item, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      position: 'relative',
                      mb: index < previewDates.length - 1 ? 1 : 0,
                    }}
                  >
                    {/* Timeline dot */}
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: tokyoNight.primary,
                        boxShadow: `0 0 8px ${tokyoNight.primary}40`,
                        flexShrink: 0,
                        mr: 1.5,
                        zIndex: 1,
                      }}
                    />
                    
                    {/* Connector line */}
                    {index < previewDates.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 4,
                          top: '50%',
                          width: 2,
                          height: 'calc(100% + 8px)',
                          bgcolor: tokyoNight.border,
                        }}
                      />
                    )}
                    
                    {/* Content row */}
                    {isEditMode ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Chip
                          label={`Rep ${index + 1}`}
                          size="small"
                          sx={{ 
                            height: 22, 
                            fontSize: 10,
                            fontWeight: 500,
                            borderRadius: 1,
                            bgcolor: `${tokyoNight.primary}15`, 
                            color: tokyoNight.primary,
                            border: `1px solid ${tokyoNight.primary}50`,
                            minWidth: 52,
                          }}
                        />
                        <TextField
                          type="date"
                          size="small"
                          value={item.isoDate}
                          onChange={(e) => handleDateChange(index, e.target.value)}
                          inputProps={{ style: { fontSize: 11, padding: '4px 8px' } }}
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': { height: 28 },
                          }}
                        />
                        {editableDates.length > 1 && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveDate(index)} 
                            sx={{ 
                              p: 0.25,
                              color: tokyoNight.red,
                              '&:hover': { bgcolor: `${tokyoNight.red}15` },
                            }}
                          >
                            <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: index === 0 ? tokyoNight.text : tokyoNight.textMuted,
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: tokyoNight.textDim,
                          }}
                        >
                          {item.dateStr}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
              
              {/* Add new date button in edit mode */}
              {isEditMode && (
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={handleAddDate}
                  sx={{ fontSize: 11, ml: 3.5, textTransform: 'none' }}
                >
                  Add Date
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="lc-modal-footer">
            <button className="lc-btn lc-btn-secondary" onClick={handleSkip}>
              Skip Problem
            </button>
            <button 
              className={`lc-btn ${isAdded ? 'lc-btn-success' : 'lc-btn-primary'}`}
              onClick={handleAdd}
              disabled={isAdded}
            >
              {isAdded ? '✓ Added' : 'Add to Schedule'}
            </button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default AddProblemModal;
