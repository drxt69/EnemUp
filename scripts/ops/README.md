# Operacao local do ENEM UP

Estes scripts reduzem quedas quando o ENEM UP esta hospedado no computador local com Cloudflare Tunnel.

## Instalar monitoramento automatico

Abra o PowerShell como administrador e rode:

```powershell
cd "C:\Users\Ruan\Documents\Projeto Enem"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\ops\register-windows-tasks.ps1"
```

Isso cria duas tarefas no Windows:

- `ENEM UP - iniciar servidor`: inicia o servidor quando o usuario entra no Windows.
- `ENEM UP - monitor de disponibilidade`: verifica o app e o dominio a cada 5 minutos.

## O que o monitor faz

- Verifica `http://127.0.0.1:3000/api/health`.
- Inicia o ENEM UP se a porta 3000 estiver fora.
- Verifica `https://enemup.com`.
- Reinicia o servico `Cloudflared` se o dominio falhar.

## Logs

Os logs ficam em:

```text
C:\Users\Ruan\Documents\Projeto Enem\logs
```

## Importante

Hospedagem local ainda depende do computador ligado, sem suspensao, com internet ativa e com o Cloudflare Tunnel saudável. Para disponibilidade profissional, use uma VPS ou hospedagem cloud.
