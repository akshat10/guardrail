import { useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { generate, fixViolations, cancelGeneration } from '../lib/claude-code';
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
  const setStreamStarted = useAppStore((state) => state.setStreamStarted);
  const fixAttempts = useAppStore((state) => state.fixAttempts);
  const incrementFixAttempts = useAppStore((state) => state.incrementFixAttempts);
  const resetFixAttempts = useAppStore((state) => state.resetFixAttempts);
  const addToHistory = useAppStore((state) => state.addToHistory);

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
      setStreamStarted(false);
      resetFixAttempts();
      setStatus('generating');

      try {
        // Generate code with real-time streaming
        const result = await generate({
          prompt,
          projectPath: project.path,
          onInit: () => {
            // Stream has initialized
          },
          onTextDelta: (text) => {
            setStreamStarted(true);
            appendStreamingOutput(text);
          },
          onToolUse: (tool, _input) => {
            // Could display tool use in the future
            console.log('[Tool use]', tool);
          },
        });

        // Handle cancellation
        if (result.cancelled) {
          setStatus('idle');
          return;
        }

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
          addToHistory(prompt, true);
          return;
        }

        // Has errors, try to fix
        setValidationErrors(validation.errors);
        await attemptFix(project.path, validation.errors, prompt);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
        addToHistory(prompt, false);
      }
    },
    [project, addToHistory]
  );

  const attemptFix = useCallback(
    async (projectPath: string, errors: { message: string }[], originalPrompt: string) => {
      if (fixAttempts >= MAX_FIX_ATTEMPTS) {
        setError(`Failed to fix violations after ${MAX_FIX_ATTEMPTS} attempts`);
        setStatus('error');
        addToHistory(originalPrompt, false);
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
          addToHistory(originalPrompt, false);
          return;
        }

        setGeneratedCode(result.code);

        // Re-validate
        setStatus('validating');
        const validation = validate(result.code);

        if (validation.valid) {
          setValidationErrors([]);
          setStatus('ready');
          addToHistory(originalPrompt, true);
          return;
        }

        // Still has errors, try again
        setValidationErrors(validation.errors);
        await attemptFix(projectPath, validation.errors, originalPrompt);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
        addToHistory(originalPrompt, false);
      }
    },
    [fixAttempts, addToHistory]
  );

  const cancel = useCallback(() => {
    cancelGeneration();
    setStatus('idle');
    setStreamStarted(false);
  }, [setStatus, setStreamStarted]);

  return { generateCode, cancel };
}
