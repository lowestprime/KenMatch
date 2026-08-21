[CmdletBinding()]
param(
  [string]$BenchmarkId = "",
  [int]$LivenessDelaySeconds = 5
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if ($LivenessDelaySeconds -lt 1 -or $LivenessDelaySeconds -gt 30) {
  throw "LivenessDelaySeconds must be between 1 and 30."
}

$RepoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $RepoRoot) { throw "Run this command from the KenMatch repository." }
$RepoRoot = [IO.Path]::GetFullPath($RepoRoot)
$Head = (& git -C $RepoRoot rev-parse HEAD).Trim()
$Status = (& git -C $RepoRoot status --porcelain=v1 --untracked-files=all) -join "`n"
if ($Status) { throw "Detached benchmark launch requires a clean exact candidate commit." }

if (-not $BenchmarkId) {
  $stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
  $BenchmarkId = "$stamp-tier1-smoke-workers-$($Head.Substring(0, 12))"
}
if ($BenchmarkId -notmatch "^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$") {
  throw "BenchmarkId contains unsupported characters."
}

$ProcessRoot = Join-Path $RepoRoot "visual-audit\.benchmarks\.processes\$BenchmarkId"
$BenchmarkRoot = Join-Path $RepoRoot "visual-audit\.benchmarks\$BenchmarkId"
if ((Test-Path -LiteralPath $ProcessRoot) -or (Test-Path -LiteralPath $BenchmarkRoot)) {
  throw "Benchmark or process metadata already exists for $BenchmarkId."
}
New-Item -ItemType Directory -Force -Path $ProcessRoot | Out-Null

$StdoutLog = Join-Path $ProcessRoot "stdout.log"
$StderrLog = Join-Path $ProcessRoot "stderr.log"
$ExitCodeFile = Join-Path $ProcessRoot "exit-code.txt"
$LauncherFile = Join-Path $ProcessRoot "launcher.ps1"
$MetadataFile = Join-Path $ProcessRoot "process.json"
$BenchmarkScript = Join-Path $RepoRoot "visual-audit\scripts\run-windows-benchmark.ps1"
$LauncherText = @"
`$ErrorActionPreference = "Stop"
`$exitCode = 0
try {
  & '$BenchmarkScript' -BenchmarkId '$BenchmarkId'
} catch {
  [Console]::Error.WriteLine(`$_.Exception.ToString())
  `$exitCode = 1
} finally {
  [IO.File]::WriteAllText('$ExitCodeFile', "`$exitCode`n", [Text.UTF8Encoding]::new(`$false))
}
exit `$exitCode
"@
[IO.File]::WriteAllText($LauncherFile, $LauncherText, [Text.UTF8Encoding]::new($false))

$PowerShellPath = (Get-Command powershell.exe).Source
$ExactCommand = "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$LauncherFile`""
$StartedAt = [DateTime]::UtcNow.ToString("o")
$Process = Start-Process `
  -FilePath $PowerShellPath `
  -ArgumentList @("-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", $LauncherFile) `
  -WorkingDirectory $RepoRoot `
  -RedirectStandardOutput $StdoutLog `
  -RedirectStandardError $StderrLog `
  -WindowStyle Hidden `
  -PassThru
Start-Sleep -Seconds $LivenessDelaySeconds
$Process.Refresh()
$Alive = -not $Process.HasExited
$ProofAt = [DateTime]::UtcNow.ToString("o")

$Metadata = [ordered]@{
  schemaVersion = 1
  operationType = "tier1-smoke-worker-benchmark"
  benchmarkId = $BenchmarkId
  purpose = "Benchmark Tier-1 smoke capture workers 1, 2, and 4 with deterministic equivalence gates."
  expectedCommit = $Head
  pid = $Process.Id
  expectedProcessName = "powershell"
  exactCommand = $ExactCommand
  startTimestamp = $StartedAt
  proofAliveAt = $ProofAt
  aliveAfterLaunch = $Alive
  stdoutLog = $StdoutLog
  stderrLog = $StderrLog
  exitCodeFile = $ExitCodeFile
  launcherFile = $LauncherFile
  benchmarkRoot = $BenchmarkRoot
}
$MetadataTemp = "$MetadataFile.tmp-$PID"
[IO.File]::WriteAllText(
  $MetadataTemp,
  (($Metadata | ConvertTo-Json -Depth 6) + [Environment]::NewLine),
  [Text.UTF8Encoding]::new($false)
)
Move-Item -LiteralPath $MetadataTemp -Destination $MetadataFile -Force

$Metadata | ConvertTo-Json -Depth 6
if (-not $Alive) {
  throw "Detached benchmark exited before liveness proof. Inspect once with get-windows-operation-status.ps1."
}
