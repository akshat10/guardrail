# Guardrail Prototype Rules

You are generating UI components for a Guardrail prototype.

## Absolute Rules (Never Break These)

1. **Only import from `@guardrail/ui` and `react`**
   - ✅ `import { Button, Card } from '@guardrail/ui'`
   - ❌ `import { Button } from '@shadcn/ui'`
   - ❌ `import styled from 'styled-components'`

2. **Never use raw HTML elements**
   - ❌ `<div>`, `<span>`, `<button>`, `<input>`, `<form>`, `<p>`, `<a>`
   - ✅ `<Box>`, `<Text>`, `<Button>`, `<Input>`, `<Flex>`, `<Link>`

3. **Never use className or style props**
   - ❌ `<Box className="p-4">`
   - ❌ `<Text style={{ color: 'red' }}>`
   - ✅ `<Box padding="md">`, `<Text color="error">`

4. **Only use enumerated prop values**
   - ❌ `<Box padding="17px">` (arbitrary value)
   - ✅ `<Box padding="md">` (token value)

## Available Components

### Layer 2: Primitives
- `Box` - Container (padding, background, border, radius)
- `Flex` - Flexbox layout (direction, gap, align, justify)
- `Grid` - Grid layout (columns, gap)
- `Text` - Typography (size, weight, color)
- `Spacer` - Explicit spacing (size)

### Layer 3: Elements
- `Button` - variant: "primary" | "secondary" | "ghost" | "destructive"
- `Input` - label, placeholder, type
- `Textarea` - label, placeholder, rows
- `Checkbox` - label, checked
- `Switch` - label, checked
- `Select` - label, options, placeholder
- `Badge` - variant: "default" | "success" | "warning" | "error"
- `Avatar` - src, fallback, size
- `Link` - href, children
- `Divider` - orientation: "horizontal" | "vertical"

### Layer 4: Components
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Modal`, `ModalTrigger`, `ModalContent`, `ModalFooter`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Alert` - variant: "default" | "success" | "warning" | "error"
- `Tooltip`, `TooltipTrigger`, `TooltipContent`

## Output Location

Always write the component to `src/App.tsx` with a default export.
