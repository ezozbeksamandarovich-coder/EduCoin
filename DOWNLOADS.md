# EduCoin Download Files

Bu loyiha landing sahifadagi quyidagi linklar uchun fayl kutadi:

- `downloads/EduCoin-Setup.exe` (Windows)
- `downloads/EduCoin-Mobile.apk` (Flutter Android)

## 1) Talablar

- Flutter SDK (`flutter --version` ishlashi kerak)
- Windows build uchun: Visual Studio (Desktop development with C++)
- Android build uchun: Android SDK + Java

## 2) Bir buyruq bilan fayllarni tayyorlash

PowerShell'da repo root ichida ishga tushiring:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-downloads.ps1
```

Script quyidagilarni qiladi:

- Agar `android/` yoki `windows/` platform papkalari yo‘q bo‘lsa, ularni avtomatik yaratadi

- Flutter dependencies o‘rnatadi
- `flutter build windows` orqali Windows release build qiladi
- `flutter build apk --release` orqali Android APK build qiladi
- Natijalarni `downloads/` papkasiga nusxalaydi:
  - `EduCoin-Setup.exe`
  - `EduCoin-Mobile.apk`

## 3) Eslatma

Repo ichida oldindan `.exe` yoki `.apk` saqlanmaydi. Ular build qilingandan keyin paydo bo‘ladi.
