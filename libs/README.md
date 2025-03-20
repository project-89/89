# Libraries

This directory contains all library projects in the monorepo. Libraries are shareable code that can be used by multiple applications.

## Adding a New Library

To add a new library to the monorepo:

```bash
npx nx g @nx/js:lib my-lib
```

Or for a React component library:

```bash
npx nx g @nx/react:lib my-react-lib
```

## Library Types

Consider organizing libraries by their purpose:

- `feature/` - Libraries that implement smart UI for specific business features
- `ui/` - Libraries that contain only presentational components
- `data-access/` - Libraries that contain state management and data fetching
- `util/` - Libraries that contain utility functions
- `api/` - Libraries that provide API interface code 