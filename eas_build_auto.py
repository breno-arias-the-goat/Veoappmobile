#!/usr/bin/env python3
"""
Autonomous EAS Build Runner
Executa o build EAS iOS respondendo automaticamente todos os prompts interativos.
"""

import os
import sys
import pty
import time
import select
import subprocess
import re
import termios
import tty

APPLE_ID = "breno440644@icloud.com"
APPLE_PASS = "08947610Br@"

os.chdir("/Users/silvia/Downloads/Veoappmobile")

def run_interactive():
    """Roda o EAS build com PTY para simular um terminal interativo."""
    
    master_fd, slave_fd = pty.openpty()
    
    process = subprocess.Popen(
        ["npx", "eas-cli", "build", "--platform", "ios", "--profile", "preview"],
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        close_fds=True,
        env=os.environ.copy()
    )
    
    os.close(slave_fd)
    
    buffer = ""
    tfa_needed = False
    
    print("🚀 EAS Build iniciado...\n", flush=True)
    
    while True:
        if process.poll() is not None:
            # Processo terminou
            try:
                remaining = os.read(master_fd, 4096).decode("utf-8", errors="replace")
                buffer += remaining
                print(remaining, end="", flush=True)
            except OSError:
                pass
            break
        
        try:
            ready, _, _ = select.select([master_fd], [], [], 0.5)
        except (select.error, ValueError):
            break
            
        if not ready:
            continue
            
        try:
            data = os.read(master_fd, 4096).decode("utf-8", errors="replace")
        except OSError:
            break
            
        buffer += data
        print(data, end="", flush=True)
        
        # Analisa o buffer para responder prompts
        
        # Apple Account login prompt
        if "Do you want to log in to your Apple account" in buffer and "?" in buffer:
            time.sleep(0.5)
            os.write(master_fd, b"Y\n")
            buffer = ""
            print("\n[AUTO] → Y (login Apple)", flush=True)
        
        # Apple ID input
        elif re.search(r"Apple ID:\s*$", buffer.strip()):
            time.sleep(0.5)
            os.write(master_fd, f"{APPLE_ID}\n".encode())
            buffer = ""
            print(f"\n[AUTO] → {APPLE_ID}", flush=True)
        
        # Password input
        elif re.search(r"Password:\s*$", buffer.strip()) or "password" in buffer.lower()[-100:] and buffer.strip().endswith(":"):
            time.sleep(0.5)
            os.write(master_fd, f"{APPLE_PASS}\n".encode())
            buffer = ""
            print("\n[AUTO] → [senha enviada]", flush=True)
        
        # 2FA code needed
        elif any(x in buffer for x in ["Two-factor", "Enter the code", "verification code", "6-digit"]):
            tfa_needed = True
            print("\n\n" + "="*50, flush=True)
            print("⚠️  AÇÃO NECESSÁRIA: Código 2FA", flush=True)
            print("Digite o código de 6 dígitos do seu iPhone:", flush=True)
            print("="*50, flush=True)
            code = input("Código 2FA: ").strip()
            os.write(master_fd, f"{code}\n".encode())
            buffer = ""
        
        # Try again prompt (wrong credentials)
        elif "Would you like to try again" in buffer:
            print("\n❌ Credenciais inválidas. Abortando...", flush=True)
            os.write(master_fd, b"no\n")
            break
        
        # Certificate generation prompts - always accept default (Enter)
        elif any(x in buffer for x in [
            "Generate a new",
            "Which distribution certificate",
            "Which provisioning profile", 
            "Select team",
        ]) and buffer.strip().endswith(("?", ":")):
            time.sleep(0.5)
            os.write(master_fd, b"\n")
            buffer = ""
            print("\n[AUTO] → Enter (aceitar padrão)", flush=True)
        
        # Generic [Y/n] or [y/N] prompts
        elif re.search(r"\[Y/n\]\s*$", buffer.strip()):
            time.sleep(0.3)
            os.write(master_fd, b"Y\n")
            buffer = ""
            print("\n[AUTO] → Y", flush=True)
            
        elif re.search(r"\[y/N\]\s*$", buffer.strip()):
            time.sleep(0.3)
            os.write(master_fd, b"y\n")
            buffer = ""
            print("\n[AUTO] → y", flush=True)
    
    os.close(master_fd)
    
    exit_code = process.wait()
    
    print("\n" + "="*50, flush=True)
    if exit_code == 0:
        print("✅ BUILD SUBMETIDO COM SUCESSO!", flush=True)
        print("📱 Verifique o link de instalação em:", flush=True)
        print("   https://expo.dev/accounts/brenododrop/projects", flush=True)
    else:
        print(f"❌ Build terminou com código de saída: {exit_code}", flush=True)
    print("="*50, flush=True)
    
    return exit_code

if __name__ == "__main__":
    sys.exit(run_interactive())
