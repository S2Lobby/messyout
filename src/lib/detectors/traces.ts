import type { Detector, DetectResult } from './types';

// strace / ltrace: many `syscall(args) = retval` lines, often with errno.
const straceDetector: Detector = {
  detect(input): DetectResult | null {
    const calls = (input.match(/^\s*\w+\([^\n]*\)\s*=\s*(-?\d+|0x[0-9a-fA-F]+|\?)/gm) || []).length;
    if (calls < 3) return null;
    // Corroborate so plain "f(x) = n" math/code doesn't read as strace.
    const errno = /=\s*-?\d+\s+E[A-Z]{2,}\b/.test(input);
    const hexRet = /\)\s*=\s*0x[0-9a-fA-F]+/.test(input);
    const syscall = /^\s*(execve|openat?|read|write|mmap|mprotect|clone|fstat|stat|close|connect|socket|brk|access|ioctl|wait4|rt_sigaction)\(/m.test(input);
    const pidTag = /^\[pid\s+\d+\]\s|^\d+\s+\d{2}:\d{2}:\d{2}/m.test(input);
    if (!errno && !hexRet && !syscall && !pidTag) return null;
    return {
      language: 'plaintext',
      displayName: 'strace output',
      confidence: 0.9,
      explain: [
        { pattern: /execve/, label: 'execve', description: 'Process replaced its image with a new program — what actually ran' },
        { pattern: /openat|\bopen\(/, label: 'open / openat', description: 'File opened; the number after "=" is the file descriptor' },
        { pattern: /ENOENT/, label: 'ENOENT', description: 'No such file or directory — the probed path does not exist' },
        { pattern: /EACCES/, label: 'EACCES', description: 'Permission denied' },
        { pattern: /EINVAL/, label: 'EINVAL', description: 'Invalid argument to the syscall' },
        { pattern: /\/etc\/ld\.so/, label: 'ld.so', description: 'Dynamic linker activity — shared-library resolution' },
        { pattern: /\/bin\/sh|\/bin\/bash/, label: 'shell', description: 'A shell was executed — often the payload in an exploit trace' },
      ],
    };
  },
};

// Go panic / goroutine dump
const goPanicDetector: Detector = {
  detect(input): DetectResult | null {
    if (!/^goroutine \d+ \[/m.test(input) && !/^panic:/m.test(input)) return null;
    return {
      language: 'go',
      displayName: /^panic:/m.test(input) ? 'Go panic' : 'Go stack trace',
      confidence: 0.92,
      explain: [
        { pattern: /^panic:/m, label: 'panic:', description: 'The unrecovered error message that crashed the program' },
        { pattern: /goroutine \d+ \[running\]/, label: 'goroutine [running]', description: 'The goroutine that was executing when it crashed (top of trace)' },
        { pattern: /created by /, label: 'created by', description: 'Where this goroutine was spawned' },
        { pattern: /\.go:\d+/, label: 'file.go:N', description: 'Source location of each frame — start at the top' },
      ],
    };
  },
};

// Rust panic + backtrace
const rustPanicDetector: Detector = {
  detect(input): DetectResult | null {
    // Anchor to line start + require the real source-location / quoted-message
    // shape so an English sentence containing the words doesn't match.
    if (!/^thread '[^']*' panicked at /m.test(input)) return null;
    if (!/panicked at .*:\d+:\d+|panicked at '.*',/.test(input)) return null;
    return {
      language: 'rust',
      displayName: 'Rust panic',
      confidence: 0.93,
      explain: [
        { pattern: /panicked at/, label: 'panicked at', description: 'The panic message and the source location that triggered it' },
        { pattern: /unwrap\(\)/, label: 'unwrap()', description: 'Called .unwrap() on an Err/None — the usual panic cause' },
        { pattern: /ConnectionRefused/, label: 'ConnectionRefused', description: 'A network connect() failed — target not listening' },
        { pattern: /stack backtrace:/, label: 'backtrace', description: 'Call frames, innermost (0) first — your code is the non-std frames' },
      ],
    };
  },
};

// Python traceback
const pythonTracebackDetector: Detector = {
  detect(input): DetectResult | null {
    if (!/^Traceback \(most recent call last\):/m.test(input)) return null;
    return {
      language: 'python',
      displayName: 'Python traceback',
      confidence: 0.95,
      explain: [
        { pattern: /Traceback/, label: 'Traceback', description: 'Most recent call last — the actual error is on the LAST line' },
        { pattern: /File ".*", line \d+/, label: 'File "...", line N', description: 'Each frame; the bottom-most is where the exception was raised' },
        { pattern: /Error:|Exception:/, label: 'the exception', description: 'Final line: exception type + message — read this first' },
      ],
    };
  },
};

// Java / JVM exception
const javaExceptionDetector: Detector = {
  detect(input): DetectResult | null {
    // Also match frames without "(File.java:N)" — e.g. (Native Method)/(Unknown Source).
    const hasAt = /^\s+at\s+[\w.$<>]+\([^)]*\)/m.test(input);
    // Match the FQCN exception token anywhere (canonical line is
    // "Exception in thread \"main\" java.lang.NullPointerException: ..."),
    // plus the "Caused by:" chain.
    const hasExc =
      /\b[\w.$]*(?:Exception|Error)\b\s*(?::|\n|$)/m.test(input) ||
      /^Caused by:/m.test(input) ||
      /^Exception in thread\b/m.test(input);
    if (!hasAt || !hasExc) return null;
    return {
      language: 'java',
      displayName: 'Java exception',
      confidence: 0.92,
      explain: [
        { pattern: /Exception|Error/, label: 'exception', description: 'Top line: the thrown type + message' },
        { pattern: /^\s+at /m, label: 'at ...', description: 'Stack frames, top = where it was thrown' },
        { pattern: /Caused by:/, label: 'Caused by:', description: 'The underlying root-cause exception — often the real problem' },
        { pattern: /\.\.\.\s+\d+\s+more/, label: '... N more', description: 'Frames identical to the enclosing trace, elided' },
      ],
    };
  },
};

export const traceDetectors: Detector[] = [
  straceDetector,
  goPanicDetector,
  rustPanicDetector,
  pythonTracebackDetector,
  javaExceptionDetector,
];
