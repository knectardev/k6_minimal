# Resume Files

This directory contains the resume-related files created from the menu.json data.

## Files

- **resume.json** - Contains the project data with concise, one-paragraph summaries suitable for resume purposes
- **resume.html** - A clean, professional HTML resume page that displays the project data
- **README.md** - This documentation file

## How it was created

1. **resume.json** was created by duplicating `data/menu.json` and then processing each project's `pageSummary` field to create concise, one-paragraph summaries that highlight:
   - Key technical achievements
   - Technologies used
   - Measurable outcomes
   - Project scope and impact

2. **resume.html** is a responsive HTML page that:
   - Loads project data from resume.json
   - Displays projects organized by category
   - Shows project titles, roles, technologies, and budgets
   - Presents concise summaries in a professional format
   - Is mobile-responsive and print-friendly

## Usage

To view the resume:
1. Open `resume.html` in a web browser
2. The page will automatically load and display all projects from `resume.json`

## Customization

- Edit `resume.json` to modify project summaries or add new projects
- Modify `resume.html` to change the styling, layout, or add additional sections
- The HTML page uses vanilla JavaScript to load the JSON data, so no build process is required

## Technical Details

- The resume.json file maintains the same structure as the original menu.json
- Project summaries are optimized for resume purposes (concise, achievement-focused)
- The HTML page is self-contained with embedded CSS and JavaScript
- All projects are automatically categorized and displayed based on the JSON structure 