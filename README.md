# Guardrail

AI-assisted prototyping with design system enforcement.

## Overview

Guardrail is a desktop application that provides a GUI for AI-assisted prototyping with design system enforcement. It wraps Claude Code CLI to generate React components that are constrained to a predefined component library.

### Core Features

- **Constrained Generation:** Claude can only output code using components from `@guardrail/ui`
- **Validation Gate:** AST-based validation blocks non-compliant code before preview
- **Zero API Cost:** Uses Claude Code CLI (user's existing Pro subscription)
- **Instant Preview:** Live preview with Vite hot reload

## Repository Structure

```
guardrail/
├── apps/
│   └── desktop/          # Tauri desktop application
├── packages/
│   └── ui/               # Component library (@guardrail/ui)
└── templates/
    └── project/          # Project template for scaffolding
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Rust (for Tauri)
- Claude Code CLI

### Installation

```bash
# Install dependencies
pnpm install

# Build the component library
pnpm build:ui

# Start the desktop app in development mode
pnpm dev
```

### Building for Production

```bash
# Build the desktop app for all platforms
pnpm build:desktop
```

## Component Library (@guardrail/ui)

The component library provides 20 constrained components across 4 layers:

### Layer 1: Design Tokens
- Colors, spacing, typography

### Layer 2: Primitives
- `Box`, `Flex`, `Grid`, `Text`, `Spacer`

### Layer 3: Elements
- `Button`, `Input`, `Textarea`, `Checkbox`, `Switch`
- `Select`, `Badge`, `Avatar`, `Link`, `Divider`

### Layer 4: Components
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Modal`, `ModalTrigger`, `ModalContent`, `ModalFooter`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Alert`, `Tooltip`, `TooltipTrigger`, `TooltipContent`

## Development

### Available Scripts

```bash
# Start desktop app in dev mode
pnpm dev

# Build all packages
pnpm build

# Build component library only
pnpm build:ui

# Build desktop app only
pnpm build:desktop

# Run tests
pnpm test

# Lint code
pnpm lint
```

## License

MIT
