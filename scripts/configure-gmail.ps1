$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$destination = Join-Path (Get-Location) '.env.gmail.local'
if (Test-Path -LiteralPath $destination) { throw '.env.gmail.local already exists. Edit that ignored file privately to update its settings.' }
function Read-PrivateValue([string]$name) {
    $secure = Read-Host $name -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
$settings = [ordered]@{}
foreach ($name in @('GMAIL_CLIENT_ID','GMAIL_CLIENT_SECRET','GMAIL_REFRESH_TOKEN','GMAIL_SENDER_EMAIL')) {
    $value = (Read-PrivateValue $name).Trim()
    if ([string]::IsNullOrWhiteSpace($value) -or $value.Contains("`n") -or $value.Contains("`r") -or $value.Contains('"')) { throw "Invalid $name. Paste only its value. No settings were saved." }
    $settings[$name] = $value
}
if ($settings['GMAIL_CLIENT_ID'] -notmatch '\.apps\.googleusercontent\.com$') { throw 'Use the client ID for your separate Gmail sending OAuth client.' }
if ($settings['GMAIL_SENDER_EMAIL'] -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') { throw 'Use the Gmail address that authorized the refresh token.' }
$secretBytes = New-Object byte[] 48
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
$settings['PASSWORD_RESET_SECRET'] = [Convert]::ToBase64String($secretBytes)
$lines = foreach ($name in $settings.Keys) { "$name=$($settings[$name] | ConvertTo-Json -Compress)" }
[IO.File]::WriteAllLines($destination, $lines, (New-Object Text.UTF8Encoding $false))
Write-Host 'Saved .env.gmail.local for private import into Vercel. Values were not displayed. Never send this file in chat or commit it.'
