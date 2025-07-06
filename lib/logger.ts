import pino from 'pino'

// purpose: provide consistent server-side logging
// inputs: NODE_ENV
// outputs: configured pino logger instance
// status: stable
// related_docs: lib/README.md

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

export default logger
