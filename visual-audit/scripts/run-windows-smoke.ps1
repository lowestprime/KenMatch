[CmdletBinding()]
param(
  [ValidateSet("tier-1-synthetic", "tier-2-production-clone")]
  [string]$Tier = "tier-1-synthetic",
  [ValidateSet("smoke", "full")]
  [string]$Scope = "smoke",
  [string]$RunId = "",
  [string]$SourceDatabase = "",
  [string]$OutputRoot = "",
  [switch]$CaptureOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command is unavailable: $Name"
  }
}

function New-SecretFile([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    if ((Get-Item -LiteralPath $Path).Length -gt 0) { return }
    throw "Secret file is empty: $Path"
  }
  $bytes = [byte[]]::new(32)
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  $hex = ($bytes | ForEach-Object { $_.ToString("x2", [Globalization.CultureInfo]::InvariantCulture) }) -join ""
  [IO.File]::WriteAllText($Path, $hex, [Text.UTF8Encoding]::new($false))
}

function Protect-StateDirectory([string]$Path) {
  $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  & icacls.exe $Path /inheritance:r /grant:r "*$sid`:(OI)(CI)(F)" /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Could not restrict the audit state directory ACL." }
  Get-ChildItem -LiteralPath $Path -Recurse -Force | ForEach-Object {
    $grant = if ($_.PSIsContainer) { "*$sid`:(OI)(CI)(F)" } else { "*$sid`:(F)" }
    & icacls.exe $_.FullName /inheritance:r /grant:r $grant /Q | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not restrict the audit state ACL for $($_.FullName)." }
    if (-not $_.PSIsContainer) {
      $stream = [IO.File]::OpenRead($_.FullName)
      $stream.Dispose()
    }
  }
}

Assert-Command git
Assert-Command docker
Assert-Command node

$RepoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $RepoRoot) { throw "Run this command from the KenMatch repository." }
$RepoRoot = [IO.Path]::GetFullPath($RepoRoot)
$OutputRoot = if ($OutputRoot) {
  [IO.Path]::GetFullPath($OutputRoot)
} else {
  Join-Path $RepoRoot "visual-audits"
}
$RepoPrefix = $RepoRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $OutputRoot.StartsWith($RepoPrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "OutputRoot must remain inside the KenMatch repository."
}
$Head = (& git -C $RepoRoot rev-parse HEAD).Trim()
if ($env:TARGET_COMMIT_SHA) {
  $Requested = (& git -C $RepoRoot rev-parse "$($env:TARGET_COMMIT_SHA)^{commit}").Trim()
  if ($Requested -ne $Head) { throw "TARGET_COMMIT_SHA must equal the checked-out commit." }
}
& git -C $RepoRoot diff --quiet
if ($LASTEXITCODE -ne 0) { throw "Tracked working-tree changes must be committed before a formal smoke archive." }
& git -C $RepoRoot diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw "Staged changes must be committed before a formal smoke archive." }
$Status = (& git -C $RepoRoot status --porcelain=v1 --untracked-files=all) -join "`n"
if ($Status) { throw "Formal capture requires a clean exact candidate commit." }

if (-not $RunId) {
  $stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
  $RunId = "$stamp-windows-smoke-$($Head.Substring(0, 12))"
}
if ($RunId -notmatch "^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$") {
  throw "RunId contains unsupported characters."
}
$StateDir = if ($env:AUDIT_STATE_DIR) {
  [IO.Path]::GetFullPath($env:AUDIT_STATE_DIR)
} else {
  Join-Path $RepoRoot "visual-audit\.state\$RunId"
}
$TmpDir = Join-Path $StateDir "tmp"
$LabRoot = Join-Path $StateDir "lab"
$RunRoot = Join-Path $OutputRoot $RunId
$ComposeFile = Join-Path $RepoRoot "docker-compose.visual-audit-lab.yml"
New-Item -ItemType Directory -Force -Path $StateDir, $TmpDir, $OutputRoot, $RunRoot | Out-Null
New-SecretFile (Join-Path $StateDir "audit-token")
New-SecretFile (Join-Path $StateDir "test-auth-token")
New-SecretFile (Join-Path $StateDir "visitor-salt")
Protect-StateDirectory $StateDir
Protect-StateDirectory $RunRoot

$Provenance = if ($Tier -eq "tier-1-synthetic") { "synthetic-fixture" } else { "production-clone" }
if ($Tier -eq "tier-2-production-clone") {
  if (-not $SourceDatabase) { throw "Tier 2 requires -SourceDatabase." }
  $SourceDatabase = [IO.Path]::GetFullPath($SourceDatabase)
  if (-not (Test-Path -LiteralPath $SourceDatabase -PathType Leaf)) {
    throw "Source database does not exist: $SourceDatabase"
  }
}

$env:AUDIT_EVIDENCE_TIER = $Tier
$env:AUDIT_DATA_PROVENANCE = $Provenance
$env:AUDIT_SCOPE = $Scope
$env:AUDIT_RUN_ID = $RunId
$env:REPO_ROOT = $RepoRoot
$env:AUDIT_STATE_DIR = $StateDir
$env:AUDIT_TMP_DIR = $TmpDir
$env:AUDIT_LAB_ROOT = $LabRoot
$env:AUDIT_LAB_DATA_DIR = Join-Path $LabRoot "data"
$env:AUDIT_SOURCE_DATABASE = $SourceDatabase
$env:AUDIT_SNAPSHOT_EVIDENCE_FILE = Join-Path $StateDir "snapshot-evidence.json"
$env:AUDIT_SHAREABLE_APPROVAL_FILE = Join-Path $StateDir "shareable-approval.json"
$env:AUDIT_RUN_MANIFEST_FILE = Join-Path $RunRoot "manifest.json"
$env:TARGET_MODE = "snapshot-lab"
$env:BASE_URL = "http://kenmatch-audit-app:3000"
$env:RUN_OUTPUT_ROOT = $OutputRoot
$env:AUDIT_OUTPUT_DIR = $OutputRoot
$env:AUDIT_TMP_ROOT = $TmpDir
$env:AUDIT_HOST_FILESYSTEM = "windows-ntfs-bind"
$env:AUDIT_TOKEN_FILE = Join-Path $StateDir "audit-token"
$env:TEST_AUTH_TOKEN_FILE = Join-Path $StateDir "test-auth-token"
$env:TARGET_COMMIT_SHA = $Head
$env:KENMATCH_AUDIT_TOKEN = [IO.File]::ReadAllText((Join-Path $StateDir "audit-token")).Trim()
$env:KENMATCH_TEST_AUTH_BYPASS_TOKEN = [IO.File]::ReadAllText((Join-Path $StateDir "test-auth-token")).Trim()
$env:KENMATCH_VISITOR_HASH_SALT = [IO.File]::ReadAllText((Join-Path $StateDir "visitor-salt")).Trim()
$env:AUDIT_UID = "1000"
$env:AUDIT_GID = "1000"
$env:AUDIT_RESUME = if ($env:AUDIT_RESUME) { $env:AUDIT_RESUME } else { "true" }
$env:AUDIT_ACCELERATOR_RECORD = if ($env:AUDIT_ACCELERATOR_RECORD) { $env:AUDIT_ACCELERATOR_RECORD } else { "chromium-headless-software" }
$env:VISUAL_AUDIT_CAPTURE_WORKERS = if ($env:VISUAL_AUDIT_CAPTURE_WORKERS) { $env:VISUAL_AUDIT_CAPTURE_WORKERS } else { "1" }
$env:APPROVED_BASELINE_ROOT = if ($env:APPROVED_BASELINE_RUN_ID) { "/audit-output/$($env:APPROVED_BASELINE_RUN_ID)" } else { "" }
$env:COMPOSE_PROJECT_NAME = "kenmatch-audit-$($RunId.ToLowerInvariant().Replace('_','-').Substring(0, [Math]::Min(42, $RunId.Length)))"

$prepareScript = Join-Path $RepoRoot "visual-audit\scripts\prepare-snapshot.mjs"
$finalizeScript = Join-Path $RepoRoot "visual-audit\scripts\finalize-snapshot.mjs"
$auditPackage = Join-Path $RepoRoot "visual-audit"
$started = $false
$finalized = $false
$finalizeOnly = (Test-Path -LiteralPath $env:AUDIT_SHAREABLE_APPROVAL_FILE -PathType Leaf) `
  -and (Test-Path -LiteralPath $env:AUDIT_RUN_MANIFEST_FILE -PathType Leaf) `
  -and (Test-Path -LiteralPath (Join-Path $RunRoot "coverage-plan.json") -PathType Leaf)

if (-not $finalizeOnly) {
  try {
    & node $prepareScript
    if ($LASTEXITCODE -ne 0) { throw "Snapshot preparation failed." }
    & docker compose -f $ComposeFile config --quiet
    if ($LASTEXITCODE -ne 0) { throw "Compose validation failed." }
    & docker compose -f $ComposeFile build kenmatch-audit-app audit-runner
    if ($LASTEXITCODE -ne 0) { throw "Audit image build failed." }
    $started = $true
    & docker compose -f $ComposeFile up -d --wait kenmatch-audit-app
    if ($LASTEXITCODE -ne 0) { throw "Audit app failed to become healthy." }
    $captureStartedAt = [DateTime]::UtcNow
    $captureTimer = [Diagnostics.Stopwatch]::StartNew()
    $captureExitCode = 0
    try {
      & docker compose -f $ComposeFile run --rm --no-deps audit-runner dist/run.js
      $captureExitCode = $LASTEXITCODE
    } finally {
      $captureTimer.Stop()
      $captureMetrics = [ordered]@{
        schemaVersion = 1
        runId = $RunId
        expectedCommit = $Head
        workers = [int]$env:VISUAL_AUDIT_CAPTURE_WORKERS
        acceleratorRecord = $env:AUDIT_ACCELERATOR_RECORD
        startedAt = $captureStartedAt.ToString("o")
        completedAt = [DateTime]::UtcNow.ToString("o")
        durationMs = $captureTimer.ElapsedMilliseconds
        exitCode = $captureExitCode
      }
      $captureMetricsFile = Join-Path $StateDir "capture-metrics.json"
      $captureMetricsTemp = "$captureMetricsFile.tmp-$PID"
      [IO.File]::WriteAllText(
        $captureMetricsTemp,
        (($captureMetrics | ConvertTo-Json -Depth 5) + [Environment]::NewLine),
        [Text.UTF8Encoding]::new($false)
      )
      Move-Item -LiteralPath $captureMetricsTemp -Destination $captureMetricsFile -Force
    }
    if ($captureExitCode -ne 0) { throw "Visual capture failed." }
    & docker compose -f $ComposeFile down --remove-orphans
    if ($LASTEXITCODE -ne 0) { throw "Audit app cleanup failed." }
    $started = $false
    & node $finalizeScript
    if ($LASTEXITCODE -ne 0) { throw "Snapshot source/cleanup proof failed." }
    $finalized = $true
  } finally {
    if ($started) {
      & docker compose -f $ComposeFile down --remove-orphans 2>$null
    }
    if (-not $finalized -and (Test-Path -LiteralPath $env:AUDIT_SNAPSHOT_EVIDENCE_FILE)) {
      & node $finalizeScript 2>$null
    }
  }
} else {
  Write-Host "Using reviewed completed capture for native finalization: $RunRoot"
}

if ($CaptureOnly) {
  Protect-StateDirectory $RunRoot
  Write-Host "Capture-only archive completed: $RunRoot"
  return
}

& npm --prefix $auditPackage ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "Local audit dependency installation failed." }
& npm --prefix $auditPackage run build
if ($LASTEXITCODE -ne 0) { throw "Local audit build failed." }
& node (Join-Path $auditPackage "dist\compare.js")
if ($LASTEXITCODE -ne 0) { throw "Visual comparison failed." }
& node (Join-Path $auditPackage "dist\report.js")
if ($LASTEXITCODE -ne 0) { throw "Report generation failed." }
Protect-StateDirectory $RunRoot

Write-Host "Windows smoke archive captured: $RunRoot"
Write-Host "Private report: $(Join-Path $RunRoot 'report\index.html')"
if (Test-Path -LiteralPath $env:AUDIT_SHAREABLE_APPROVAL_FILE -PathType Leaf) {
  & node (Join-Path $auditPackage "dist\validate.js")
  if ($LASTEXITCODE -ne 0) { throw "Archive validation failed." }
  Write-Host "Validated Windows snapshot archive: $RunRoot"
} else {
  Write-Host "List review candidates with:"
  Write-Host "node visual-audit/scripts/review-shareable.mjs --run-root `"$RunRoot`" --state-file `"$($env:AUDIT_SHAREABLE_APPROVAL_FILE)`" --list"
  Write-Host "After approval, rerun this command with -RunId '$RunId' to finalize and validate."
  exit 3
}
