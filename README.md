# Knectar Portfolio

A modern, responsive portfolio website showcasing web development and design projects.

## Features

- **Interactive Design**: Dynamic lines animation and modern UI
- **Project Showcase**: Comprehensive portfolio with categorized projects
- **Responsive Layout**: Mobile-first design approach
- **Performance Optimized**: Optimized images and assets

## Image Optimization

This project includes automated image optimization using the TinyPNG API to reduce file sizes while preserving quality.

### Optimization Process

The project uses a conservative approach to image optimization:

- **Size Threshold**: Only optimizes files larger than 200KB
- **Quality Preservation**: Skips files that would lose more than 30% of their size (to preserve quality)
- **Supported Formats**: PNG, JPG, JPEG, WebP
- **API Integration**: Uses TinyPNG API for professional-grade optimization

### Optimization Scripts

Several scripts are available for image optimization:

- `scripts/optimize_conservative.py` - Main conservative optimization script
- `scripts/test_conservative.py` - Test script for conservative approach
- `scripts/test_smaller_file.py` - Test script for smaller files
- `scripts/debug_optimization.py` - Debug script for API troubleshooting

### Usage

To optimize project tile images:

```bash
# Test the optimization process first
python scripts/test_conservative.py

# Run the full conservative optimization
python scripts/optimize_conservative.py
```

### Findings

During testing, we discovered that TinyPNG's default optimization is quite aggressive:
- Files often see 60-75% size reduction
- This level of compression may affect image quality
- Conservative approach preserves quality by limiting reductions to 30%

### API Configuration

The optimization uses TinyPNG API with the following settings:
- API Key: Configured in scripts
- Rate Limiting: 0.5 second delays between requests
- Timeout: 30 seconds per request
- Error Handling: Comprehensive error checking and reporting

## Project Structure

```
K6_MINIMAL/
├── assets/              # Site assets and icons
├── css/                 # Stylesheets
├── data/                # JSON data files
├── js/                  # JavaScript files
├── project_tiles/       # Project thumbnail images (optimized)
├── scripts/             # Image optimization scripts
└── index.html           # Main homepage
```

## Development

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. For image optimization, ensure Python and required packages are installed

### Required Python Packages

```bash
pip install requests
```

## License

This project is proprietary to Knectar.

## Contact

For questions about this portfolio or optimization process, contact the development team.
 