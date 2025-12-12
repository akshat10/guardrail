import { describe, it, expect } from 'vitest';
import { validate } from '../validator';

describe('validate', () => {
  describe('valid code', () => {
    it('accepts code with only @guardrail/ui imports', () => {
      const code = `
        import { Box, Text, Button } from '@guardrail/ui'

        export default function App() {
          return (
            <Box padding="md">
              <Text>Hello</Text>
              <Button variant="primary">Click me</Button>
            </Box>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts code with react imports', () => {
      const code = `
        import React, { useState } from 'react'
        import { Box, Text } from '@guardrail/ui'

        export default function App() {
          const [count, setCount] = useState(0)
          return (
            <Box padding="md">
              <Text>Count: {count}</Text>
            </Box>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts code with Fragment', () => {
      const code = `
        import React, { Fragment } from 'react'
        import { Text } from '@guardrail/ui'

        export default function App() {
          return (
            <Fragment>
              <Text>Hello</Text>
              <Text>World</Text>
            </Fragment>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('accepts all Layer 2 primitives', () => {
      const code = `
        import { Box, Flex, Grid, Text, Spacer } from '@guardrail/ui'

        export default function App() {
          return (
            <Box padding="md">
              <Flex direction="column" gap="md">
                <Text size="lg">Title</Text>
                <Spacer size="md" />
                <Grid columns={2} gap="sm">
                  <Text>Item 1</Text>
                  <Text>Item 2</Text>
                </Grid>
              </Flex>
            </Box>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('accepts all Layer 3 elements', () => {
      const code = `
        import {
          Button, Input, Textarea, Checkbox, Switch,
          Select, Badge, Avatar, Link, Divider
        } from '@guardrail/ui'

        export default function App() {
          return (
            <>
              <Button variant="primary">Click</Button>
              <Input label="Name" placeholder="Enter name" />
              <Textarea label="Bio" rows={4} />
              <Checkbox label="Accept terms" />
              <Switch label="Enable notifications" />
              <Select label="Country" options={[]} />
              <Badge variant="success">Active</Badge>
              <Avatar fallback="JD" />
              <Link href="/about">About</Link>
              <Divider />
            </>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('accepts all Layer 4 components', () => {
      const code = `
        import {
          Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
          Modal, ModalTrigger, ModalContent, ModalFooter,
          Tabs, TabsList, TabsTrigger, TabsContent,
          Alert, Tooltip, TooltipTrigger, TooltipContent,
          Button, Text
        } from '@guardrail/ui'

        export default function App() {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Title</CardTitle>
                <CardDescription>Description</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tab1">
                  <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tab1">
                    <Alert variant="info">Info message</Alert>
                  </TabsContent>
                  <TabsContent value="tab2">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button>Hover me</Button>
                      </TooltipTrigger>
                      <TooltipContent>Tooltip text</TooltipContent>
                    </Tooltip>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Modal>
                  <ModalTrigger>
                    <Button>Open Modal</Button>
                  </ModalTrigger>
                  <ModalContent title="Modal Title">
                    <Text>Modal content</Text>
                  </ModalContent>
                  <ModalFooter>
                    <Button>Close</Button>
                  </ModalFooter>
                </Modal>
              </CardFooter>
            </Card>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });
  });

  describe('forbidden imports', () => {
    it('rejects imports from other UI libraries', () => {
      const code = `
        import { Button } from '@shadcn/ui'

        export default function App() {
          return <Button>Click</Button>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('import');
      expect(result.errors[0].message).toContain('@shadcn/ui');
    });

    it('rejects styled-components import', () => {
      const code = `
        import styled from 'styled-components'
        import { Box } from '@guardrail/ui'

        const StyledBox = styled(Box)\`color: red;\`

        export default function App() {
          return <StyledBox>Hello</StyledBox>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'import')).toBe(true);
    });

    it('rejects lodash import', () => {
      const code = `
        import { map } from 'lodash'
        import { Text } from '@guardrail/ui'

        export default function App() {
          return <Text>Hello</Text>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('import');
    });
  });

  describe('raw HTML elements', () => {
    it('rejects <div> element', () => {
      const code = `
        import { Text } from '@guardrail/ui'

        export default function App() {
          return <div><Text>Hello</Text></div>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('element');
      expect(result.errors[0].message).toContain('<div>');
    });

    it('rejects <span> element', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box><span>text</span></Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('<span>');
    });

    it('rejects <button> element', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box><button>Click</button></Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('<button>');
    });

    it('rejects <input> element', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box><input type="text" /></Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('<input>');
    });

    it('rejects <p> element', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box><p>Paragraph</p></Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('<p>');
    });

    it('rejects <a> element', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box><a href="/">Link</a></Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('<a>');
    });

    it('rejects heading elements', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return (
            <Box>
              <h1>Title</h1>
              <h2>Subtitle</h2>
            </Box>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects form element', () => {
      const code = `
        import { Box, Input, Button } from '@guardrail/ui'

        export default function App() {
          return (
            <form>
              <Input label="Email" />
              <Button type="submit">Submit</Button>
            </form>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('<form>');
    });
  });

  describe('forbidden props', () => {
    it('rejects className prop', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box className="p-4">Hello</Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('prop');
      expect(result.errors[0].message).toContain('className');
    });

    it('rejects style prop', () => {
      const code = `
        import { Text } from '@guardrail/ui'

        export default function App() {
          return <Text style={{ color: 'red' }}>Hello</Text>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('prop');
      expect(result.errors[0].message).toContain('style');
    });

    it('rejects both className and style props', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box className="container" style={{ padding: 10 }}>Hello</Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('unknown components', () => {
    it('rejects unknown component', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        function CustomComponent() {
          return <Box>Custom</Box>
        }

        export default function App() {
          return <CustomComponent />
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('element');
      expect(result.errors[0].message).toContain('CustomComponent');
    });
  });

  describe('syntax errors', () => {
    it('catches syntax errors', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box padding="md"
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('syntax');
    });
  });

  describe('multiple errors', () => {
    it('catches all violations in code', () => {
      const code = `
        import { Button } from '@chakra-ui/react'
        import { Box } from '@guardrail/ui'

        export default function App() {
          return (
            <div className="container">
              <Box style={{ margin: 10 }}>
                <span>Hello</span>
                <Button>Click</Button>
              </Box>
            </div>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      // Should catch: forbidden import, div element, className, style, span element
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('prop value validation', () => {
    it('rejects arbitrary padding value like "17px"', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box padding="17px">Hello</Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('value');
      expect(result.errors[0].message).toContain('17px');
      expect(result.errors[0].message).toContain('Box.padding');
    });

    it('accepts valid token padding value "md"', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box padding="md">Hello</Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid Button variant', () => {
      const code = `
        import { Button } from '@guardrail/ui'

        export default function App() {
          return <Button variant="custom">Click me</Button>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('value');
      expect(result.errors[0].message).toContain('custom');
      expect(result.errors[0].message).toContain('Button.variant');
    });

    it('accepts valid Button variants', () => {
      const code = `
        import { Button, Flex } from '@guardrail/ui'

        export default function App() {
          return (
            <Flex gap="md">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete</Button>
            </Flex>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid Text size', () => {
      const code = `
        import { Text } from '@guardrail/ui'

        export default function App() {
          return <Text size="24px">Hello</Text>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('value');
      expect(result.errors[0].message).toContain('24px');
    });

    it('accepts valid Text size tokens', () => {
      const code = `
        import { Text, Flex } from '@guardrail/ui'

        export default function App() {
          return (
            <Flex direction="column">
              <Text size="xs">Extra Small</Text>
              <Text size="sm">Small</Text>
              <Text size="md">Medium</Text>
              <Text size="lg">Large</Text>
              <Text size="xl">Extra Large</Text>
            </Flex>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('allows dynamic values (variables)', () => {
      const code = `
        import { useState } from 'react'
        import { Box, Button } from '@guardrail/ui'

        export default function App() {
          const [size, setSize] = useState('md')
          const variant = 'primary'
          return (
            <Box padding={size}>
              <Button variant={variant}>Click</Button>
            </Box>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('allows free-form string props (label, placeholder)', () => {
      const code = `
        import { Input, Textarea } from '@guardrail/ui'

        export default function App() {
          return (
            <>
              <Input
                label="Any label text here!"
                placeholder="Enter whatever you want..."
                error="This can be any error message"
              />
              <Textarea
                label="Comments"
                placeholder="Write your thoughts..."
              />
            </>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('allows function props (onClick, onChange)', () => {
      const code = `
        import { Button, Input } from '@guardrail/ui'

        export default function App() {
          return (
            <>
              <Button onClick={() => console.log('clicked')}>Click</Button>
              <Input onChange={(e) => console.log(e.target.value)} />
            </>
          )
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(true);
    });

    it('rejects invalid Flex direction', () => {
      const code = `
        import { Flex } from '@guardrail/ui'

        export default function App() {
          return <Flex direction="horizontal">Items</Flex>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('value');
      expect(result.errors[0].message).toContain('horizontal');
      expect(result.errors[0].fix).toContain('row');
    });

    it('rejects invalid Badge variant', () => {
      const code = `
        import { Badge } from '@guardrail/ui'

        export default function App() {
          return <Badge variant="red">Error</Badge>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('value');
      expect(result.errors[0].fix).toContain('error');
    });

    it('validates multiple props on same component', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box padding="invalid" radius="invalid-radius">Hello</Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.every(e => e.type === 'value')).toBe(true);
    });

    it('validates JSX expression container with string literal', () => {
      const code = `
        import { Box } from '@guardrail/ui'

        export default function App() {
          return <Box padding={"invalid-value"}>Hello</Box>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].type).toBe('value');
    });

    it('provides helpful fix suggestions', () => {
      const code = `
        import { Button } from '@guardrail/ui'

        export default function App() {
          return <Button size="extra-large">Click</Button>
        }
      `;
      const result = validate(code);
      expect(result.valid).toBe(false);
      expect(result.errors[0].fix).toContain('sm');
      expect(result.errors[0].fix).toContain('md');
      expect(result.errors[0].fix).toContain('lg');
    });
  });
});
