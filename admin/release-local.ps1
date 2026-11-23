[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Repository,
    [Parameter(Mandatory)][string]$Keystore,
    [Parameter(Mandatory)][string]$PasswordFile,
    [Parameter(Mandatory)][string]$BuildToolsDirectory,
    [Parameter(Mandatory)][string]$JavaHome,
    [string]$GhPath = 'gh',
    [string]$GitPath = 'git',
    [string]$NodePath = 'node',
    [string]$GitHubCredentialFile
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$env:NODE_USE_SYSTEM_CA = '1'
if ($env:GITHUB_ACTIONS -eq 'true') { throw 'Uruchom podpisywanie na komputerze wlasciciela.' }
if ($GitHubCredentialFile) {
    $credential = ConvertTo-SecureString ([IO.File]::ReadAllText((Get-Item -LiteralPath $GitHubCredentialFile).FullName))
    $env:GH_TOKEN = [Net.NetworkCredential]::new('', $credential).Password
}
$store = (Resolve-Path -LiteralPath $Keystore).Path
$password = (Resolve-Path -LiteralPath $PasswordFile).Path
$signer = (Resolve-Path -LiteralPath (Join-Path $BuildToolsDirectory 'lib/apksigner.jar')).Path
$java = (Resolve-Path -LiteralPath (Join-Path $JavaHome 'bin/java.exe')).Path
$aapt = (Resolve-Path -LiteralPath (Join-Path $BuildToolsDirectory 'aapt2.exe')).Path
$align = (Resolve-Path -LiteralPath (Join-Path $BuildToolsDirectory 'zipalign.exe')).Path
$module = Join-Path $PSScriptRoot 'release-local.mjs'
$expectedCert = 'c6c1281331c02a21e97738839707237c0e0e44be1b02fc4198654ebe4742341a'

$tempRoot = (Get-Item -LiteralPath ([IO.Path]::GetTempPath())).FullName
$leaf = 'BebechDestroyer-' + [Guid]::NewGuid().ToString('N')
$dir = (New-Item -ItemType Directory -Path (Join-Path $tempRoot $leaf)).FullName
try {
    & $NodePath $module prepare $Repository $dir $GhPath $GitPath
    if ($LASTEXITCODE -ne 0) { throw 'Sprawdzenie przebiegu GitHub Actions nie powiodlo sie.' }
    $decision = Get-Content -LiteralPath (Join-Path $dir 'decision.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if (-not $decision.ready) { return }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead((Join-Path $dir 'artifact.zip'))
    $unsigned = Join-Path $dir 'input.apk'
    $signed = Join-Path $dir 'BebechDestroyer.apk'
    try {
        $entry = $archive.GetEntry('app-release-unsigned.apk')
        if ($archive.Entries.Count -ne 1 -or -not $entry -or $entry.Length -le 0 -or $entry.Length -gt 64MB) {
            throw 'Oczekiwano pojedynczego pliku app-release-unsigned.apk.'
        }
        $inputStream = $entry.Open()
        try {
            $output = [IO.File]::Open($unsigned, 'CreateNew', 'Write', 'None')
            try {
                $buffer = New-Object byte[] 65536
                while (($count = $inputStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                    if ($output.Length + $count -gt $entry.Length) { throw 'Nieprawidlowy rozmiar APK.' }
                    $output.Write($buffer, 0, $count)
                }
                if ($output.Length -ne $entry.Length) { throw 'Niepelny APK.' }
            } finally { $output.Dispose() }
        } finally { $inputStream.Dispose() }
    } finally { $archive.Dispose() }

    $manifest = & $aapt dump badging $unsigned
    $pkg = "package: name='pl.rozstaw.app' versionCode='$($decision.code)' versionName='$($decision.version)'"
    if ($LASTEXITCODE -ne 0 -or -not $manifest -or -not $manifest[0].StartsWith($pkg)) {
        throw 'Pakiet lub wersja w manifescie nie odpowiada wydaniu z master.'
    }
    & $align -c -P 16 4 $unsigned
    if ($LASTEXITCODE -ne 0) { throw 'Niepoprawne wyrownanie APK.' }

    # apksigner reads the password locally; command arguments contain only its path.
    & $java -jar $signer sign --ks $store --ks-key-alias rozstaw --ks-pass "file:$password" --v4-signing-enabled false --out $signed $unsigned
    if ($LASTEXITCODE -ne 0) { throw 'Podpisywanie nie powiodlo sie.' }
    $info = & $java -jar $signer verify --verbose --print-certs $signed
    if ($LASTEXITCODE -ne 0 -or $info -notcontains 'Number of signers: 1' -or $info -notcontains "Signer #1 certificate SHA-256 digest: $expectedCert") {
        throw 'Podpis nie odpowiada oryginalnym wydaniom Rozstaw.'
    }
    & $NodePath $module publish $Repository $dir $GhPath
    if ($LASTEXITCODE -ne 0) { throw 'Publikacja nie powiodla sie.' }
} finally {
    $created = Get-Item -LiteralPath $dir
    if ($created.FullName -eq [IO.Path]::GetFullPath((Join-Path $tempRoot $leaf)) -and -not ($created.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        Remove-Item -LiteralPath $created.FullName -Recurse -Force
    }
}
