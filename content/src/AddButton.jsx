import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AddProblemModal from './AddProblemModal';
import { getProblemInfo } from './utils/problemInfo';
import { getPresets, addProblemToSchedule, isProblemScheduled } from './utils/storage';

// Tokyo Night colors
const tokyoNight = {
  purple: '#bb9af7',
  green: '#9ece6a',
  bg: '#1a1b26',
};

/**
 * AddButton component - Injected into LeetCode toolbar
 */
export default function AddButton({ extensionIconUrl }) {
  const [showModal, setShowModal] = useState(false);
  const [problemInfo, setProblemInfo] = useState(null);
  const [presets, setPresets] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load presets and check if problem is scheduled
  useEffect(() => {
    const loadData = async () => {
      const loadedPresets = await getPresets();
      setPresets(loadedPresets);
      
      const info = getProblemInfo();
      if (info.slug) {
        const scheduled = await isProblemScheduled(info.slug);
        setIsScheduled(scheduled);
      }
    };
    loadData();
  }, []);

  const handleClick = () => {
    const info = getProblemInfo();
    setProblemInfo(info);
    setShowModal(true);
  };

  const handleAdd = async (info, intervals) => {
    const success = await addProblemToSchedule(info, intervals);
    if (success) {
      setShowModal(false);
      setIsScheduled(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleSkip = () => {
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Button in toolbar */}
      <div className="leetcached-toolbar-btn">
        <div className="relative flex overflow-hidden rounded bg-fill-tertiary dark:bg-fill-tertiary ml-1.5">
          <div className="group flex flex-none items-center justify-center hover:bg-fill-quaternary dark:hover:bg-fill-quaternary rounded">
            <button
              onClick={handleClick}
              className="py-1.5 font-medium items-center whitespace-nowrap focus:outline-none inline-flex relative select-none rounded-none px-3 bg-transparent dark:bg-transparent"
              style={{ 
                color: isScheduled || showSuccess ? tokyoNight.green : tokyoNight.purple,
                transition: 'color 0.2s ease'
              }}
            >
              {extensionIconUrl && (
                <img 
                  src={extensionIconUrl} 
                  alt="LeetCached" 
                  style={{ width: 16, height: 16, marginRight: 8 }} 
                />
              )}
              <span className="text-sm font-medium">
                {showSuccess ? '✓ Added!' : isScheduled ? 'Already Scheduled' : 'Add to LeetCached'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Portal */}
      {showModal && problemInfo && createPortal(
        <AddProblemModal
          problemInfo={problemInfo}
          presets={presets}
          onClose={handleClose}
          onAdd={handleAdd}
          onSkip={handleSkip}
          extensionIconUrl={extensionIconUrl}
        />,
        document.body
      )}
    </>
  );
}
