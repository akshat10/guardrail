import { Box, Text, Button, Flex } from '@guardrail/ui'

export default function App() {
  return (
    <Box padding="lg" background="surface">
      <Flex direction="column" align="center" gap="md">
        <Text size="2xl" weight="bold">Welcome to Guardrail</Text>
        <Text color="muted">Start prototyping with your design system</Text>
        <Button variant="primary">Get Started</Button>
      </Flex>
    </Box>
  )
}
