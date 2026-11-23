[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$')][string]$Repository,
    [Parameter(Mandatory)][string]$Keystore,
    [Parameter(Mandatory)][string]$PasswordFile,
    [Parameter(Mandatory)][string]$BuildToolsDirectory,
    [Parameter(Mandatory)][string]$JavaHome,
    [string]$GhPath = 'gh.exe',
    [string]$GitPath = 'git.exe',
    [string]$NodePath = 'node.exe',
    [string]$InstallDirectory = (Join-Path $env:LOCALAPPDATA 'BebechDestroyer\Publisher'),
    [switch]$NoStartup
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$dest = [IO.Path]::GetFullPath($InstallDirectory)
$source = Split-Path -Parent $PSScriptRoot
if ($dest.StartsWith($source + '\', [StringComparison]::OrdinalIgnoreCase) -or $dest -eq $source) {
    throw 'Wybierz prywatny katalog instalacji poza repozytorium.'
}
$config = [ordered]@{
    Repository = $Repository
    Keystore = (Get-Item -LiteralPath $Keystore).FullName
    PasswordFile = (Get-Item -LiteralPath $PasswordFile).FullName
    BuildToolsDirectory = (Get-Item -LiteralPath $BuildToolsDirectory).FullName
    JavaHome = (Get-Item -LiteralPath $JavaHome).FullName
    GhPath = (Get-Command $GhPath -CommandType Application).Source
    GitPath = (Get-Command $GitPath -CommandType Application).Source
    NodePath = (Get-Command $NodePath -CommandType Application).Source
    PowerShellPath = (Get-Item -LiteralPath "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe").FullName
}
$files = @('admin\watch-releases.ps1','admin\release-local.ps1','admin\release-local.mjs','ci\publish.mjs')
[void][IO.Directory]::CreateDirectory($dest)
$configFile = Join-Path $dest 'watcher.json'
$newConfig = $config | ConvertTo-Json
$changed = -not [IO.File]::Exists($configFile) -or [IO.File]::ReadAllText($configFile) -cne $newConfig
foreach ($file in $files) {
    $copy = Join-Path $dest $file
    if (-not [IO.File]::Exists($copy) -or (Get-FileHash -LiteralPath (Join-Path $source $file)).Hash -ne (Get-FileHash -LiteralPath $copy).Hash) { $changed = $true }
}
if ($changed) {
    $pauseFile = Join-Path $dest 'paused'
    $wasPaused = [IO.File]::Exists($pauseFile)
    if (-not $wasPaused) { [IO.File]::WriteAllText($pauseFile,'') }
    $end = [DateTime]::UtcNow.AddMinutes(5)
    $lock = $null
    try {
        while (-not $lock) {
            try { $lock = [IO.File]::Open((Join-Path $dest 'worker.lock'),'OpenOrCreate','ReadWrite','None') }
            catch [IO.IOException] {
                if ([DateTime]::UtcNow -gt $end -or ($_.Exception.HResult -band 0xffff) -notin @(32,33)) { throw }
                Start-Sleep -Milliseconds 300
            }
        }
        foreach ($file in $files) {
            $copy = Join-Path $dest $file
            [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($copy))
            Copy-Item -LiteralPath (Join-Path $source $file) -Destination $copy -Force
        }
        [IO.File]::WriteAllText($configFile,$newConfig)
    } finally {
        if ($lock) { $lock.Dispose() }
        if (-not $wasPaused) { [IO.File]::Delete($pauseFile) }
    }
}
if ($NoStartup) { Write-Output "Konfiguracja lokalna: $dest"; return }

$watch = Join-Path $dest 'admin\watch-releases.ps1'
$arguments = '-WindowStyle Hidden -NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "' + $watch + '"'
$startupPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'BebechDestroyer Publisher.lnk'
$link = (New-Object -ComObject WScript.Shell).CreateShortcut($startupPath)
$link.TargetPath = $config.PowerShellPath
$link.Arguments = $arguments
$link.WorkingDirectory = $dest
$link.Description = 'Lokalne podpisywanie wydan BebechDestroyer'
$link.WindowStyle = 7
$link.Save()
Start-Process -FilePath $config.PowerShellPath -ArgumentList $arguments -WorkingDirectory $dest -WindowStyle Hidden
Write-Output "Wlaczono lokalne podpisywanie po zalogowaniu do Windows. Dziennik: $dest\watcher.log"
