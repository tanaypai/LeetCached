/**
 * Extract problem number from the DOM
 */
export function extractProblemNumber() {
  const titleEl = document.querySelector('[data-cy="question-title"]');
  if (titleEl) {
    const match = titleEl.textContent?.match(/^(\d+)\./);
    if (match) return match[1];
  }
  return '';
}

/**
 * Extract problem information from the LeetCode page
 */
export function getProblemInfo() {
  // Get problem title from multiple possible sources
  let title = 'Unknown Problem';
  const titleSelectors = [
    '[data-cy="question-title"]',
    'div[class*="text-title-large"]',
    'a[class*="text-title-large"]',
    'div[data-track-load="description_content"] h4',
    '.text-lg.font-medium',
    'div[class*="title"]',
    'a[href*="/problems/"]'
  ];

  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent) {
      const text = el.textContent.trim();
      if (text && text !== 'Unknown Problem' && text.length > 0 && text.length < 200) {
        title = text;
        // Extract just the problem name if it includes number
        const match = title.match(/^\d+\.\s*(.+)$/);
        if (match) title = match[1];
        break;
      }
    }
  }

  // Fallback: try to get title from page title
  if (title === 'Unknown Problem') {
    const pageTitle = document.title;
    const titleMatch = pageTitle.match(/^(.+?)\s*[-–|]/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }

  // Get problem number from URL
  const urlMatch = window.location.pathname.match(/\/problems\/([^/]+)/);
  const problemSlug = urlMatch ? urlMatch[1] : '';
  const problemNumber = extractProblemNumber();

  // If still unknown, try to format from slug
  if (title === 'Unknown Problem' && problemSlug) {
    title = problemSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Get difficulty
  let difficulty = 'Medium';
  const difficultySelectors = [
    'div[class*="text-difficulty-easy"]',
    'div[class*="text-difficulty-medium"]', 
    'div[class*="text-difficulty-hard"]',
    'div[class*="text-olive"]',
    'div[class*="text-yellow"]',
    'div[class*="text-pink"]',
    '[class*="difficulty"]',
    '[diff]'
  ];
  
  for (const selector of difficultySelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.textContent?.toLowerCase() || '';
      const className = el.className?.toLowerCase() || '';
      if (text.includes('easy') || className.includes('easy') || className.includes('olive')) {
        difficulty = 'Easy';
        break;
      } else if (text.includes('hard') || className.includes('hard') || className.includes('pink')) {
        difficulty = 'Hard';
        break;
      } else if (text.includes('medium') || className.includes('medium') || className.includes('yellow')) {
        difficulty = 'Medium';
        break;
      }
    }
  }

  // Try to get category/topics
  let category = 'Algorithm';
  let topics = [];
  
  // Look for topic links with href="/tag/..."
  const topicLinks = document.querySelectorAll('a[href^="/tag/"]');
  if (topicLinks.length > 0) {
    topics = Array.from(topicLinks).map(el => el.textContent?.trim()).filter(Boolean);
    category = topics[0] || 'Algorithm';
  }
  
  // Fallback to old method if no topics found
  if (topics.length === 0) {
    const tagEls = document.querySelectorAll('[class*="tag"], [class*="topic"]');
    if (tagEls.length > 0) {
      topics = Array.from(tagEls).map(el => el.textContent?.trim()).filter(Boolean);
      category = topics[0] || 'Algorithm';
    }
  }

  return {
    title: problemNumber ? `${problemNumber}. ${title}` : title,
    slug: problemSlug,
    difficulty,
    category,
    topics,
    url: window.location.href
  };
}
