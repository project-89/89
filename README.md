# 89
From the shadows we serve the light

## Monorepo Structure

This repository is set up as an Nx monorepo to manage multiple projects efficiently. The monorepo is structured as follows:

- `apps/` - Contains application projects
- `libs/` - Contains library projects that can be shared across apps
- `tools/` - Contains utility scripts and tools for the monorepo

## Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher)

### Installation

```bash
# Install dependencies
npm install
```

## Development

### Running Projects

```bash
# Run a specific project
npm run start -- --project=<project-name>

# Build a specific project
npm run build -- --project=<project-name>

# Test a specific project
npm run test -- --project=<project-name>

# Lint a specific project
npm run lint -- --project=<project-name>
```

### Code Formatting

```bash
# Format all files
npm run format

# Check format without modifying files
npm run format:check
```

### Project Dependency Graph

```bash
# Generate a visual graph of project dependencies
npm run graph
```

## Working with Nx

### Creating a New Library

```bash
npx nx g @nx/js:lib my-lib
```

### Creating a New Application

```bash
npx nx g @nx/js:app my-app
```

### Running Tasks for Affected Projects

```bash
# Build all affected projects
npm run affected:build

# Test all affected projects
npm run affected:test

# Lint all affected projects
npm run affected:lint
```

## License

ISC
