import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    UserCredential
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
}

export default new FirebaseService();