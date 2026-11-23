[CmdletBinding()]
param(
    [switch]$Once
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$installDir = Split-Path -Parent $PSScriptRoot
$pausePath = Join-Path $installDir 'paused'
$config = Get-Content -LiteralPath (Join-Path $installDir 'watcher.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$logPath = Join-Path $installDir 'watcher.log'
$signer = Join-Path $PSScriptRoot 'release-local.ps1'

function Write-Status([string]$Message) {
    $line = '{0} {1}' -f [DateTimeOffset]::Now.ToString('o'), $Message
    if ((Test-Path -LiteralPath $logPath -PathType Leaf) -and (Get-Item -LiteralPath $logPath).Length -ge 131072) {
        [IO.File]::Copy($logPath, "$logPath.previous", $true)
        [IO.File]::WriteAllText($logPath, '')
    }
    [IO.File]::AppendAllText($logPath, $line + [Environment]::NewLine)
}
if (Test-Path -LiteralPath $pausePath) { return }
Set-Location -LiteralPath $installDir
try {
    $guard = [IO.File]::Open((Join-Path $installDir 'worker.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
} catch [IO.IOException] {
    if (($_.Exception.HResult -band 0xffff) -in @(32, 33)) { return }
    throw
}
$exitCode = 0
try {
    $env:GH_PROMPT_DISABLED = '1'
    $env:GIT_TERMINAL_PROMPT = '0'
    $env:GH_NO_UPDATE_NOTIFIER = '1'
    $arguments = @(
        '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'RemoteSigned', '-File', $signer,
        '-Repository', $config.Repository, '-Keystore', $config.Keystore,
        '-PasswordFile', $config.PasswordFile, '-BuildToolsDirectory', $config.BuildToolsDirectory,
        '-JavaHome', $config.JavaHome, '-GhPath', $config.GhPath, '-GitPath', $config.GitPath,
        '-NodePath', $config.NodePath
    )
    if ($config.PSObject.Properties['GitHubCredentialFile']) {
        $arguments += @('-GitHubCredentialFile', $config.GitHubCredentialFile)
    }
    $failures = 0
    Write-Status 'Watcher started.'
    while (-not (Test-Path -LiteralPath $pausePath)) {
        # Child output could include tool diagnostics. Only record the outcome.
        try {
            & $config.PowerShellPath @arguments *> $null
            $ok = $LASTEXITCODE -eq 0
        } catch {
            $ok = $false
        }
        if ($ok) {
            if ($failures -gt 0) { Write-Status 'Connection or release check recovered.' }
            $failures = 0
            $delay = 300
        } else {
            $failures = [Math]::Min(7, $failures + 1)
            $delay = [int][Math]::Min(1800, 60 * [Math]::Pow(2, $failures - 1))
            if ($failures -eq 1) {
                Write-Status 'Check failed. Retrying automatically. Run release-local.ps1 directly for details.'
            }
        }
        if ($Once) {
            if (-not $ok) { $exitCode = 1 }
            break
        }
        $timer = [Diagnostics.Stopwatch]::StartNew()
        while ($timer.Elapsed.TotalSeconds -lt $delay -and -not (Test-Path -LiteralPath $pausePath)) {
            Start-Sleep -Seconds 2
        }
    }
} finally {
    $guard.Dispose()
}
exit $exitCode
