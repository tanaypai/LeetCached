# LeetCached

A Chrome extension that helps you retain LeetCode solutions through spaced repetition scheduling.

## Features

- **Automatic Detection**: Detects when you successfully submit a LeetCode problem
- **Spaced Repetition Scheduling**: Automatically schedules review dates using proven spaced repetition intervals (1, 3, 7, 14, 30 days)
- **Calendar View**: Visual calendar showing upcoming problems to review
- **Badge Notifications**: Shows count of problems due for review today
- **Problem Management**: Edit, reschedule, or remove problems from your review list
- **Custom Intervals**: Configure your own spaced repetition intervals

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The LeetCached icon will appear in your toolbar

## Usage

1. **Solve a LeetCode problem** - Navigate to any problem on [leetcode.com](https://leetcode.com) and submit your solution
2. **Add to schedule** - When your submission is accepted, a modal will appear asking if you want to add it to your spaced repetition schedule
3. **Choose your interval** - Select a preset interval or configure custom review dates
4. **Review problems** - Click the extension icon to see your calendar and upcoming reviews
5. **Stay on track** - The badge on the extension icon shows how many problems are due today

## How Spaced Repetition Works

Spaced repetition is a learning technique that involves reviewing material at increasing intervals:

| Review | Interval |
|--------|----------|
| 1st | 1 day |
| 2nd | 3 days |
| 3rd | 7 days |
| 4th | 14 days |
| 5th | 30 days |

This pattern helps transfer knowledge from short-term to long-term memory, making it ideal for retaining coding patterns and problem-solving techniques.

## Privacy

LeetCached respects your privacy:
- All data is stored **locally** on your device using Chrome's storage API
- **No data is sent** to external servers
- **No tracking** or analytics
- **No account required**

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Store your tracked problems and review schedule locally |
| `tabs` | Display badge notification with count of problems due today |
| `host_permissions` (leetcode.com) | Detect accepted submissions on LeetCode problem pages |

## Development

### Project Structure
```
LeetCached/
├── manifest.json        # Extension configuration
├── background/
│   └── background.js    # Service worker for badge updates
├── content/
│   ├── content.js       # Submission detection on LeetCode
│   └── content.css      # Modal styling
├── popup/
│   ├── popup.html       # Extension popup UI
│   ├── popup.js         # Calendar and problem management
│   └── popup.css        # Popup styling
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Building
No build step required - the extension runs directly from source.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use and modify as needed.
