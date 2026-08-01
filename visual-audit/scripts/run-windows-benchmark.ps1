[CmdletBinding()]
param(
  [string]$BenchmarkId = "",
  [ValidateSet(1, 2, 4)]
  [int[]]$WorkerCounts = @(1, 2, 4)
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command is unavailable: $Name"
  }
}

Assert-Command git
Assert-Command docker
Assert-Command node
Assert-Command npm

$RepoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $RepoRoot) { throw "Run this command from the KenMatch repository." }
$RepoRoot = [IO.Path]::GetFullPath($RepoRoot)
$Head = (& git -C $RepoRoot rev-parse HEAD).Trim()
$Status = (& git -C $RepoRoot status --porcelain=v1 --untracked-files=all) -join "`n"
if ($Status) { throw "The worker benchmark requires a clean exact candidate commit." }

$RequiredWorkers = @(1, 2, 4)
$RequestedWorkers = @($WorkerCounts | Sort-Object -Unique)
if (($RequestedWorkers -join ",") -ne ($RequiredWorkers -join ",")) {
  throw "WorkerCounts must contain exactly 1, 2, and 4."
}
if (-not $BenchmarkId) {
  $stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
  $BenchmarkId = "$stamp-tier1-smoke-workers-$($Head.Substring(0, 12))"
}
if ($BenchmarkId -notmatch "^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$") {
  throw "BenchmarkId contains unsupported characters."
}

$BenchmarkRoot = Join-Path $RepoRoot "visual-audit\.benchmarks\$BenchmarkId"
if (Test-Path -LiteralPath $BenchmarkRoot) {
  throw "Benchmark directory already exists: $BenchmarkRoot"
}
$OutputRoot = Join-Path $BenchmarkRoot "runs"
$StateRoot = Join-Path $BenchmarkRoot "state"
$LogRoot = Join-Path $BenchmarkRoot "logs"
New-Item -ItemType Directory -Force -Path $OutputRoot, $StateRoot, $LogRoot | Out-Null

$SmokeScript = Join-Path $RepoRoot "visual-audit\scripts\run-windows-smoke.ps1"
$AuditPackage = Join-Path $RepoRoot "visual-audit"
$Observations = [Collections.Generic.List[object]]::new()

foreach ($Workers in $RequestedWorkers) {
  $RunId = "$BenchmarkId-w$Workers"
  $StateDir = Join-Path $StateRoot $RunId
  $StdoutLog = Join-Path $LogRoot "worker-$Workers.stdout.log"
  $StderrLog = Join-Path $LogRoot "worker-$Workers.stderr.log"
  $env:TARGET_COMMIT_SHA = $Head
  $env:AUDIT_STATE_DIR = $StateDir
  $env:AUDIT_RESUME = "false"
  $env:AUDIT_ACCELERATOR_RECORD = "chromium-headless-software"
  $env:VISUAL_AUDIT_CAPTURE_WORKERS = "$Workers"
  $env:APPROVED_BASELINE_RUN_ID = ""

  try {
    & $SmokeScript `
      -Tier "tier-1-synthetic" `
      -Scope "smoke" `
      -RunId $RunId `
      -OutputRoot $OutputRoot `
      -CaptureOnly `
      1>> $StdoutLog 2>> $StderrLog
  } catch {
    Add-Content -LiteralPath $StderrLog -Value $_.Exception.ToString()
    throw "Worker $Workers benchmark failed. See $StderrLog"
  }

  $MetricsFile = Join-Path $StateDir "capture-metrics.json"
  if (-not (Test-Path -LiteralPath $MetricsFile -PathType Leaf)) {
    throw "Worker $Workers did not produce capture metrics."
  }
  $Metrics = Get-Content -LiteralPath $MetricsFile -Raw | ConvertFrom-Json
  if ($Metrics.exitCode -ne 0 -or $Metrics.workers -ne $Workers -or $Metrics.expectedCommit -ne $Head) {
    throw "Worker $Workers capture metrics do not match the benchmark identity."
  }
  $RunRoot = Join-Path $OutputRoot $RunId
  $Observations.Add([ordered]@{
    workers = $Workers
    durationMs = [long]$Metrics.durationMs
    runId = $RunId
    manifestFile = Join-Path $RunRoot "manifest.json"
    planFile = Join-Path $RunRoot "coverage-plan.json"
  })
}

$InputFile = Join-Path $BenchmarkRoot "benchmark-input.json"
$ResultFile = Join-Path $BenchmarkRoot "benchmark-result.json"
$Input = [ordered]@{
  schemaVersion = 1
  benchmarkId = $BenchmarkId
  expectedCommit = $Head
  acceleratorRecord = "chromium-headless-software"
  requiredWorkerCounts = $RequiredWorkers
  observations = @($Observations)
}
[IO.File]::WriteAllText(
  $InputFile,
  (($Input | ConvertTo-Json -Depth 8) + [Environment]::NewLine),
  [Text.UTF8Encoding]::new($false)
)

& npm --prefix $AuditPackage run build
if ($LASTEXITCODE -ne 0) { throw "Local audit build failed." }
& node (Join-Path $AuditPackage "dist\benchmark.js") $InputFile $ResultFile
if ($LASTEXITCODE -ne 0) { throw "Worker benchmark equivalence validation failed." }

$Result = Get-Content -LiteralPath $ResultFile -Raw | ConvertFrom-Json
Write-Host "Worker benchmark completed: $BenchmarkRoot"
Write-Host "Selected workers: $($Result.selectedWorkers)"
