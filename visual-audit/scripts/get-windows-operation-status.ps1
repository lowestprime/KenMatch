[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BenchmarkId,
  [int]$TailLines = 60
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($BenchmarkId -notmatch "^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$") {
  throw "BenchmarkId contains unsupported characters."
}
if ($TailLines -lt 1 -or $TailLines -gt 200) {
  throw "TailLines must be between 1 and 200."
}

$RepoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $RepoRoot) { throw "Run this command from the KenMatch repository." }
$RepoRoot = [IO.Path]::GetFullPath($RepoRoot)
$ProcessRoot = Join-Path $RepoRoot "visual-audit\.benchmarks\.processes\$BenchmarkId"
$MetadataFile = Join-Path $ProcessRoot "process.json"
if (-not (Test-Path -LiteralPath $MetadataFile -PathType Leaf)) {
  throw "Process metadata is missing for $BenchmarkId."
}
$Metadata = Get-Content -LiteralPath $MetadataFile -Raw | ConvertFrom-Json
$ExitCodeFile = [string]$Metadata.exitCodeFile
$ResultFile = Join-Path ([string]$Metadata.benchmarkRoot) "benchmark-result.json"
$ExitExists = Test-Path -LiteralPath $ExitCodeFile -PathType Leaf
$ExitCode = if ($ExitExists) { (Get-Content -LiteralPath $ExitCodeFile -Raw).Trim() } else { $null }
$Process = if ($ExitExists) { $null } else { Get-Process -Id ([int]$Metadata.pid) -ErrorAction SilentlyContinue }
$ProcessStart = if ($Process) { try { $Process.StartTime.ToUniversalTime() } catch { $null } } else { $null }
$ExpectedStart = [DateTime]::Parse([string]$Metadata.startTimestamp).ToUniversalTime()
$ProcessMatches = $Process `
  -and $Process.ProcessName.Equals([string]$Metadata.expectedProcessName, [StringComparison]::OrdinalIgnoreCase) `
  -and $ProcessStart `
  -and $ProcessStart -ge $ExpectedStart.AddSeconds(-5)
$State = if ($ExitExists) {
  if ($ExitCode -eq "0") { "succeeded" } else { "failed" }
} elseif ($ProcessMatches) {
  "running"
} else {
  "terminated-without-exit-code"
}

$Snapshot = [ordered]@{
  schemaVersion = 1
  inspectedAt = [DateTime]::UtcNow.ToString("o")
  state = $State
  metadata = $Metadata
  currentProcess = if ($Process) {
    [ordered]@{
      id = $Process.Id
      name = $Process.ProcessName
      startTime = if ($ProcessStart) { $ProcessStart.ToString("o") } else { $null }
      matchesMetadata = [bool]$ProcessMatches
    }
  } else { $null }
  exitCodeFileExists = $ExitExists
  exitCode = $ExitCode
  resultFileExists = Test-Path -LiteralPath $ResultFile -PathType Leaf
  resultSha256 = if (Test-Path -LiteralPath $ResultFile -PathType Leaf) {
    (Get-FileHash -Algorithm SHA256 -LiteralPath $ResultFile).Hash
  } else { $null }
  stdoutTail = if (Test-Path -LiteralPath ([string]$Metadata.stdoutLog) -PathType Leaf) {
    @(Get-Content -LiteralPath ([string]$Metadata.stdoutLog) -Tail $TailLines)
  } else { @() }
  stderrTail = if (Test-Path -LiteralPath ([string]$Metadata.stderrLog) -PathType Leaf) {
    @(Get-Content -LiteralPath ([string]$Metadata.stderrLog) -Tail $TailLines)
  } else { @() }
}
$Snapshot | ConvertTo-Json -Depth 8
