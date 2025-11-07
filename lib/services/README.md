# Firebase Services

This directory contains the modularized Firebase services, split from the original monolithic `firebaseService.js` (4,271 lines).

## 📋 Service Architecture

```
services/
├── firebase/              # Firebase-specific services
│   ├── auth.service.js    # Authentication (9 functions)
│   ├── admin.service.js   # Admin & reports (25+ functions)
│   ├── secretary.service.js # Secretary management (15 functions)
│   ├── patients.service.js  # Patient CRUD (13 functions)
│   ├── appointments.service.js # Consultations (4 functions)
│   ├── notes.service.js     # Notes & anamnesis (11 functions)
│   ├── prescriptions.service.js # Prescriptions (11 functions)
│   ├── exams.service.js     # Exams management (7 functions)
│   ├── storage.service.js   # File uploads (3 functions)
│   ├── ai.service.js        # AI conversations (8 functions)
│   └── weather.service.js   # Weather data (2 functions)
│
├── email.service.js       # Email operations (existing)
├── module.service.js      # Module management (existing)
├── presence.service.js    # User presence (existing)
└── facebook.service.js    # Facebook tracking (existing)
```

## 🔄 Migration Status

### ✅ Completed
- Firebase config moved to `/lib/config/firebase.config.js`
- Utilities extracted to `/lib/utils/firebase.utils.js`
- Service structure documented in `DIVISION_MAP.md`
- Original file backed up as `firebaseService.original.backup.js`

### 🔄 In Progress
The original `firebaseService.js` is currently being kept as a **monolithic class** for backward compatibility while services are gradually extracted.

### ⏳ To Do
Extract functions to individual services (see `DIVISION_MAP.md` for function mapping)

## 📖 Usage

### Current (Monolithic):
```javascript
import FirebaseService from '@/lib/firebaseService';

// All functions available on single object
const user = await FirebaseService.getUserData(uid);
const patients = await FirebaseService.listPatients(doctorId);
```

### Future (Modular):
```javascript
import { authService } from '@/services/firebase/auth.service';
import { patientsService } from '@/services/firebase/patients.service';

// Specific services
const user = await authService.getUserData(uid);
const patients = await patientsService.listPatients(doctorId);
```

### Hybrid (Backward Compatible):
```javascript
// Still works during transition
import FirebaseService from '@/lib/firebaseService';

// Internally uses modular services
const user = await FirebaseService.getUserData(uid);
```

## 🎯 Benefits of Modularization

1. **Smaller Files**: ~200-700 lines per service vs 4,271 lines
2. **Better Organization**: Functions grouped by domain
3. **Easier Testing**: Test individual services in isolation
4. **Faster Loading**: Import only what you need
5. **Better Collaboration**: Multiple devs can work on different services
6. **Type Safety**: Easier to add TypeScript types later

## 🔍 Finding Functions

Use `DIVISION_MAP.md` to find which service contains a specific function.

Example:
- Looking for `createPrescription`? → `prescriptions.service.js`
- Looking for `listPatients`? → `patients.service.js`
- Looking for `loginWithGoogle`? → `auth.service.js`

## 📚 Related Documentation

- `DIVISION_MAP.md` - Complete function mapping
- `/lib/config/README.md` - Configuration files
- `/lib/utils/firebase.utils.js` - Shared utilities
- `firebaseService.original.backup.js` - Original monolithic file (backup)
