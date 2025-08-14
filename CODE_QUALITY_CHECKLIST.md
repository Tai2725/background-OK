# CODE QUALITY CHECKLIST

## 🔍 PRE-COMMIT CHECKLIST

### 1. Syntax & Structure
- [ ] **No syntax errors** - Check for missing brackets, semicolons, commas
- [ ] **Proper JSX structure** - Ensure all tags are properly closed
- [ ] **Correct imports/exports** - Verify all imports exist and exports are declared
- [ ] **No duplicate code blocks** - Remove any copy-paste errors
- [ ] **Consistent indentation** - Use 2 spaces for React/JS files

### 2. React Component Standards
- [ ] **Component export** - Always export components properly
- [ ] **Hook dependencies** - Include all dependencies in useEffect/useCallback arrays
- [ ] **State management** - Use appropriate state management patterns
- [ ] **Error boundaries** - Implement proper error handling
- [ ] **PropTypes/TypeScript** - Define component interfaces

### 3. API Integration
- [ ] **Error handling** - Wrap API calls in try-catch blocks
- [ ] **Loading states** - Show loading indicators during async operations
- [ ] **Response validation** - Check API response structure before using
- [ ] **Timeout handling** - Handle network timeouts gracefully
- [ ] **Authentication** - Verify user authentication before API calls

### 4. Database Operations
- [ ] **Schema validation** - Ensure database schema matches code expectations
- [ ] **Migration scripts** - Create migrations for schema changes
- [ ] **RLS policies** - Implement proper Row Level Security
- [ ] **Indexes** - Add indexes for performance-critical queries
- [ ] **Data validation** - Validate data before database operations

### 5. Performance Optimization
- [ ] **Lazy loading** - Implement lazy loading for large components
- [ ] **Memoization** - Use React.memo, useMemo, useCallback appropriately
- [ ] **Bundle size** - Monitor and optimize bundle size
- [ ] **Image optimization** - Compress and optimize images
- [ ] **Caching** - Implement appropriate caching strategies

## 🚨 COMMON ERRORS TO AVOID

### 1. JavaScript/React Errors
```javascript
// ❌ BAD - Missing export
function MyComponent() {
  return <div>Hello</div>;
}

// ✅ GOOD - Proper export
export function MyComponent() {
  return <div>Hello</div>;
}

// ❌ BAD - Syntax error
const obj = {
  prop1: 'value1',
  prop2: 'value2',  // Missing closing brace
```

### 2. API Integration Errors
```javascript
// ❌ BAD - No error handling
const result = await api.call();
setData(result.data);

// ✅ GOOD - Proper error handling
try {
  const result = await api.call();
  if (!result.success) {
    throw new Error(result.error);
  }
  setData(result.data);
} catch (error) {
  logError('api-call', error);
  setError(error.message);
}
```

### 3. Database Schema Errors
```sql
-- ❌ BAD - Missing column
SELECT mask_url FROM processed_images; -- Column doesn't exist

-- ✅ GOOD - Add column first
ALTER TABLE processed_images ADD COLUMN mask_url text;
SELECT mask_url FROM processed_images;
```

## 🛠️ DEVELOPMENT TOOLS

### 1. Linting & Formatting
```bash
# Install ESLint and Prettier
npm install --save-dev eslint prettier eslint-config-prettier

# Run linting
npm run lint

# Format code
npm run format
```

### 2. Type Checking
```bash
# For TypeScript projects
npm run type-check

# For JavaScript with JSDoc
npm run jsdoc-check
```

### 3. Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📋 CODE REVIEW CHECKLIST

### Before Submitting PR
- [ ] All tests pass
- [ ] No console errors in browser
- [ ] Code follows project conventions
- [ ] Documentation is updated
- [ ] Performance impact is considered

### During Code Review
- [ ] Logic is correct and efficient
- [ ] Error handling is comprehensive
- [ ] Security considerations are addressed
- [ ] Code is maintainable and readable
- [ ] No hardcoded values or secrets

## 🔧 AUTOMATED CHECKS

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/quality-check.yml
name: Quality Check
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Run tests
        run: npm run test
      - name: Check build
        run: npm run build
```

## 📊 MONITORING & METRICS

### Error Tracking
- Implement error tracking (Sentry, LogRocket)
- Monitor API response times
- Track user experience metrics
- Set up alerts for critical errors

### Performance Monitoring
- Core Web Vitals tracking
- Bundle size monitoring
- Database query performance
- API endpoint response times

## 🎯 BEST PRACTICES

1. **Always test locally** before committing
2. **Use meaningful commit messages** following conventional commits
3. **Keep functions small** and focused on single responsibility
4. **Document complex logic** with clear comments
5. **Use consistent naming conventions** throughout the project
6. **Implement proper logging** for debugging and monitoring
7. **Handle edge cases** and error scenarios
8. **Optimize for performance** from the start
9. **Follow security best practices** for authentication and data handling
10. **Keep dependencies up to date** and audit for vulnerabilities
