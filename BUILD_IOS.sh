#!/bin/bash
# ============================================================
# VEO APP — Build iOS Automático
# Execute este script no Terminal do seu Mac
# ============================================================

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   VEO APP — iOS Build Automático     ║"
echo "╚══════════════════════════════════════╝"
echo ""

cd /Users/silvia/Downloads/Veoappmobile || { echo "❌ Pasta não encontrada"; exit 1; }

echo "✅ Projeto encontrado"
echo "✅ Logado como: brenododrop (Expo)"
echo ""
echo "📦 Iniciando build iOS Preview..."
echo "   (Você vai precisar entrar com suas credenciais Apple)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Quando perguntar:"
echo "  • 'Do you want to log in?' → Y + Enter"
echo "  • 'Apple ID:'              → breno440644@icloud.com + Enter"  
echo "  • 'Password:'              → sua senha + Enter"
echo "  • '2FA code:'              → código do iPhone + Enter"
echo "  • Qualquer outra pergunta  → Enter (aceitar padrão)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Pressione Enter para iniciar..."
read

npx eas-cli build --platform ios --profile preview

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verifique o link de instalação em:"
echo "   https://expo.dev/accounts/brenododrop/projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
