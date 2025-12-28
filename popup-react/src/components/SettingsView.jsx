import React, { useState } from 'react';
import {
  Box, Typography, Paper, Grid, IconButton, Chip, Button, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { tokyoNight } from '../theme';

const presetDescriptions = {
  Standard: 'Balanced approach for steady retention',
  Intensive: 'Rapid review for interview preparation',
  Relaxed: 'Gentle schedule for casual practice',
};

function SettingsView({ settings }) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editName, setEditName] = useState('');
  const [editIntervals, setEditIntervals] = useState([]);

  const openEditModal = (preset, index) => {
    setEditingPreset(preset);
    setEditingIndex(index);
    setEditName(preset.name);
    setEditIntervals([...preset.intervals]);
    setEditModalOpen(true);
  };

  const openAddModal = () => {
    setEditingPreset(null);
    setEditingIndex(-1);
    setEditName('');
    setEditIntervals([1, 3, 7]);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingPreset(null);
    setEditName('');
    setEditIntervals([]);
  };

  const savePreset = async () => {
    const newPreset = { 
      id: editingPreset?.id || 'custom_' + Date.now(), 
      name: editName, 
      intervals: editIntervals 
    };
    
    if (editingIndex >= 0) {
      await settings.updatePreset(editingIndex, newPreset);
    } else {
      await settings.addPreset(newPreset);
    }
    closeEditModal();
  };

  const deletePreset = async () => {
    if (editingIndex >= 0) {
      await settings.deletePreset(editingIndex);
      closeEditModal();
    }
  };

  const addInterval = () => {
    const lastInterval = editIntervals[editIntervals.length - 1] || 0;
    setEditIntervals([...editIntervals, lastInterval + 7]);
  };

  const removeInterval = (index) => {
    if (editIntervals.length > 1) {
      setEditIntervals(editIntervals.filter((_, i) => i !== index));
    }
  };

  const updateInterval = (index, value) => {
    const newIntervals = [...editIntervals];
    newIntervals[index] = Math.max(1, parseInt(value) || 1);
    setEditIntervals(newIntervals);
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1.5 }}>
      {/* Auto-Detect Section */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          bgcolor: tokyoNight.surface,
          border: `1px solid ${tokyoNight.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokyoNight.text }}>
            Auto-Detect Submissions
          </Typography>
          <Typography sx={{ fontSize: 10, color: tokyoNight.textDim, mt: 0.25 }}>
            Automatically add problems when you solve them on LeetCode
          </Typography>
        </Box>
        <Switch
          checked={settings.autoDetect ?? true}
          onChange={(e) => settings.saveAutoDetect(e.target.checked)}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: tokyoNight.primary,
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              bgcolor: tokyoNight.primary,
            },
          }}
        />
      </Paper>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600 }}>
          Schedule Presets
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<AddIcon />}
            size="small"
            variant="contained"
            onClick={openAddModal}
            sx={{ fontSize: 11 }}
          >
            Add Preset
          </Button>
          <Button
            startIcon={<RestartAltIcon />}
            size="small"
            variant="outlined"
            onClick={settings.resetSettings}
            sx={{ fontSize: 11 }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* Presets Grid */}
      <Grid container spacing={1.5}>
        {settings.presets.map((preset, index) => (
          <Grid item xs={6} key={preset.id}>
            <PresetCard
              preset={preset}
              description={presetDescriptions[preset.name]}
              onEdit={() => openEditModal(preset, index)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Edit/Add Modal */}
      <Dialog open={editModalOpen} onClose={closeEditModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 14, bgcolor: tokyoNight.bgDark, borderBottom: `1px solid ${tokyoNight.border}` }}>
          {editingPreset ? 'Edit Preset' : 'Add Preset'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: tokyoNight.surface, pt: 3, pb: 1 }}>
          <TextField
            fullWidth
            label="Preset Name"
            size="small"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mb: 2, mt: 2, '& input': { fontSize: 12 } }}
          />
          
          <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>Review Schedule</Typography>
          
          {/* Custom timeline layout */}
          <Box sx={{ mb: 1 }}>
            {editIntervals.map((interval, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  position: 'relative',
                  mb: index < editIntervals.length - 1 ? 1 : 0,
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
                
                {/* Connector line (absolute positioned) */}
                {index < editIntervals.length - 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 4,
                      top: '50%',
                      width: 2,
                      height: 'calc(100% + 12px)',
                      bgcolor: tokyoNight.border,
                    }}
                  />
                )}
                
                {/* Content row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Chip
                    label={`Rep ${index + 1}`}
                    size="small"
                    sx={{ 
                      height: 22, 
                      fontSize: 10,
                      fontWeight: 500,
                      borderRadius: 0.5,
                      bgcolor: `${tokyoNight.primary}15`, 
                      color: tokyoNight.primary,
                      border: `1px solid ${tokyoNight.primary}50`,
                      minWidth: 52,
                    }}
                  />
                  <TextField
                    type="number"
                    size="small"
                    value={interval}
                    onChange={(e) => updateInterval(index, e.target.value)}
                    inputProps={{ min: 1, style: { fontSize: 11, textAlign: 'center', padding: '4px 8px' } }}
                    sx={{ 
                      width: 60,
                      '& .MuiOutlinedInput-root': { height: 28 },
                    }}
                  />
                  <Typography sx={{ fontSize: 11, color: tokyoNight.textMuted }}>days</Typography>
                  {editIntervals.length > 1 && (
                    <IconButton 
                      size="small" 
                      onClick={() => removeInterval(index)} 
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
              </Box>
            ))}
          </Box>

          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={addInterval}
            sx={{ fontSize: 11, ml: 3.5 }}
          >
            Add Stage
          </Button>
        </DialogContent>
        <DialogActions sx={{ bgcolor: tokyoNight.bgDark, borderTop: `1px solid ${tokyoNight.border}` }}>
          {editingPreset && (
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              size="small"
              onClick={deletePreset}
              sx={{ mr: 'auto', fontSize: 11 }}
            >
              Delete
            </Button>
          )}
          <Button onClick={closeEditModal} size="small" sx={{ fontSize: 11 }}>
            Cancel
          </Button>
          <Button 
            onClick={savePreset} 
            variant="contained" 
            size="small" 
            sx={{ fontSize: 11 }}
            disabled={!editName.trim() || editIntervals.length === 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function PresetCard({ preset, description, onEdit }) {
  return (
    <Paper
      sx={{
        p: 1.5,
        bgcolor: tokyoNight.surface,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: tokyoNight.surfaceHover,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={onEdit}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokyoNight.text }}>
            {preset.name}
          </Typography>
          <Typography sx={{ fontSize: 10, color: tokyoNight.textDim, mb: 1 }}>
            {description || 'Custom schedule'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <EditIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {preset.intervals.map((interval, idx) => (
          <Chip
            key={idx}
            label={`Day ${interval}`}
            size="small"
            sx={{
              height: 18,
              fontSize: 9,
              borderRadius: 0.5,
              bgcolor: `${tokyoNight.primary}15`,
              color: tokyoNight.primary,
              border: `1px solid ${tokyoNight.primary}50`,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}

export default SettingsView;
