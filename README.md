# Viral Template Studio — versão gratuita sem FFmpeg

Esta versão exporta diretamente no navegador, sem renderer externo e sem FFmpeg.

## Como usar

1. Instale dependências:

```bash
npm install
```

2. Rode localmente:

```bash
npm run dev
```

3. Publique na Vercel:

```bash
vercel --prod
```

## Limite importante

Esta versão aceita exportação de vídeos até 4 MB. Para vídeos maiores, comprima antes.

Comando exemplo no computador:

```bash
ffmpeg -i video.mp4 -vf scale=720:-2 -c:v libx264 -crf 30 -preset fast -c:a aac -b:a 96k video-leve.mp4
```

## Exportação

A exportação usa Canvas + MediaRecorder no navegador. O ficheiro final inclui:

- vídeo;
- template;
- texto;
- nome/handle;
- logo;
- música, quando o navegador permitir.

Em alguns navegadores o formato final pode ser `.webm` em vez de `.mp4`. Isto é normal quando o browser não suporta gravação MP4 nativa. O conteúdo visual continua completo.
# studio-vercel
