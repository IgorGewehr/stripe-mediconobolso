import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import {
    collection,
    collectionGroup,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    arrayUnion,
    limit,
    orderBy
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { auth, firestore, storage } from "./firebase.js";

class FirebaseService {
    auth = auth;
    firestore = firestore;
    storage = storage;

    // ====================================================
    // Autenticação e Gerenciamento de Usuários
    // ====================================================
    async login(email, password) {
        try {
            return await signInWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const uid = userCredential.user.uid;
            await setDoc(doc(this.firestore, "users", uid), userData);
            return userCredential;
        } catch (error) {
            console.error("Erro no cadastro:", error);
            throw error;
        }
    }

    async getUserData(uid) {
        try {
            const docRef = doc(this.firestore, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                throw new Error("Usuário não encontrado");
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            throw error;
        }
    }

    async checkUserByCPF(cpf) {
        try {
            const q = query(collection(this.firestore, "users"), where("CPF", "==", cpf));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Erro ao verificar CPF do usuário:", error);
            throw error;
        }
    }

    async editUserData(uid, newData) {
        try {
            const userRef = doc(this.firestore, "users", uid);
            await updateDoc(userRef, newData);
            return true;
        } catch (error) {
            console.error("Erro ao editar os dados do usuário:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Pacientes (subcoleção em "users/{doctorId}/patients")
    // ====================================================
    async listPatients(doctorId) {
        try {
            const patientsCollection = collection(this.firestore, "users", doctorId, "patients");
            const querySnapshot = await getDocs(patientsCollection);
            const patients = [];
            querySnapshot.forEach(docSnap => {
                patients.push({ id: docSnap.id, ...docSnap.data() });
            });
            return patients;
        } catch (error) {
            console.error("Erro ao listar pacientes:", error);
            return [];
        }
    }

    async getPatientsByDoctor(doctorId) {
        // Como os pacientes já estão dentro do documento do médico, basta listar
        return await this.listPatients(doctorId);
    }

    async createPatient(doctorId, patient) {
        try {
            const patientRef = doc(collection(this.firestore, "users", doctorId, "patients"));
            const newPatient = {
                ...patient,
                id: patientRef.id,
                createdAt: new Date(),
                doctorId: doctorId // opcional, para redundância
            };
            await setDoc(patientRef, newPatient);
            return patientRef.id;
        } catch (error) {
            console.error("Erro ao criar paciente:", error);
            throw error;
        }
    }

    async updatePatient(doctorId, patientId, patientData) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const updatedData = {
                ...patientData,
                updatedAt: new Date()
            };
            await updateDoc(patientRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar paciente:", error);
            throw error;
        }
    }

    async deletePatient(doctorId, patientId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId));
            console.log("Paciente deletado com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar paciente:", error);
            throw error;
        }
    }

    async getPatient(doctorId, patientId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar paciente:", error);
            throw error;
        }
    }

    async searchPatients(doctorId, searchTerm) {
        try {
            const patientsCollection = collection(this.firestore, "users", doctorId, "patients");
            const nameQuery = query(
                patientsCollection,
                where("patientName", ">=", searchTerm),
                where("patientName", "<=", searchTerm + '\uf8ff'),
                limit(20)
            );
            const emailQuery = query(
                patientsCollection,
                where("email", ">=", searchTerm),
                where("email", "<=", searchTerm + '\uf8ff'),
                limit(20)
            );

            const [nameResults, emailResults] = await Promise.all([
                getDocs(nameQuery),
                getDocs(emailQuery)
            ]);

            const resultsMap = new Map();
            nameResults.forEach(doc => {
                resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
            emailResults.forEach(doc => {
                resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });

            return Array.from(resultsMap.values());
        } catch (error) {
            console.error("Erro na pesquisa de pacientes:", error);
            return [];
        }
    }

    // ====================================================
    // Operações CRUD para Anamneses (subcoleção em "users/{doctorId}/patients/{patientId}/anamneses")
    // ====================================================
    async listAnamneses(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "anamneses"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const anamneses = [];
            querySnapshot.forEach(docSnap => {
                anamneses.push({ id: docSnap.id, ...docSnap.data() });
            });
            return anamneses;
        } catch (error) {
            console.error("Erro ao listar anamneses:", error);
            return [];
        }
    }

    async createAnamnese(doctorId, patientId, anamnesis) {
        try {
            const anamneseRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "anamneses"));
            const newAnamnese = {
                ...anamnesis,
                id: anamneseRef.id,
                createdAt: new Date()
            };
            await setDoc(anamneseRef, newAnamnese);
            return anamneseRef.id;
        } catch (error) {
            console.error("Erro ao criar anamnese:", error);
            throw error;
        }
    }

    async updateAnamnese(doctorId, patientId, anamneseId, anamnesis) {
        try {
            const anamneseRef = doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId);
            const updatedData = {
                ...anamnesis,
                updatedAt: new Date()
            };
            await updateDoc(anamneseRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar anamnese:", error);
            throw error;
        }
    }

    async deleteAnamnese(doctorId, patientId, anamneseId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId));
            console.log("Anamnese deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar anamnese:", error);
            throw error;
        }
    }

    async getAnamnese(doctorId, patientId, anamneseId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar anamnese:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Consultas (subcoleção em "users/{doctorId}/patients/{patientId}/consultations")
    // ====================================================
    async listConsultations(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "consultations"),
                orderBy("consultationDate", "desc")
            );
            const querySnapshot = await getDocs(q);
            const consultations = [];
            querySnapshot.forEach(docSnap => {
                consultations.push({ id: docSnap.id, ...docSnap.data() });
            });
            return consultations;
        } catch (error) {
            console.error("Erro ao listar consultas:", error);
            return [];
        }
    }

    async listAllConsultations(doctorId, options = {}) {
        try {
            // Acesso direto à subcoleção de consultas do médico
            let q = query(
                collection(this.firestore, "users", doctorId, "consultations"),
                orderBy("consultationDate", options.order || "desc")
            );

            // Se necessário, adicionar filtros por data
            if (options.dateFrom) {
                q = query(q, where("consultationDate", ">=", options.dateFrom));
            }
            if (options.dateTo) {
                q = query(q, where("consultationDate", "<=", options.dateTo));
            }

            const querySnapshot = await getDocs(q);
            const consultations = [];
            querySnapshot.forEach(docSnap => {
                consultations.push({ id: docSnap.id, ...docSnap.data() });
            });
            return consultations;
        } catch (error) {
            console.error("Erro ao listar todas as consultas:", error);
            return [];
        }
    }

    async createConsultation(doctorId, patientId, consultation) {
        try {
            const consultationRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "consultations"));
            const newConsultation = {
                ...consultation,
                id: consultationRef.id,
                createdAt: new Date(),
                doctorId: doctorId
            };
            await setDoc(consultationRef, newConsultation);

            // Atualiza a data da última consulta do paciente
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, {
                lastConsultationDate: consultation.consultationDate
            });

            return consultationRef.id;
        } catch (error) {
            console.error("Erro ao criar consulta:", error);
            throw error;
        }
    }

    async updateConsultation(doctorId, patientId, consultationId, consultation) {
        try {
            const consultationRef = doc(this.firestore, "users", doctorId, "patients", patientId, "consultations", consultationId);
            const updatedData = {
                ...consultation,
                updatedAt: new Date()
            };
            await updateDoc(consultationRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar consulta:", error);
            throw error;
        }
    }

    async deleteConsultation(doctorId, patientId, consultationId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "consultations", consultationId));
            console.log("Consulta deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar consulta:", error);
            throw error;
        }
    }

    async getConsultation(doctorId, patientId, consultationId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "consultations", consultationId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar consulta:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Exames (subcoleção em "users/{doctorId}/patients/{patientId}/exams")
    // ====================================================
    async listExams(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "exams"),
                orderBy("examDate", "desc")
            );
            const querySnapshot = await getDocs(q);
            const exams = [];
            querySnapshot.forEach(docSnap => {
                exams.push({ id: docSnap.id, ...docSnap.data() });
            });
            return exams;
        } catch (error) {
            console.error("Erro ao listar exames:", error);
            return [];
        }
    }

    async createExam(doctorId, patientId, exam, resultFile) {
        try {
            const examRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "exams"));
            let resultFileUrl;

            if (resultFile) {
                resultFileUrl = await this.uploadFile(
                    resultFile,
                    `users/${doctorId}/patients/${patientId}/exams/${examRef.id}/${resultFile.name}`
                );
            }

            const newExam = {
                ...exam,
                id: examRef.id,
                resultFileUrl,
                createdAt: new Date()
            };

            await setDoc(examRef, newExam);
            return examRef.id;
        } catch (error) {
            console.error("Erro ao criar exame:", error);
            throw error;
        }
    }

    async updateExam(doctorId, patientId, examId, exam, newResultFile) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (!examDoc.exists()) {
                throw new Error("Exame não encontrado.");
            }

            let updatedData = {
                ...exam,
                updatedAt: new Date()
            };

            if (newResultFile) {
                const currentData = examDoc.data();
                if (currentData.resultFileUrl) {
                    await this.deleteFile(currentData.resultFileUrl);
                }
                const resultFileUrl = await this.uploadFile(
                    newResultFile,
                    `users/${doctorId}/patients/${patientId}/exams/${examId}/${newResultFile.name}`
                );
                updatedData = {
                    ...updatedData,
                    resultFileUrl
                };
            }

            await updateDoc(examRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar exame:", error);
            throw error;
        }
    }

    async deleteExam(doctorId, patientId, examId) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (examDoc.exists()) {
                const examData = examDoc.data();
                if (examData.resultFileUrl) {
                    await this.deleteFile(examData.resultFileUrl);
                }
            }

            await deleteDoc(examRef);
            console.log("Exame deletado com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar exame:", error);
            throw error;
        }
    }

    async getExam(doctorId, patientId, examId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar exame:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Receitas Médicas (Prescriptions) (subcoleção em "users/{doctorId}/patients/{patientId}/prescriptions")
    // ====================================================
    async listPrescriptions(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "prescriptions"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const prescriptions = [];
            querySnapshot.forEach(docSnap => {
                prescriptions.push({ id: docSnap.id, ...docSnap.data() });
            });
            return prescriptions;
        } catch (error) {
            console.error("Erro ao listar receitas:", error);
            return [];
        }
    }

    async createPrescription(doctorId, patientId, prescription) {
        try {
            const prescriptionRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "prescriptions"));
            const newPrescription = {
                ...prescription,
                id: prescriptionRef.id,
                createdAt: new Date()
            };
            await setDoc(prescriptionRef, newPrescription);
            return prescriptionRef.id;
        } catch (error) {
            console.error("Erro ao criar receita:", error);
            throw error;
        }
    }

    async updatePrescription(doctorId, patientId, prescriptionId, prescription) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);
            const updatedData = {
                ...prescription,
                updatedAt: new Date()
            };
            await updateDoc(prescriptionRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar receita:", error);
            throw error;
        }
    }

    async deletePrescription(doctorId, patientId, prescriptionId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId));
            console.log("Receita deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar receita:", error);
            throw error;
        }
    }

    async getPrescription(doctorId, patientId, prescriptionId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar receita:", error);
            throw error;
        }
    }

    // Lista todas as receitas de um médico (usando collectionGroup)
    async listAllPrescriptions(doctorId) {
        try {
            const q = query(
                collectionGroup(this.firestore, "prescriptions"),
                where("doctorId", "==", doctorId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const prescriptions = [];
            querySnapshot.forEach(docSnap => {
                prescriptions.push({ id: docSnap.id, ...docSnap.data() });
            });
            return prescriptions;
        } catch (error) {
            console.error("Erro ao listar todas as receitas:", error);
            return [];
        }
    }

    // ====================================================
    // Operações CRUD para Agendas (Schedules) (subcoleção em "users/{doctorId}/schedules")
    // ====================================================
    async getDoctorSchedule(doctorId, date) {
        try {
            const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const docSnap = await getDoc(scheduleRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return {
                    id: dateString,
                    doctorId: doctorId,
                    date: dateString,
                    slots: [],
                    createdAt: new Date()
                };
            }
        } catch (error) {
            console.error("Erro ao buscar agenda:", error);
            throw error;
        }
    }

    async updateDoctorSchedule(doctorId, date, scheduleData) {
        try {
            const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const updatedData = {
                ...scheduleData,
                updatedAt: new Date()
            };
            await setDoc(scheduleRef, updatedData, { merge: true });
            return true;
        } catch (error) {
            console.error("Erro ao atualizar agenda:", error);
            throw error;
        }
    }

    async addAppointmentToSchedule(doctorId, date, appointmentData) {
        try {
            const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const appointmentId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            const appointment = {
                ...appointmentData,
                id: appointmentId,
                createdAt: new Date()
            };
            await updateDoc(scheduleRef, {
                slots: arrayUnion(appointment)
            });
            return appointmentId;
        } catch (error) {
            console.error("Erro ao adicionar agendamento:", error);
            throw error;
        }
    }

    async removeAppointmentFromSchedule(doctorId, date, appointmentId) {
        try {
            const dateString = date instanceof Date ? date.toISOString().split('T')[0] : date;
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const docSnap = await getDoc(scheduleRef);
            if (!docSnap.exists()) {
                throw new Error("Agenda não encontrada");
            }
            const scheduleData = docSnap.data();
            const slots = scheduleData.slots || [];
            const updatedSlots = slots.filter(slot => slot.id !== appointmentId);
            await updateDoc(scheduleRef, {
                slots: updatedSlots,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error("Erro ao remover agendamento:", error);
            throw error;
        }
    }

    // ====================================================
    // Funções Auxiliares para Operações com Arquivos (Storage)
    // ====================================================
    async uploadFile(file, path) {
        try {
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Erro ao fazer upload do arquivo:", error);
            throw error;
        }
    }

    async deleteFile(fileUrl) {
        try {
            const fileRef = ref(this.storage, fileUrl);
            await deleteObject(fileRef);
            console.log(`Arquivo deletado: ${fileUrl}`);
            return true;
        } catch (error) {
            console.error("Erro ao deletar arquivo:", error);
            throw error;
        }
    }
}

export default new FirebaseService();
