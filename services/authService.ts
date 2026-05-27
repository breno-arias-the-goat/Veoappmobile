import api from '../lib/api';
import { auth } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile as updateFirebaseAuthProfile,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
} from 'firebase/auth';

export const loginUser = async (credentials: any) => {
    // 1. Firebase Auth Primary Login com TIMEOUT de 15s
    let userCredential;
    try {
        userCredential = await Promise.race([
            signInWithEmailAndPassword(
                auth,
                credentials.email,
                credentials.password
            ),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_firebase')), 15000)
            )
        ]);
    } catch (error: any) {
        if (error.message === 'timeout_firebase') {
            throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
        }
        throw error;
    }

    // 2. Comunicar com o backend para gerar sessão com TIMEOUT de 15s
    const idToken = await userCredential.user.getIdToken();
    try {
        const response = await Promise.race([
            api.post('/auth/login', { idToken }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_api')), 15000)
            )
        ]);
        return response.data;
    } catch (error: any) {
        if (error.message === 'timeout_api') {
            throw new Error('Servidor demorou demais para responder. Tente novamente.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao conectar com o servidor.');
    }
};

/**
 * Login com Google usando expo-auth-session.
 * Recebe o accessToken do Google OAuth e troca por um Firebase ID Token.
 * Funciona no Expo Go e em builds nativas.
 */
export const loginWithGoogle = async (googleAccessToken: string) => {
    // 1. Criar credencial Firebase a partir do access_token do Google
    const credential = GoogleAuthProvider.credential(null, googleAccessToken);

    // 2. Fazer login no Firebase com a credencial do Google
    let userCredential;
    try {
        userCredential = await Promise.race([
            signInWithCredential(auth, credential),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_firebase')), 15000)
            )
        ]);
    } catch (error: any) {
        if (error.message === 'timeout_firebase') {
            throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
        }
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('Este email já está cadastrado com outro método de login. Use email e senha.');
        }
        throw new Error('Falha ao autenticar com Google. Tente novamente.');
    }

    // 3. Obter Firebase ID Token e enviar para o backend
    const idToken = await userCredential.user.getIdToken();
    try {
        const response = await Promise.race([
            api.post('/auth/login', { idToken }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_api')), 15000)
            )
        ]);
        return response.data;
    } catch (error: any) {
        if (error.message === 'timeout_api') {
            throw new Error('Servidor demorou demais para responder. Tente novamente.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao conectar com o servidor.');
    }
};

export const signupUser = async (userData: any) => {
    const nameParts = (userData.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Doe';

    let userCredential;
    try {
        // 1. O Firebase é a única ferramenta de criação de contas com TIMEOUT de 15s
        userCredential = await Promise.race([
            createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            ),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_firebase')), 15000)
            )
        ]);
    } catch (error: any) {
        if (error.message === 'timeout_firebase') {
            throw new Error("Tempo de conexão esgotado. Verifique sua internet.");
        }
        if (error.code === 'auth/configuration-not-found') {
            throw new Error("Erro Crítico: A Autenticação por E-mail/Senha está desativada no seu projeto Firebase Console. Por favor, ative-a na aba Authentication -> Sign-in method.");
        }
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("Este e-mail já está em uso no Firebase. Tente fazer login.");
        }
        throw error;
    }

    // Salvar o display name no Firebase Auth
    await updateFirebaseAuthProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`.trim()
    });

    // 2. Informar o backend para criar o perfil local no DB também usando o ID Token com TIMEOUT de 15s
    const idToken = await userCredential.user.getIdToken();
    const payload = {
        idToken,
        firstName,
        lastName
    };

    try {
        const response = await Promise.race([
            api.post('/auth/signup', payload),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_api')), 15000)
            )
        ]);
        return response.data;
    } catch (error: any) {
        if (error.message === 'timeout_api') {
            throw new Error('Servidor demorou demais para responder. O registro não pôde ser completado.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao conectar com o servidor para registro.');
    }
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data?.data ?? null;
};

export const updateProfile = async (data: { firstName?: string; lastName?: string; profilePictureUrl?: string | null }) => {
    const response = await api.patch('/auth/me', data);
    return response.data?.data ?? null;
};

/**
 * Login com Apple usando expo-apple-authentication.
 * Recebe o identityToken da Apple e faz login no Firebase via OAuthProvider.
 */
export const loginWithApple = async (identityToken: string, nonce: string) => {
    // 1. Cria credencial Firebase com o token da Apple
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });

    // 2. Faz login no Firebase
    let userCredential;
    try {
        userCredential = await Promise.race([
            signInWithCredential(auth, credential),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_firebase')), 15000)
            )
        ]);
    } catch (error: any) {
        if (error.message === 'timeout_firebase') {
            throw new Error('Tempo de conexão esgotado. Verifique sua internet.');
        }
        throw new Error('Falha ao autenticar com Apple. Tente novamente.');
    }

    // 3. Obtém Firebase ID Token e envia para o backend
    const idToken = await userCredential.user.getIdToken();
    try {
        const response = await Promise.race([
            api.post('/auth/login', { idToken }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout_api')), 15000)
            )
        ]);
        return response.data;
    } catch (error: any) {
        if (error.message === 'timeout_api') {
            throw new Error('Servidor demorou demais para responder. Tente novamente.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao conectar com o servidor.');
    }
};
