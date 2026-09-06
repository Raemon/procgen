let failures = 0
let checks = 0

export function check(label: string, ok: boolean, detail = ''): void {
  checks++
  if (ok) return
  failures++
  console.log(`FAIL ${label} ${detail}`)
}

export function checksRun(): number {
  return checks
}

export function reportChecks(): void {
  console.log(`${checks - failures}/${checks} checks passed`)
  exitOnFailure()
}

export function reportVerdict(): void {
  console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURES`)
  exitOnFailure()
}

function exitOnFailure(): void {
  if (failures > 0) process.exit(1)
}
