import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { spawn } from 'tauri-pty';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  projectPath: string;
  onReady?: () => void;
}

export function Terminal({ projectPath, onReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    // Check if running in browser mode (no Tauri)
    if (!window.__TAURI_INTERNALS__) {
      setIsBrowser(true);
      return;
    }

    // Prevent double initialization in StrictMode
    if (initializedRef.current || !terminalRef.current) {
      return;
    }
    initializedRef.current = true;

    console.log('[Terminal] Initializing...');

    let term: XTerm | null = null;
    let pty: Awaited<ReturnType<typeof spawn>> | null = null;
    let fitAddon: FitAddon | null = null;

    const init = async () => {
      // Create xterm instance
      term = new XTerm({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
        theme: {
          background: '#0d0d0d',
          foreground: '#e0e0e0',
          cursor: '#f0f0f0',
          cursorAccent: '#0d0d0d',
          selectionBackground: '#444444',
          black: '#0d0d0d',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          blue: '#6272a4',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#f8f8f2',
          brightBlack: '#44475a',
          brightRed: '#ff6e6e',
          brightGreen: '#69ff94',
          brightYellow: '#ffffa5',
          brightBlue: '#d6acff',
          brightMagenta: '#ff92df',
          brightCyan: '#a4ffff',
          brightWhite: '#ffffff',
        },
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      term.open(terminalRef.current!);
      console.log('[Terminal] xterm opened');

      // Small delay to ensure container has proper dimensions
      await new Promise(r => setTimeout(r, 50));
      fitAddon.fit();
      console.log('[Terminal] fit() called, cols:', term.cols, 'rows:', term.rows);

      try {
        console.log('[Terminal] Spawning PTY in:', projectPath);
        pty = await spawn('zsh', ['-l'], {
          cols: term.cols,
          rows: term.rows,
          cwd: projectPath,
        });

        console.log('[Terminal] PTY spawned');

        // Transport data between PTY and terminal
        pty.onData((data) => term!.write(data));
        term.onData((data) => pty!.write(data));

        // Handle terminal resize
        term.onResize(({ cols, rows }) => {
          pty?.resize(cols, rows);
        });

        // Show welcome banner and start claude
        setTimeout(() => {
          // Write welcome banner
          term!.write('\x1b[36m╭───────────────────────────────────────────────────────────╮\x1b[0m\r\n');
          term!.write('\x1b[36m│\x1b[0m  \x1b[1m\x1b[35mGuardrail Design System\x1b[0m                                 \x1b[36m│\x1b[0m\r\n');
          term!.write('\x1b[36m│\x1b[0m                                                           \x1b[36m│\x1b[0m\r\n');
          term!.write('\x1b[36m│\x1b[0m  \x1b[33mTip:\x1b[0m Use \x1b[32m/component\x1b[0m to generate with the design system  \x1b[36m│\x1b[0m\r\n');
          term!.write('\x1b[36m│\x1b[0m  \x1b[90mExample: /component a settings page with dark mode toggle\x1b[0m \x1b[36m│\x1b[0m\r\n');
          term!.write('\x1b[36m╰───────────────────────────────────────────────────────────╯\x1b[0m\r\n\r\n');

          // Launch claude
          pty?.write('claude\n');
        }, 500);

        onReady?.();
      } catch (err) {
        console.error('[Terminal] Failed to spawn PTY:', err);
        term.write(`\x1b[31mError: Failed to start terminal: ${err}\x1b[0m\r\n`);
        term.write(`\x1b[33mMake sure the PTY plugin is properly configured.\x1b[0m\r\n`);
      }
    };

    init();

    // Handle window resize
    const handleResize = () => fitAddon?.fit();
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (pty) {
        try {
          pty.kill();
        } catch (e) {
          // Ignore kill errors
        }
      }
      term?.dispose();
      initializedRef.current = false;
    };
  }, [projectPath, onReady]);

  // Show message for browser mode
  if (isBrowser) {
    return (
      <div className="h-full w-full bg-[#0d0d0d] rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🖥️</div>
          <h3 className="text-lg font-medium text-white mb-2">Terminal requires native app</h3>
          <p className="text-neutral-400 text-sm max-w-md">
            The Claude Terminal feature requires running Guardrail as a native desktop app.
            In browser preview mode, use the "Simple Prompt" option instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={terminalRef}
      className="h-full w-full bg-[#0d0d0d] rounded-lg overflow-hidden"
    />
  );
}
