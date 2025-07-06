/*
  purpose: Browser logger to manage client-side log output
  inputs: messages to log
  outputs: console output suppressed in production except errors
  status: stable
  depends_on: none
  related_docs: ../../progress.md
*/

const shouldLog = process.env.NODE_ENV !== 'production'

const clientLogger = {
  log: (...args: unknown[]): void => {
    if (shouldLog) console.log(...args)
  },
  warn: (...args: unknown[]): void => {
    if (shouldLog) console.warn(...args)
  },
  error: (...args: unknown[]): void => {
    console.error(...args)
  },
}

export default clientLogger
