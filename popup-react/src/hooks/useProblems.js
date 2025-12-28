import { useState, useEffect, useCallback } from 'react';

export function useProblems() {
  const [problems, setProblems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const result = await chrome.storage.local.get(['spacedRepProblems']);
      setProblems(result.spacedRepProblems || {});
    } catch (err) {
      console.error('Failed to load problems', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProblems = useCallback(async (newProblems) => {
    try {
      await chrome.storage.local.set({ spacedRepProblems: newProblems });
      setProblems(newProblems);
    } catch (err) {
      console.error('Failed to save problems', err);
    }
  }, []);

  const toggleCompletion = useCallback(async (problemId, dateStr) => {
    const problem = problems[problemId];
    if (!problem) return;

    const completedDates = problem.completedDates || [];
    const isCompleted = completedDates.includes(dateStr);
    
    const newProblems = {
      ...problems,
      [problemId]: {
        ...problem,
        completedDates: isCompleted
          ? completedDates.filter((d) => d !== dateStr)
          : [...completedDates, dateStr],
      },
    };
    
    await saveProblems(newProblems);
  }, [problems, saveProblems]);

  const deleteProblem = useCallback(async (problemId) => {
    const newProblems = { ...problems };
    delete newProblems[problemId];
    await saveProblems(newProblems);
  }, [problems, saveProblems]);

  const updateProblemDates = useCallback(async (problemId, newDates) => {
    const problem = problems[problemId];
    if (!problem) return;

    if (newDates.length === 0) {
      await deleteProblem(problemId);
    } else {
      const newProblems = {
        ...problems,
        [problemId]: {
          ...problem,
          scheduledDates: newDates.sort(),
        },
      };
      await saveProblems(newProblems);
    }
  }, [problems, saveProblems, deleteProblem]);

  const getProblemsForDate = useCallback((dateStr) => {
    const result = [];
    for (const [problemId, problem] of Object.entries(problems)) {
      if (problem.scheduledDates?.includes(dateStr)) {
        const repIndex = problem.scheduledDates.indexOf(dateStr);
        const isCompleted = problem.completedDates?.includes(dateStr);
        result.push({
          ...problem,
          id: problemId,
          repetitionNumber: repIndex + 1,
          totalRepetitions: problem.scheduledDates.length,
          isCompleted,
        });
      }
    }
    return result;
  }, [problems]);

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    let todayCount = 0;
    let upcomingCount = 0;
    let totalCount = Object.keys(problems).length;

    for (const problem of Object.values(problems)) {
      for (const date of problem.scheduledDates || []) {
        const isCompleted = problem.completedDates?.includes(date);
        if (!isCompleted) {
          if (date === today) todayCount++;
          if (date >= today && date <= weekEndStr) upcomingCount++;
        }
      }
    }

    return { todayCount, upcomingCount, totalCount };
  }, [problems]);

  return {
    problems,
    loading,
    saveProblems,
    toggleCompletion,
    deleteProblem,
    updateProblemDates,
    getProblemsForDate,
    getStats,
    reload: loadProblems,
  };
}

export default useProblems;
