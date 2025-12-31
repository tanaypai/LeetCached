import React, { useState, useMemo } from 'react';
import {
  Box, Typography, TextField, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, IconButton, Chip, Link, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { tokyoNight } from '../theme';

function ManageView({ problems }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('nextDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [editDates, setEditDates] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  const problemsList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return Object.entries(problems.problems).map(([id, problem]) => {
      const nextDate = problem.scheduledDates?.find((d) => {
        const isCompleted = problem.completedDates?.includes(d);
        return !isCompleted && d >= today;
      }) || null;
      
      const completedCount = (problem.completedDates || []).filter((d) =>
        problem.scheduledDates?.includes(d)
      ).length;

      return {
        ...problem,
        id,
        nextDate,
        completedCount,
        totalCount: problem.scheduledDates?.length || 0,
      };
    });
  }, [problems.problems]);

  const filteredProblems = useMemo(() => {
    let filtered = problemsList;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title?.toLowerCase().includes(query) ||
        p.difficulty?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        case 'difficulty':
          const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
          aVal = diffOrder[a.difficulty] || 0;
          bVal = diffOrder[b.difficulty] || 0;
          break;
        case 'progress':
          aVal = a.totalCount > 0 ? a.completedCount / a.totalCount : 0;
          bVal = b.totalCount > 0 ? b.completedCount / b.totalCount : 0;
          break;
        case 'nextDate':
        default:
          aVal = a.nextDate || 'zzzz';
          bVal = b.nextDate || 'zzzz';
          break;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [problemsList, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredProblems.length / pageSize);
  const paginatedProblems = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage, pageSize]);

  // Reset to page 0 when search changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openEditModal = (problem) => {
    setEditingProblem(problem);
    setEditDates([...(problem.scheduledDates || [])]);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProblem(null);
    setEditDates([]);
  };

  const saveEditChanges = async () => {
    if (!editingProblem) return;
    await problems.updateProblemDates(editingProblem.id, editDates);
    closeEditModal();
  };

  const deleteProblem = async () => {
    if (!editingProblem) return;
    await problems.deleteProblem(editingProblem.id);
    closeEditModal();
  };

  const addDate = () => {
    const lastDate = editDates.length > 0
      ? new Date(editDates[editDates.length - 1])
      : new Date();
    lastDate.setDate(lastDate.getDate() + 1);
    setEditDates([...editDates, lastDate.toISOString().split('T')[0]]);
  };

  const removeDate = (index) => {
    setEditDates(editDates.filter((_, i) => i !== index));
  };

  const updateDate = (index, newDate) => {
    const newDates = [...editDates];
    newDates[index] = newDate;
    setEditDates(newDates.sort());
  };

  const difficultyColors = {
    Easy: tokyoNight.green,
    Medium: tokyoNight.orange,
    Hard: tokyoNight.red,
  };

  const getNextDateDisplay = (dateStr) => {
    if (!dateStr) return { text: 'Completed', color: tokyoNight.green };
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return { text: 'Today', color: tokyoNight.primary };
    if (dateStr < today) return { text: 'Overdue', color: tokyoNight.red };
    
    const date = new Date(dateStr + 'T00:00:00');
    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: tokyoNight.textMuted,
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1.5 }}>
      {/* Search */}
      <TextField
        placeholder="Search problems..."
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: tokyoNight.textDim }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            fontSize: 12,
            bgcolor: tokyoNight.surface,
          },
        }}
      />

      {/* Empty State */}
      {problemsList.length === 0 ? (
        <Paper 
          sx={{ 
            bgcolor: tokyoNight.surface, 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokyoNight.text, mb: 1 }}>
            No problems scheduled
          </Typography>
          <Typography sx={{ fontSize: 11, color: tokyoNight.textDim, textAlign: 'center' }}>
            Visit a LeetCode problem and click "Add to LeetCached" to start tracking your reviews.
          </Typography>
        </Paper>
      ) : (
      /* Table */
      <Paper sx={{ bgcolor: tokyoNight.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 'calc(100% - 52px)' }}>
        <TableContainer sx={{ overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: tokyoNight.bgDark, fontSize: 11, fontWeight: 600, width: '45%' }}>
                <TableSortLabel
                  active={sortField === 'title'}
                  direction={sortField === 'title' ? sortDirection : 'asc'}
                  onClick={() => handleSort('title')}
                >
                  Problem
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: tokyoNight.bgDark, fontSize: 11, fontWeight: 600 }}>
                <TableSortLabel
                  active={sortField === 'difficulty'}
                  direction={sortField === 'difficulty' ? sortDirection : 'asc'}
                  onClick={() => handleSort('difficulty')}
                >
                  Difficulty
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: tokyoNight.bgDark, fontSize: 11, fontWeight: 600 }}>
                <TableSortLabel
                  active={sortField === 'progress'}
                  direction={sortField === 'progress' ? sortDirection : 'asc'}
                  onClick={() => handleSort('progress')}
                >
                  Progress
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: tokyoNight.bgDark, fontSize: 11, fontWeight: 600 }}>
                <TableSortLabel
                  active={sortField === 'nextDate'}
                  direction={sortField === 'nextDate' ? sortDirection : 'asc'}
                  onClick={() => handleSort('nextDate')}
                >
                  Next
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: tokyoNight.bgDark, fontSize: 11, fontWeight: 600, width: 50 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProblems.map((problem) => {
              const nextDisplay = getNextDateDisplay(problem.nextDate);
              return (
                <TableRow key={problem.id} hover sx={{ '& td': { py: 1.25 } }}>
                  <TableCell sx={{ fontSize: 11 }}>
                    <Link
                      href={problem.url}
                      target="_blank"
                      rel="noopener"
                      sx={{
                        color: tokyoNight.text,
                        textDecoration: 'none',
                        '&:hover': { color: tokyoNight.primary },
                      }}
                    >
                      {problem.title}
                    </Link>
                    {/* Topics */}
                    {problem.topics && problem.topics.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.5 }}>
                        {problem.topics.slice(0, 2).map((topic, idx) => (
                          <Chip
                            key={idx}
                            label={topic}
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: 8,
                              borderRadius: 0.5,
                              bgcolor: `${tokyoNight.cyan}15`,
                              color: tokyoNight.cyan,
                              border: `1px solid ${tokyoNight.cyan}50`,
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={problem.difficulty}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 10,
                        borderRadius: 0.5,
                        bgcolor: `${difficultyColors[problem.difficulty]}15`,
                        color: difficultyColors[problem.difficulty],
                        border: `1px solid ${difficultyColors[problem.difficulty]}50`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 11 }}>
                    {problem.completedCount}/{problem.totalCount}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 11, color: nextDisplay.color }}>
                      {nextDisplay.text}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEditModal(problem)}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </TableContainer>

      {/* Pagination Footer */}
        <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          bgcolor: tokyoNight.bgDark,
          borderRadius: '0 0 4px 4px',
        }}
      >
        <Typography sx={{ fontSize: 10, color: tokyoNight.textDim }}>
          Showing{' '}
          <Box component="span" sx={{ fontWeight: 600, color: tokyoNight.text }}>
            {filteredProblems.length === 0 ? 0 : currentPage * pageSize + 1}
          </Box>
          {' '}to{' '}
          <Box component="span" sx={{ fontWeight: 600, color: tokyoNight.text }}>
            {Math.min((currentPage + 1) * pageSize, filteredProblems.length)}
          </Box>
          {' '}of{' '}
          <Box component="span" sx={{ fontWeight: 600, color: tokyoNight.text }}>
            {filteredProblems.length}
          </Box>
          {' '}problems
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(currentPage - 1)}
            startIcon={<ChevronLeftIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: 10,
              minWidth: 'auto',
              px: 1,
              py: 0.25,
              bgcolor: tokyoNight.surface,
              color: currentPage === 0 ? tokyoNight.textDim : tokyoNight.text,
              '&:hover': { bgcolor: tokyoNight.surfaceHover },
              '&.Mui-disabled': { color: tokyoNight.textDim, opacity: 0.5 },
            }}
          >
            Prev
          </Button>
          <Button
            size="small"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(currentPage + 1)}
            endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontSize: 10,
              minWidth: 'auto',
              px: 1,
              py: 0.25,
              bgcolor: tokyoNight.surface,
              color: currentPage >= totalPages - 1 ? tokyoNight.textDim : tokyoNight.text,
              '&:hover': { bgcolor: tokyoNight.surfaceHover },
              '&.Mui-disabled': { color: tokyoNight.textDim, opacity: 0.5 },
            }}
          >
            Next
          </Button>
        </Box>
        </Box>
      </Paper>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onClose={closeEditModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 14, bgcolor: tokyoNight.bgDark, borderBottom: `1px solid ${tokyoNight.border}` }}>
          Edit Scheduled Dates
        </DialogTitle>
        <DialogContent sx={{ bgcolor: tokyoNight.surface, pt: 3, pb: 1 }}>
          {editingProblem && (
            <Box>
              {/* Problem title */}
              <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 2, mt: 2, color: tokyoNight.text }}>
                {editingProblem.title}
              </Typography>
              
              <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1, color: tokyoNight.textMuted }}>
                Scheduled Reviews
              </Typography>
              
              {/* Timeline layout */}
              <Box sx={{ mb: 1 }}>
                {editDates.map((date, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      position: 'relative',
                      mb: index < editDates.length - 1 ? 1 : 0,
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
                    {index < editDates.length - 1 && (
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
                        type="date"
                        size="small"
                        value={date}
                        onChange={(e) => updateDate(index, e.target.value)}
                        inputProps={{ style: { fontSize: 11, padding: '4px 8px' } }}
                        sx={{ 
                          flex: 1,
                          '& .MuiOutlinedInput-root': { height: 28 },
                        }}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => removeDate(index)} 
                        sx={{ 
                          p: 0.25,
                          color: tokyoNight.red,
                          '&:hover': { bgcolor: `${tokyoNight.red}15` },
                        }}
                      >
                        <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
              
              <Button
                startIcon={<AddIcon />}
                size="small"
                onClick={addDate}
                sx={{ fontSize: 11, ml: 3.5 }}
              >
                Add Date
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: tokyoNight.bgDark, borderTop: `1px solid ${tokyoNight.border}` }}>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            size="small"
            onClick={deleteProblem}
            sx={{ mr: 'auto', fontSize: 11 }}
          >
            Delete Problem
          </Button>
          <Button onClick={closeEditModal} size="small" sx={{ fontSize: 11 }}>
            Cancel
          </Button>
          <Button onClick={saveEditChanges} variant="contained" size="small" sx={{ fontSize: 11 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManageView;
