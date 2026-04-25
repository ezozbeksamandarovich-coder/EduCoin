# EduCoin Mobile (Node + Flutter)

Bu repoda mobil build uchun ikkita asosiy qism bor:

- `server.js` -> asosiy Node API
- `mobile-flutter/` -> Flutter app

## 1) Backend ishga tushirish

Talablar:

- Node.js

Ishga tushirish:

```powershell
npm start
```

API manzillari:

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/login`
- `http://localhost:3000/api/dashboard/{role}`

Demo login:

- `admin / DeveloperE`

## 2) Flutter app ishga tushirish

Talablar:

- Flutter SDK
- Android Studio yoki emulator

Ishga tushirish:

```bash
cd mobile-flutter
flutter pub get
flutter run
```

Eslatma:

- `mobile-flutter/lib/config.dart` ichida API URL `10.0.2.2:3000` ga qo'yilgan.
- Android emulator uchun `10.0.2.2` ishlaydi.
- Real telefon bo'lsa, shu joyga kompyuteringizning LAN IP manzilini yozing.
