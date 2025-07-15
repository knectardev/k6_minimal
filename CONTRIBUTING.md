# Contributing to Knectar Portfolio

Thank you for your interest in contributing to the Knectar portfolio project! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 16+ 
- Git
- Python 3.7+ (for image optimization scripts)

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/K6_MINIMAL.git
   cd K6_MINIMAL
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Code Style Guidelines

### JavaScript

- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

### HTML

- Use semantic HTML elements
- Include proper ARIA labels for accessibility
- Maintain consistent indentation
- Add alt text to all images

### CSS

- Use CSS custom properties for theming
- Follow BEM methodology for class naming
- Keep selectors specific but not overly complex
- Use flexbox/grid for layouts

### File Organization

```
K6_MINIMAL/
├── assets/          # Static assets (icons, images)
├── css/            # Stylesheets
├── data/           # JSON data files
├── js/             # JavaScript files
├── scripts/        # Build and optimization scripts
└── project_tiles/  # Project thumbnail images
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the code style guidelines
- Test your changes thoroughly
- Update documentation if needed

### 3. Test Your Changes

```bash
# Start development server
npm run dev

# Test image optimization (if applicable)
npm run test-optimization

# Check for any console errors
# Test on different browsers
# Verify accessibility
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## Areas for Contribution

### High Priority

1. **Content Management**
   - Improve the menu editing interface
   - Add content validation
   - Implement content versioning

2. **Performance**
   - Optimize image loading
   - Implement lazy loading
   - Add service worker for caching

3. **Accessibility**
   - Improve keyboard navigation
   - Add screen reader support
   - Enhance color contrast

### Medium Priority

1. **User Experience**
   - Add loading states
   - Improve error handling
   - Enhance mobile experience

2. **SEO**
   - Add structured data
   - Improve meta tags
   - Create dynamic sitemap

3. **Testing**
   - Add unit tests
   - Implement integration tests
   - Add visual regression tests

### Low Priority

1. **Features**
   - Add contact form
   - Implement project filtering
   - Add analytics integration

2. **Documentation**
   - Improve code comments
   - Add API documentation
   - Create user guides

## Testing Guidelines

### Manual Testing

- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Verify accessibility with screen readers
- Check performance with browser dev tools

### Automated Testing

```bash
# Run image optimization tests
npm run test-optimization

# Check for linting errors
npm run lint

# Validate HTML
npm run validate-html
```

## Pull Request Process

1. **Create a descriptive PR title**
2. **Provide a detailed description** of your changes
3. **Include screenshots** for UI changes
4. **Reference any related issues**
5. **Ensure all tests pass**
6. **Request review** from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Accessibility enhancement

## Testing
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices
- [ ] Verified accessibility
- [ ] All tests pass

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Code Review Process

1. **Automated checks** must pass
2. **At least one approval** from maintainers
3. **All conversations resolved**
4. **Squash and merge** when approved

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Browser and OS information**
5. **Screenshots or videos** if applicable

### Feature Requests

When requesting features, please include:

1. **Clear description** of the feature
2. **Use case and benefits**
3. **Proposed implementation** (if applicable)
4. **Mockups or examples** (if applicable)

## Getting Help

- **Documentation**: Check README.md and DEPLOYMENT.md
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team directly

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame

Thank you for contributing to the Knectar portfolio project! 