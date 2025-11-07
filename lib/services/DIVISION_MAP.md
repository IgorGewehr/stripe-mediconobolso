# Firebase Service Division Map

This document maps how the original `firebaseService.js` (4,271 lines) was divided into specialized services.

## Service Distribution

Based on the comment sections in the original file:

### 1. **auth.service.js** - Authentication & Users
**Lines**: ~158-377 (220 lines)
**Functions**:
- `login(email, password)`
- `signUp(email, password, userData)`
- `loginWithGoogle()`
- `signUpFreeWithGoogle(additionalData)`
- `completeGoogleProfile(uid, profileData)`
- `sendPasswordResetEmail(email)`
- `registerDetailedLogin(uid, loginMethod)`
- `getUserData(uid)`
- `editUserData(uid, newData)`

---

### 2. **admin.service.js** - Administration & Reports
**Lines**: ~509-1891 (1,382 lines) - LARGEST SERVICE
**Functions**:

#### Module Management:
- `initializeUserModules(uid, planType)`
- `checkModuleLimitations(uid, moduleId, currentCount)`
- `updateUserPlan(uid, newPlanType)`

#### User Management:
- `listAllUsers(pageSize, lastUser, searchQuery)`
- `getUsersWithPresenceData(options)`
- `enrichUserData(user)`
- `getUserDetailedStats(userId)`
- `getEnhancedPlatformStats()`
- `updateUserAdminStatus(userId, isAdmin)`

#### Messaging:
- `getAllUsersMessages(filters)`
- `getAdminUserConversation(userId)`
- `createAdminUserConversation(userId, initialMessage, adminInfo)`
- `sendAdminMessage(conversationId, message, adminInfo)`
- `getAllAdminUserConversations(filters)`

#### Reports:
- `createReport(userId, reportData)`
- `getUserReports(userId)`
- `addReportResponse(reportId, responseData)`
- `debugUserReports(userId)`
- `getAllReports(filters)`
- `updateReportStatus(reportId, status, updatedBy)`
- `markReportAsReadByUser(reportId)`
- `markReportAsReadByAdmin(reportId)`
- `getReportsStats()`
- `getReport(reportId)`

---

### 3. **secretary.service.js** - Secretary Management
**Lines**: ~1122-1891 (769 lines)
**Functions**:
- `createSecretaryAccount(doctorId, secretaryData)`
- `validateSecretaryCreation(doctorId, secretaryData)`
- `countDoctorSecretaries(doctorId)`
- `checkEmailExistsInSystemSimplified(email)`
- `checkEmailExistsInSystem(email)`
- `updateDoctorConfiguration(doctorId, secretaryId, secretaryData, currentCount)`
- `getDoctorSecretaryInfo(doctorId)`
- `listDoctorSecretaries(doctorId, includeInactive)`
- `updateSecretaryPermissions(doctorId, secretaryId, newPermissions)`
- `deactivateSecretaryAccount(doctorId, secretaryId)`
- `reactivateSecretaryAccount(doctorId, secretaryId)`
- `getSecretaryDetails(secretaryId, doctorId)`
- `checkIfUserIsSecretary(userId)`
- `validateSecretaryOperation(userId, requiredModule, requiredAction)`
- `generateSecretaryReport(doctorId)`

---

### 4. **patients.service.js** - Patient Management
**Lines**: ~2459-2830 (371 lines)
**Functions**:
- `listPatients(doctorId)`
- `getPatient(doctorId, patientId)`
- `updatePatient(doctorId, patientId, patientData)`
- `deletePatient(doctorId, patientId)`
- `filterPatients(doctorId, filters)`
- `updateFavoriteStatus(doctorId, patientId, isFavorite)`
- `getPatientsByDoctor(doctorId)`
- `getPatientStatusHistory(doctorId, patientId)`
- `addPatientStatusHistory(doctorId, patientId, status, notes)`
- `updatePatientStatus(doctorId, patientId, statusList)`

#### Patient Documents (could be separate or in patients):
- `uploadPatientDocument(file, doctorId, patientId, documentData)`
- `removePatientDocument(doctorId, patientId, documentId)`
- `getPatientDocuments(doctorId, patientId)`

---

### 5. **appointments.service.js** - Consultations & Scheduling
**Lines**: ~2942-3076 (134 lines)
**Functions**:
- `listPatientConsultations(doctorId, patientId, options)`
- `listAllConsultations(doctorId, options)`
- `createConsultation(doctorId, patientId, consultation)`
- `updateConsultation(doctorId, patientId, consultationId, consultation)`

---

### 6. **notes.service.js** - Notes & Anamnesis
**Lines**: ~3084-3824 (740 lines)
**Functions**:

#### Anamnesis:
- `listAnamneses(doctorId, patientId)`
- `createAnamnese(doctorId, patientId, anamnesis)`
- `updateAnamnese(doctorId, patientId, anamneseId, anamnesis)`
- `getAnamnese(doctorId, patientId, anamneseId)`

#### Notes:
- `listNotes(doctorId, patientId)`
- `getNote(doctorId, patientId, noteId)`
- `createNote(doctorId, patientId, noteData)`
- `updateNote(doctorId, patientId, noteId, noteData)`
- `deleteNote(doctorId, patientId, noteId)`

#### Note Attachments:
- `uploadNoteAttachment(file, doctorId, patientId, noteId)`
- `removeNoteAttachment(doctorId, patientId, noteId, attachmentUrl, attachmentIndex)`

---

### 7. **prescriptions.service.js** - Prescriptions & Medications
**Lines**: ~3159-3471 (312 lines)
**Functions**:

#### Prescriptions:
- `createPrescription(doctorId, patientId, prescriptionData)`
- `updatePrescription(doctorId, patientId, prescriptionId, prescriptionData)`
- `deletePrescription(doctorId, patientId, prescriptionId)`
- `getPrescription(doctorId, patientId, prescriptionId)`
- `listPrescriptionsWithDetails(doctorId, limitValue)`
- `filterPrescriptions(doctorId, filters)`

#### Medications:
- `listMedications(doctorId)`
- `createMedication(doctorId, medicationData)`
- `updateMedication(doctorId, medicationId, medicationData)`
- `deleteMedication(doctorId, medicationId)`
- `getMedication(doctorId, medicationId)`

---

### 8. **exams.service.js** - Exams Management
**Lines**: ~3479-3651 (172 lines)
**Functions**:
- `listExams(doctorId, patientId)`
- `getExam(doctorId, patientId, examId)`
- `createExam(doctorId, patientId, examData)`
- `updateExam(doctorId, patientId, examId, examData)`
- `deleteExam(doctorId, patientId, examId)`

#### Exam Attachments:
- `uploadExamAttachment(file, doctorId, patientId, examId)`
- `removeExamAttachment(doctorId, patientId, examId, attachmentUrl, attachmentIndex)`

---

### 9. **storage.service.js** - File Storage
**Lines**: ~3832-3886 (54 lines)
**Functions**:
- `uploadFile(file, path)`
- `deleteFile(fileUrl)`
- `getStorageFileUrl(path)`

---

### 10. **ai.service.js** - AI Conversations
**Lines**: ~3894-4146 (252 lines)
**Functions**:
- `saveConversation(userId, conversationData)`
- `getConversations(userId)`
- `getConversation(userId, conversationId)`
- `updateConversation(userId, conversationId, conversationData)`
- `deleteConversation(userId, conversationId)`
- `searchConversations(userId, searchTerm)`
- `cleanOldConversations(userId, daysOld)`
- `getConversationStats(userId)`

---

### 11. **weather.service.js** - Weather Data
**Lines**: ~4154-4271 (117 lines)
**Functions**:
- `getUserWeatherData(uid)`
- `updateUserWeatherData(uid, weatherData, cityRequested)`

---

## Summary Statistics

| Service | Lines | Functions | Complexity |
|---------|-------|-----------|------------|
| auth.service.js | ~220 | 9 | Medium |
| admin.service.js | ~1,382 | 25+ | **High** |
| secretary.service.js | ~769 | 15 | High |
| patients.service.js | ~371 | 13 | Medium |
| appointments.service.js | ~134 | 4 | Low |
| notes.service.js | ~740 | 11 | Medium |
| prescriptions.service.js | ~312 | 11 | Medium |
| exams.service.js | ~172 | 7 | Low |
| storage.service.js | ~54 | 3 | Low |
| ai.service.js | ~252 | 8 | Medium |
| weather.service.js | ~117 | 2 | Low |
| **TOTAL** | **4,523** | **108** | - |

Note: Total is higher than 4,271 due to shared utilities and imports.

---

## Import Structure

Each service will import:
```javascript
import { firestore, auth, storage } from '../config/firebase.config';
import { formatDateTimeToString, parseStringToDate, formatFileSize } from '../utils/firebase.utils';
```

The old `firebaseService.js` becomes an aggregator:
```javascript
export * from './services/firebase/auth.service';
export * from './services/firebase/admin.service';
// ... etc
```

This maintains backward compatibility while improving organization.
