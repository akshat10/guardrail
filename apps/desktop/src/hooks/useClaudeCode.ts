import { useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { generate, fixViolations } from '../lib/claude-code';
import { validate } from '../lib/validator';

const MAX_FIX_ATTEMPTS = 3;

export function useClaudeCode() {
  const project = useAppStore((state) => state.project);
  const setStatus = useAppStore((state) => state.setStatus);
  const setGeneratedCode = useAppStore((state) => state.setGeneratedCode);
  const setValidationErrors = useAppStore((state) => state.setValidationErrors);
  const setError = useAppStore((state) => state.setError);
  const appendStreamingOutput = useAppStore((state) => state.appendStreamingOutput);
  const clearStreamingOutput = useAppStore((state) => state.clearStreamingOutput);
  const fixAttempts = useAppStore((state) => state.fixAttempts);
  const incrementFixAttempts = useAppStore((state) => state.incrementFixAttempts);
  const resetFixAttempts = useAppStore((state) => state.resetFixAttempts);

  const generateCode = useCallback(
    async (prompt: string) => {
      if (!project) {
        setError('No project selected');
        return;
      }

      // Reset state
      setError(null);
      setValidationErrors([]);
      setGeneratedCode('');
      clearStreamingOutput();
      resetFixAttempts();
      setStatus('generating');

      try {
        // Generate code
        const result = await generate({
          prompt,
          projectPath: project.path,
          onChunk: (chunk) => appendStreamingOutput(chunk),
        });

        if (!result.success) {
          setError(result.error || 'Generation failed');
          setStatus('error');
          return;
        }

        setGeneratedCode(result.code);

        // Validate
        setStatus('validating');
        const validation = validate(result.code);

        if (validation.valid) {
          setValidationErrors([]);
          setStatus('ready');
          return;
        }

        // Has errors, try to fix
        setValidationErrors(validation.errors);
        await attemptFix(project.path, validation.errors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    },
    [project]
  );

  const attemptFix = useCallback(
    async (projectPath: string, errors: { message: string }[]) => {
      if (fixAttempts >= MAX_FIX_ATTEMPTS) {
        setError(`Failed to fix violations after ${MAX_FIX_ATTEMPTS} attempts`);
        setStatus('error');
        return;
      }

      incrementFixAttempts();
      setStatus('fixing');
      clearStreamingOutput();

      try {
        const violations = errors.map((e) => e.message);
        const result = await fixViolations(projectPath, violations);

        if (!result.success) {
          setError(result.error || 'Fix failed');
          setStatus('error');
          return;
        }

        setGeneratedCode(result.code);

        // Re-validate
        setStatus('validating');
        const validation = validate(result.code);

        if (validation.valid) {
          setValidationErrors([]);
          setStatus('ready');
          return;
        }

        // Still has errors, try again
        setValidationErrors(validation.errors);
        await attemptFix(projectPath, validation.errors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    },
    [fixAttempts]
  );

  return { generateCode };
}
