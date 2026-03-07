import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Extraindo das credenciais fornecidas no admin SDK.
const firebaseConfig = {
    apiKey: "AIzaSyCJii5rYUqyKt2kxN82WItlwURc6mK7vTw",
    authDomain: "veotextos.firebaseapp.com",
    projectId: "veotextos",
    storageBucket: "veotextos.firebasestorage.app",
    messagingSenderId: "133042398286",
    appId: "1:133042398286:web:f3cfa5eacf8c94129d4f1f",
};

// Singleton pattern param inicialização correta no React Native Hot-Reload
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Inicializando o Auth Engine. O Expo lida com a persistência assíncrona default.
const auth = getAuth(app);

export { auth, app };
