import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
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
import moment from 'moment-timezone';

class FirebaseService {
    auth = auth;
    firestore = firestore;
    storage = storage;

    // ====================================================
    // Funções auxiliares para manipulação de datas - SIMPLIFICADAS
    // ====================================================

    // Converte qualquer tipo de data para string YYYY-MM-DD
    _formatDateTimeToString(dateValue) {
        // Se for null ou undefined, retorna null
        if (!dateValue) return null;

        // Forçar uso do dia local sem conversão de fuso
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Converte string YYYY-MM-DD para objeto Date
    _parseStringToDate(stringValue) {
        // Se for null ou undefined
        if (!stringValue) return new Date();

        // Se já for um Date
        if (stringValue instanceof Date) return stringValue;

        // Se for um Timestamp do Firebase
        if (stringValue && typeof stringValue.toDate === 'function') {
            return stringValue.toDate();
        }

        // Se for string, converter para Date preservando dia exato
        if (typeof stringValue === 'string') {
            const parts = stringValue.split('-');
            if (parts.length === 3) {
                // Criar data com dia exato preservado
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            // Fallback apenas se a string não estiver no formato esperado
            return new Date(stringValue);
        }

        // Fallback para qualquer outro caso
        return new Date(stringValue);
    }

    // Processa um documento de consulta
    _processConsultationDates(consultation) {
        if (!consultation) return consultation;

        const processed = {...consultation};

        // Converter consultationDate de string para Date
        if (processed.consultationDate) {
            processed.consultationDate = this._parseStringToDate(processed.consultationDate);
        }

        return processed;
    }

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

    async sendPasswordResetEmail(email) {
        try {
            await firebaseSendPasswordResetEmail(this.auth, email);
            return true;
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error);
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

    // marcar ou desmarc paciente como favorito
    async updateFavoriteStatus(doctorId, patientId, isFavorite) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, { favorite: isFavorite, updatedAt: new Date() });
            return true;
        } catch (error) {
            console.error("Erro ao atualizar status favorito:", error);
            throw error;
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
    async listPatientConsultations(doctorId, patientId, options = {}) {
        try {
            // Cria a referência para a subcoleção do paciente
            const consultationsRef = collection(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "consultations"
            );

            // Cria a query, ordenando pelo campo consultationDate
            let q = query(
                consultationsRef,
                orderBy("consultationDate", options.order || "desc")
            );

            // Executa a consulta
            const querySnapshot = await getDocs(q);
            const consultations = [];

            querySnapshot.forEach(docSnap => {
                // Processamos o documento para converter strings para Date
                const consultation = this._processConsultationDates({
                    id: docSnap.id,
                    ...docSnap.data()
                });
                consultations.push(consultation);
            });

            return consultations;
        } catch (error) {
            console.error("Erro ao listar as consultas do paciente:", error);
            return [];
        }
    }

    async listAllConsultations(doctorId, options = {}) {
        try {
            // Consulta de collection group para todas as subcoleções "consultations"
            let q = query(
                collectionGroup(this.firestore, "consultations"),
                where("doctorId", "==", doctorId)
            );

            // Adicionar ordenação após filtros
            q = query(q, orderBy("consultationDate", options.order || "desc"));

            // Executa a consulta
            const querySnapshot = await getDocs(q);
            const consultations = [];

            querySnapshot.forEach(docSnap => {
                // Processamos o documento para converter strings para Date
                const consultation = this._processConsultationDates({
                    id: docSnap.id,
                    ...docSnap.data()
                });
                consultations.push(consultation);
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

            // Garantir que a data já venha como string YYYY-MM-DD
            let consultationDateStr = consultation.consultationDate;

            // Se não for string, converter garantindo que mantém o dia local
            if (typeof consultationDateStr !== 'string') {
                consultationDateStr = this._formatDateTimeToString(consultation.consultationDate);
            }

            const dataToSave = {
                ...consultation,
                id: consultationRef.id,
                createdAt: new Date(),
                doctorId: doctorId,
                // Usar a string já formatada, sem permitir conversões
                consultationDate: consultationDateStr
            };

            await setDoc(consultationRef, dataToSave);

            // Atualiza a data da última consulta do paciente
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, {
                lastConsultationDate: dataToSave.consultationDate
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

            // Formatar a data como string YYYY-MM-DD antes de salvar
            const dataToSave = {
                ...consultation,
                updatedAt: new Date(),
                // Garantir que a data está no formato correto
                consultationDate: this._formatDateTimeToString(consultation.consultationDate)
            };

            await updateDoc(consultationRef, dataToSave);
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

            if (!docSnap.exists()) return null;

            // Processamos o documento para converter strings para Date
            const consultation = this._processConsultationDates(docSnap.data());
            return consultation;
        } catch (error) {
            console.error("Erro ao buscar consulta:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Notas (subcoleção em "users/{doctorId}/patients/{patientId}/notes")
    // ====================================================
    async listNotes(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "notes"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const notes = [];
            querySnapshot.forEach(docSnap => {
                notes.push({ id: docSnap.id, ...docSnap.data() });
            });
            return notes;
        } catch (error) {
            console.error("Erro ao listar notas:", error);
            return [];
        }
    }

    async getNote(doctorId, patientId, noteId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar nota:", error);
            throw error;
        }
    }

    async createNote(doctorId, patientId, noteData) {
        try {
            const noteRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "notes"));
            const newNote = {
                ...noteData,
                id: noteRef.id,
                patientId: patientId,
                doctorId: doctorId,
                createdAt: new Date(),
                lastModified: new Date()
            };
            await setDoc(noteRef, newNote);
            return noteRef.id;
        } catch (error) {
            console.error("Erro ao criar nota:", error);
            throw error;
        }
    }

    async updateNote(doctorId, patientId, noteId, noteData) {
        try {
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            const updatedData = {
                ...noteData,
                lastModified: new Date()
            };
            await updateDoc(noteRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar nota:", error);
            throw error;
        }
    }

    async deleteNote(doctorId, patientId, noteId) {
        try {
            // Primeiro vamos buscar a nota para obter os anexos
            const noteDoc = await this.getNote(doctorId, patientId, noteId);

            // Se há anexos, precisamos deletá-los do storage
            if (noteDoc && noteDoc.attachments && noteDoc.attachments.length > 0) {
                for (const attachment of noteDoc.attachments) {
                    if (attachment.fileUrl) {
                        try {
                            await this.deleteFile(attachment.fileUrl);
                        } catch (err) {
                            console.warn(`Erro ao deletar arquivo ${attachment.fileName}:`, err);
                            // Continua com a deleção mesmo se falhar em deletar um arquivo
                        }
                    }
                }
            }

            // Agora deletamos o documento da nota
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId));
            console.log("Nota deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar nota:", error);
            throw error;
        }
    }

    // ====================================================
    // Funções para manipulação de arquivos das notas
    // ====================================================
    async uploadNoteAttachment(file, doctorId, patientId, noteId) {
        try {
            // Caminho para o arquivo no storage
            const path = `users/${doctorId}/patients/${patientId}/notes/${noteId}/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

            // Formato para retornar informações sobre o arquivo
            const fileInfo = {
                fileName: file.name,
                fileType: file.type,
                fileSize: this.formatFileSize(file.size),
                fileUrl: fileUrl,
                uploadedAt: new Date()
            };

            // Atualize o documento da nota para incluir o novo anexo
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            await updateDoc(noteRef, {
                attachments: arrayUnion(fileInfo),
                lastModified: new Date()
            });

            return fileInfo;
        } catch (error) {
            console.error("Erro ao fazer upload de anexo:", error);
            throw error;
        }
    }

    async removeNoteAttachment(doctorId, patientId, noteId, attachmentUrl, attachmentIndex) {
        try {
            // Buscamos primeiro a nota para obter a lista atual de anexos
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            const noteDoc = await getDoc(noteRef);

            if (!noteDoc.exists()) {
                throw new Error("Nota não encontrada");
            }

            const noteData = noteDoc.data();
            const attachments = [...(noteData.attachments || [])];

            // Verificamos se o índice é válido
            if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                throw new Error("Índice de anexo inválido");
            }

            // Deletamos o arquivo do storage
            await this.deleteFile(attachmentUrl);

            // Removemos o anexo da lista
            attachments.splice(attachmentIndex, 1);

            // Atualizamos o documento da nota com a nova lista de anexos
            await updateDoc(noteRef, {
                attachments: attachments,
                lastModified: new Date()
            });

            return true;
        } catch (error) {
            console.error("Erro ao remover anexo da nota:", error);
            throw error;
        }
    }

    // Função auxiliar para formatar o tamanho do arquivo
    formatFileSize(sizeInBytes) {
        if (sizeInBytes < 1024) {
            return sizeInBytes + ' bytes';
        } else if (sizeInBytes < 1024 * 1024) {
            return (sizeInBytes / 1024).toFixed(1) + 'KB';
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
        } else {
            return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
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
    // Operações CRUD para Medicamentos (coleção em "users/{doctorId}/medications")
    // ====================================================
    async listMedications(doctorId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "medications"),
                orderBy("name", "asc")
            );
            const querySnapshot = await getDocs(q);
            const medications = [];
            querySnapshot.forEach(docSnap => {
                medications.push({ id: docSnap.id, ...docSnap.data() });
            });
            return medications;
        } catch (error) {
            console.error("Erro ao listar medicamentos:", error);
            return [];
        }
    }

    async createMedication(doctorId, medicationData) {
        try {
            // Verificar se já existe um medicamento com o mesmo nome
            const q = query(
                collection(this.firestore, "users", doctorId, "medications"),
                where("name", "==", medicationData.name)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error("Já existe um medicamento com este nome.");
            }

            const medicationRef = doc(collection(this.firestore, "users", doctorId, "medications"));
            const newMedication = {
                ...medicationData,
                id: medicationRef.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setDoc(medicationRef, newMedication);
            return medicationRef.id;
        } catch (error) {
            console.error("Erro ao criar medicamento:", error);
            throw error;
        }
    }

    async updateMedication(doctorId, medicationId, medicationData) {
        try {
            // Verificar se já existe outro medicamento com o mesmo nome
            if (medicationData.name) {
                const q = query(
                    collection(this.firestore, "users", doctorId, "medications"),
                    where("name", "==", medicationData.name)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    if (existingDoc.id !== medicationId) {
                        throw new Error("Já existe outro medicamento com este nome.");
                    }
                }
            }

            const medicationRef = doc(this.firestore, "users", doctorId, "medications", medicationId);
            const updatedData = {
                ...medicationData,
                updatedAt: new Date()
            };
            await updateDoc(medicationRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar medicamento:", error);
            throw error;
        }
    }

    async deleteMedication(doctorId, medicationId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "medications", medicationId));
            return true;
        } catch (error) {
            console.error("Erro ao deletar medicamento:", error);
            throw error;
        }
    }

    async getMedication(doctorId, medicationId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "medications", medicationId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar medicamento:", error);
            throw error;
        }
    }

    // Função para buscar receitas com mais detalhes
    async listPrescriptionsWithDetails(doctorId, limitValue = 50) {
        try {
            const q = query(
                collectionGroup(this.firestore, "prescriptions"),
                where("doctorId", "==", doctorId),
                orderBy("createdAt", "desc"),
                limit(limitValue)
            );

            const querySnapshot = await getDocs(q);
            const prescriptions = [];

            for (const docSnap of querySnapshot.docs) {
                const prescription = { id: docSnap.id, ...docSnap.data() };

                // Obter o caminho completo do documento para extrair o patientId
                const path = docSnap.ref.path;
                const pathSegments = path.split('/');
                const patientId = pathSegments[3]; // Assumindo o caminho: users/{doctorId}/patients/{patientId}/prescriptions/{prescriptionId}

                // Buscar dados do paciente
                try {
                    const patientData = await this.getPatient(doctorId, patientId);
                    if (patientData) {
                        prescription.patientData = {
                            id: patientId,
                            name: patientData.nome || patientData.patientName,
                            phone: patientData.telefone || patientData.phone,
                            email: patientData.email,
                            birthDate: patientData.dataNascimento || patientData.birthDate
                        };
                    }
                } catch (err) {
                    console.warn(`Não foi possível obter dados do paciente ${patientId}:`, err);
                    prescription.patientData = { id: patientId, name: "Paciente não encontrado" };
                }

                prescriptions.push(prescription);
            }

            return prescriptions;
        } catch (error) {
            console.error("Erro ao listar receitas com detalhes:", error);
            return [];
        }
    }

    async getPrescription(doctorId, patientId, prescriptionId) {
        try {
            const prescriptionRef = doc(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "prescriptions",
                prescriptionId
            );
            const docSnap = await getDoc(prescriptionRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar receita:", error);
            throw error;
        }
    }

    async searchMedications(doctorId, searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                return this.listMedications(doctorId);
            }

            // Versão corrigida sem usar limit diretamente na query
            const nameQueryStart = query(
                collection(this.firestore, "users", doctorId, "medications"),
                where("name", ">=", searchTerm),
                where("name", "<=", searchTerm + '\uf8ff'),
                orderBy("name")
            );

            const querySnapshot = await getDocs(nameQueryStart);
            const medications = [];

            // Limita os resultados manualmente
            let count = 0;
            querySnapshot.forEach(doc => {
                if (count < 20) { // Limite máximo de 20 resultados
                    medications.push({ id: doc.id, ...doc.data() });
                    count++;
                }
            });

            return medications;
        } catch (error) {
            console.error("Erro ao pesquisar medicamentos:", error);
            return [];
        }
    }

    // Método para filtrar receitas
    async filterPrescriptions(doctorId, filters) {
        try {
            let q = query(
                collectionGroup(this.firestore, "prescriptions"),
                where("doctorId", "==", doctorId)
            );

            // Adicionar filtros
            if (filters.status && filters.status !== 'all') {
                q = query(q, where("status", "==", filters.status));
            }

            if (filters.dateFrom) {
                const dateFromString = this._formatDateTimeToString(filters.dateFrom);
                q = query(q, where("createdAt", ">=", dateFromString));
            }

            if (filters.dateTo) {
                // Ajusta para o final do dia
                const dateToString = this._formatDateTimeToString(filters.dateTo);
                q = query(q, where("createdAt", "<=", dateToString));
            }

            // Ordenação
            q = query(q, orderBy("createdAt", filters.order || "desc"));

            // Executa a consulta
            const querySnapshot = await getDocs(q);
            const prescriptions = [];

            const maxResults = filters.limit || Number.MAX_SAFE_INTEGER;
            let resultCount = 0;

            for (const docSnap of querySnapshot.docs) {
                if (resultCount >= maxResults) break;

                // Processamos o documento para converter strings para Date
                const prescription = this._processConsultationDates({
                    id: docSnap.id,
                    ...docSnap.data()
                });

                prescriptions.push(prescription);
                resultCount++;
            }

            return prescriptions;
        } catch (error) {
            console.error("Erro ao filtrar receitas:", error);
            return [];
        }
    }

    // ====================================================
    // Operações CRUD para Agendas (Schedules) (subcoleção em "users/{doctorId}/schedules")
    // ====================================================
    async getDoctorSchedule(doctorId, date) {
        try {
            const dateString = this._formatDateTimeToString(date);
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
            const dateString = this._formatDateTimeToString(date);
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
            const dateString = this._formatDateTimeToString(date);
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
            const dateString = this._formatDateTimeToString(date);
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