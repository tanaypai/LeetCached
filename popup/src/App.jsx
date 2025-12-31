import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import CalendarView from './components/CalendarView';
import ManageView from './components/ManageView';
import HelpView from './components/HelpView';
import SettingsView from './components/SettingsView';
import { useProblems, useSettings } from './hooks';

function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const problems = useProblems();
  const settings = useSettings();

  const renderView = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarView problems={problems} />;
      case 'manage':
        return <ManageView problems={problems} />;
      case 'help':
        return <HelpView />;
      case 'settings':
        return <SettingsView settings={settings} />;
      default:
        return <CalendarView problems={problems} />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 580,
        maxHeight: 580,
        bgcolor: 'background.default',
      }}
    >
      <Header />
      <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderView()}
      </Box>
    </Box>
  );
}

export default App;
