$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$flutterDir = Join-Path $repoRoot "mobile-flutter"
$downloadsDir = Join-Path $repoRoot "downloads"

if (-not (Test-Path $flutterDir)) {
  throw "mobile-flutter papkasi topilmadi: $flutterDir"
}

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw "Flutter CLI topilmadi. Flutter SDK ni o'rnatib PATH ga qo'shing."
}

New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null

Push-Location $flutterDir
try {
  $platforms = @()
  if (-not (Test-Path (Join-Path $flutterDir "android"))) { $platforms += "android" }
  if (-not (Test-Path (Join-Path $flutterDir "windows"))) { $platforms += "windows" }
  if ($platforms.Count -gt 0) {
    flutter create --platforms ($platforms -join ",") .
  }

  flutter pub get

  flutter config --enable-windows-desktop | Out-Null

  flutter build windows --release
  flutter build apk --release

  $releaseDir = Join-Path $flutterDir "build\windows\x64\runner\Release"
  $exeSource = Get-ChildItem -Path $releaseDir -Filter *.exe -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First 1 -ExpandProperty FullName
  $apkSource = Join-Path $flutterDir "build\app\outputs\flutter-apk\app-release.apk"

  if (-not $exeSource -or -not (Test-Path $exeSource)) {
    throw "Windows exe topilmadi: $releaseDir"
  }

  if (-not (Test-Path $apkSource)) {
    throw "Android apk topilmadi: $apkSource"
  }

  Copy-Item $exeSource (Join-Path $downloadsDir "EduCoin-Setup.exe") -Force
  Copy-Item $apkSource (Join-Path $downloadsDir "EduCoin-Mobile.apk") -Force
}
finally {
  Pop-Location
}

Write-Host "Tayyor: $downloadsDir\EduCoin-Setup.exe"
Write-Host "Tayyor: $downloadsDir\EduCoin-Mobile.apk"
