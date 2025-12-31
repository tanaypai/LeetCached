import React, { useState, useMemo } from 'react';
import { Box, Typography, IconButton, Paper, Chip, Checkbox, Link } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import UpcomingIcon from '@mui/icons-material/DateRange';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { tokyoNight } from '../theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function CalendarView({ problems }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const stats = useMemo(() => problems.getStats(), [problems]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      days.push({ day, date, isOtherMonth: true });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ day, date, isOtherMonth: false });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ day, date, isOtherMonth: true });
    }
    
    return days;
  }, [currentDate]);

  const today = formatDate(new Date());

  const navigateMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(formatDate(now));
  };

  const selectedDateProblems = useMemo(() => {
    if (!selectedDate) return [];
    return problems.getProblemsForDate(selectedDate);
  }, [selectedDate, problems]);

  const getDayProblems = (dateStr) => {
    return problems.getProblemsForDate(dateStr);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main Calendar Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5 }}>
        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <StatCard icon={TodayIcon} label="Today" value={stats.todayCount} color={tokyoNight.primary} />
          <StatCard icon={UpcomingIcon} label="This Week" value={stats.upcomingCount} color={tokyoNight.cyan} />
          <StatCard icon={AssignmentIcon} label="Total" value={stats.totalCount} color={tokyoNight.green} />
        </Box>

        {/* Calendar Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => navigateMonth(-1)}
            sx={{ 
              bgcolor: tokyoNight.surface, 
              '&:hover': { bgcolor: tokyoNight.surfaceHover } 
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => navigateMonth(1)}
            sx={{ 
              bgcolor: tokyoNight.surface, 
              '&:hover': { bgcolor: tokyoNight.surfaceHover } 
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Day Headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
          {DAYS.map((day) => (
            <Typography
              key={day}
              sx={{
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 600,
                color: tokyoNight.textDim,
                py: 0.5,
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, flex: 1 }}>
          {calendarDays.map(({ day, date, isOtherMonth }, idx) => {
            const dateStr = formatDate(date);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayProblems = getDayProblems(dateStr);
            const hasProblems = dayProblems.length > 0;
            const allCompleted = hasProblems && dayProblems.every((p) => p.isCompleted);
            const hasUncompleted = hasProblems && dayProblems.some((p) => !p.isCompleted);

            return (
              <Box
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  py: 0.5,
                  px: 0.25,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: isSelected ? `${tokyoNight.primary}20` : 'transparent',
                  border: isSelected 
                    ? `1px solid ${tokyoNight.primary}` 
                    : isToday 
                      ? `1px solid ${tokyoNight.primary}50` 
                      : '1px solid transparent',
                  opacity: isOtherMonth ? 0.4 : 1,
                  '&:hover': {
                    bgcolor: isSelected ? `${tokyoNight.primary}20` : tokyoNight.surfaceHover,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? tokyoNight.primary : tokyoNight.text,
                  }}
                >
                  {day}
                </Typography>
                {hasProblems && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      mt: 0.25,
                      bgcolor: allCompleted ? tokyoNight.green : hasUncompleted ? tokyoNight.orange : tokyoNight.textDim,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Sidebar */}
      <Box
        sx={{
          width: 260,
          borderLeft: `1px solid ${tokyoNight.border}`,
          bgcolor: tokyoNight.bgDark,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${tokyoNight.border}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokyoNight.text }}>
            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            }) : 'Select a date'}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {selectedDateProblems.length === 0 ? (
            <Typography sx={{ fontSize: 11, color: tokyoNight.textDim, textAlign: 'center', mt: 4 }}>
              No problems scheduled
            </Typography>
          ) : (
            selectedDateProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                dateStr={selectedDate}
                onToggle={() => problems.toggleCompletion(problem.id, selectedDate)}
              />
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Paper
      sx={{
        flex: 1,
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: tokyoNight.surface,
      }}
    >
      <Icon sx={{ fontSize: 20, color }} />
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color }}>{value}</Typography>
        <Typography sx={{ fontSize: 10, color: tokyoNight.textMuted }}>{label}</Typography>
      </Box>
    </Paper>
  );
}

function ProblemCard({ problem, dateStr, onToggle }) {
  const difficultyColors = {
    Easy: tokyoNight.green,
    Medium: tokyoNight.orange,
    Hard: tokyoNight.red,
  };

  return (
    <Paper
      sx={{
        p: 1,
        mb: 0.75,
        bgcolor: problem.isCompleted ? 'rgba(158, 206, 106, 0.08)' : tokyoNight.surface,
        border: problem.isCompleted ? `1px solid ${tokyoNight.green}40` : `1px solid ${tokyoNight.border}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Checkbox
          checked={problem.isCompleted}
          onChange={onToggle}
          size="small"
          sx={{
            p: 0,
            color: tokyoNight.textDim,
            '&.Mui-checked': { color: tokyoNight.green },
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Link
            href={problem.url}
            target="_blank"
            rel="noopener"
            sx={{
              fontSize: 11,
              fontWeight: 500,
              color: tokyoNight.text,
              textDecoration: problem.isCompleted ? 'line-through' : 'none',
              opacity: problem.isCompleted ? 0.7 : 1,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              '&:hover': { color: tokyoNight.primary },
            }}
          >
            {problem.title}
          </Link>
          {/* Topics */}
          {problem.topics && problem.topics.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mt: 0.25 }}>
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
                    border: `1px solid ${tokyoNight.cyan}40`,
                    '& .MuiChip-label': { px: 0.5 },
                  }}
                />
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Chip
              label={problem.difficulty}
              size="small"
              sx={{
                height: 14,
                fontSize: 8,
                borderRadius: 0.5,
                bgcolor: `${difficultyColors[problem.difficulty]}15`,
                color: difficultyColors[problem.difficulty],
                border: `1px solid ${difficultyColors[problem.difficulty]}40`,
                '& .MuiChip-label': { px: 0.5 },
              }}
            />
            <Typography sx={{ fontSize: 9, color: tokyoNight.textDim }}>
              Rep {problem.repetitionNumber}/{problem.totalRepetitions}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default CalendarView;
