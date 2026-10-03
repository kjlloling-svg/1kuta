$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$destination = Join-Path (Get-Location) '.env.vercel.local'
if (Test-Path -LiteralPath $destination) { throw '.env.vercel.local already exists. Edit that ignored file privately to update its settings.' }
function Read-PrivateValue([string]$name) {
    $secure = Read-Host $name -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
$settings = [ordered]@{}
foreach ($name in @('TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BLOB_READ_WRITE_TOKEN','GOOGLE_CLIENT_ID')) {
    $value = Read-PrivateValue $name
    if ([string]::IsNullOrWhiteSpace($value) -or $value.Contains("`n") -or $value.Contains("`r")) { throw "Invalid $name. No settings were saved." }
    $settings[$name] = $value
}
if ($settings['TURSO_DATABASE_URL'] -notmatch '^(libsql|https)://') { throw 'Use the remote Turso database URL.' }
$secretBytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
$settings['SESSION_SECRET'] = [Convert]::ToBase64String($secretBytes)
$lines = foreach ($name in $settings.Keys) { "$name=$($settings[$name] | ConvertTo-Json -Compress)" }
[IO.File]::WriteAllLines($destination, $lines, (New-Object Text.UTF8Encoding $false))
Write-Host 'Saved settings in ignored .env.vercel.local. No values were displayed. Never commit or share this file.'
