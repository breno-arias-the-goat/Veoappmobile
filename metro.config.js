const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Garante que o Metro fará o bundle correto de fontes (ttf) e imagens (png, jpg, etc)
// Essencial para o build de produção na web (Vercel) e ativos nativos
const assetExts = ['ttf', 'png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];

assetExts.forEach((ext) => {
    if (!config.resolver.assetExts.includes(ext)) {
        config.resolver.assetExts.push(ext);
    }
});

// Limpo

module.exports = config;
