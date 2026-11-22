interface LogValidation {
  patterns: string[]
  max: number
}

interface ExemptLog {
  patterns: string[]
}

interface ReporterOptions {
  logValidations?: LogValidation[]
  failIfLogValidationsOutdated?: boolean
  failIfUnknownLogsFound?: boolean
  exemptLogs?: ExemptLog[]
}

interface TestResultLike {
  console?: Array<{ message: string }>
}

declare class JestReporterLogValidator {
  constructor(globalConfig: { verbose?: boolean }, options?: ReporterOptions)
  onTestResult(test: unknown, testResult: TestResultLike): void
  getLastError(): Error | undefined
}

export = JestReporterLogValidator
