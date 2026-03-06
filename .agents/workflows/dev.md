---
description: como rodar o Veoappmobile em desenvolvimento local
---

# VEO App Mobile — Workflow de Desenvolvimento

## Pré-requisitos
- Node.js >= 18
- npm
- Expo CLI (`npm install -g expo-cli` ou usar `npx expo`)
- Android Studio (para emulador Android) ou Xcode (para iOS)
- Arquivo `.env` configurado

## 1. Instalar dependências
```bash
npm install
```

## 2. Configurar variáveis de ambiente
Edite o arquivo `.env` com:
- URL do backend (`API_URL`)
- Chave pública do Stripe
- Outras configs Firebase/Auth

## 3. Rodar no Expo (QR Code / Emulador)
```bash
npx expo start
```
Use o app **Expo Go** no celular para escanear o QR, ou pressione:
- `a` → abre no emulador Android
- `i` → abre no simulador iOS
- `w` → abre no navegador (web)

## 4. Rodar no Android (build nativo)
```bash
npm run android
```

## 5. Rodar no iOS
```bash
npm run ios
```

## 6. Rodar na Web
```bash
npm run web
```

## Estrutura Principal
```
app/             # Telas (Expo Router — file-based routing)
components/      # Componentes reutilizáveis
services/        # Chamadas de API e serviços
contexts/        # Contextos React (auth, etc.)
hooks/           # Custom hooks
constants/       # Constantes globais
i18n/            # Internacionalização (i18next)
lib/             # Utilitários
assets/          # Imagens, fontes, etc.
```

## Tecnologias principais
- **Expo Router** — navegação baseada em arquivos
- **NativeWind / Tailwind** — estilização
- **React Query** — gerenciamento de estado assíncrono
- **Stripe React Native** — pagamentos
- **Vision Camera** — câmera nativa
- **i18next** — multi-idioma
