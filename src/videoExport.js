import JSZip from "jszip";

const BROWSER_EXPORT_LIMIT_BYTES = 4 * 1024 * 1024;
const MIN_VALID_VIDEO_BYTES = 100 * 1024;

export const formatPresets = {
  portrait: {
    id: "portrait",
    label: "Retrato 9:16",
    use: "TikTok, Reels, Shorts",
    width: 1080,
    height: 1920,
    safeArea: { top: 180, right: 90, bottom: 250, left: 90 }
  },
  square: {
    id: "square",
    label: "Quadrado 1:1",
    use: "Instagram Feed",
    width: 1080,
    height: 1080,
    safeArea: { top: 120, right: 80, bottom: 140, left: 80 }
  },
  landscape: {
    id: "landscape",
    label: "Paisagem 16:9",
    use: "YouTube",
    width: 1920,
    height: 1080,
    safeArea: { top: 90, right: 140, bottom: 110, left: 140 }
  }
};

export const platformPresets = {
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    presetName: "TikTok 9:16",
    format: "portrait"
  },
  instagramReels: {
    id: "instagramReels",
    label: "Instagram Reels",
    presetName: "Reels 9:16",
    format: "portrait"
  },
  youtubeShorts: {
    id: "youtubeShorts",
    label: "YouTube Shorts",
    presetName: "Shorts 9:16",
    format: "portrait"
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    presetName: "YouTube 16:9",
    format: "landscape"
  },
  instagramFeed: {
    id: "instagramFeed",
    label: "Instagram Feed",
    presetName: "Feed 1:1",
    format: "square"
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO PRINCIPAL — renderização 100% client-side via Canvas + MediaRecorder
// Arquitectura: Preview = Render. O mesmo drawScene usado na preview é usado
// para compor cada frame do vídeo exportado.
// ─────────────────────────────────────────────────────────────────────────────
export async function exportEditedVideo({
  data,
  format,
  logoFile,
  musicFile,
  overlayFile,
  onLog = () => {},
  onProgress,
  platform,
  videoFile
}) {
  const logs = [];
  const log = (level, message, extra = {}) => {
    const entry = { at: new Date().toISOString(), level, message, ...extra };
    logs.push(entry);
    onLog(entry);
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      "[Export]", message, extra
    );
  };

  let diagnostics;

  try {
    onProgress({ label: "A validar ficheiro…", value: 4 });
    log("info", "Validação iniciada.");
    diagnostics = await validateExportInput({ data, format, logoFile, musicFile, overlayFile, platform, videoFile });
    log("info", "Validação concluída.", diagnostics);
  } catch (err) {
    log("error", getErrorMessage(err), { stack: err?.stack });
    throw attachDetails(err, { diagnostics: diagnostics || buildBasicDiagnostics({ format, platform, videoFile }), logs, method: "validation" });
  }


  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    const err = new Error("Este navegador não suporta exportação local de vídeo. Usa Chrome/Edge atualizado.");
    throw attachDetails(err, { diagnostics, logs, method: "Canvas local sem FFmpeg" });
  }

  try {
    onProgress({ label: "A preparar assets…", value: 10 });
    log("info", "A carregar assets (vídeo, logo, música)…");

    // Carregar todos os assets antes de iniciar a gravação
    const video = await loadVideo(videoFile);
    log("info", "Vídeo carregado.", { duration: video.duration, w: video.videoWidth, h: video.videoHeight });

    const logo = logoFile
      ? await loadImageFromFile(logoFile)
      : data.defaultLogoUrl
        ? await loadImageFromUrl(data.defaultLogoUrl)
        : null;
    log("info", logo ? "Logo carregado." : "Sem logo.");

    const renderFormat = getBrowserRenderFormat(format);
    log("info", "Formato de exportação local selecionado.", { width: renderFormat.width, height: renderFormat.height });

    onProgress({ label: "A configurar canvas…", value: 18 });

    // Canvas de composição. Resolução otimizada para telemóvel para evitar crash.
    const canvas = document.createElement("canvas");
    canvas.width = renderFormat.width;
    canvas.height = renderFormat.height;
    const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
    log("info", "Canvas criado.", { width: canvas.width, height: canvas.height });

    // ── Modo sincronizado ────────────────────────────────────────────────────
    // O vídeo toca em tempo real e o canvas desenha o frame atual. Assim o
    // tempo gravado pelo MediaRecorder fica alinhado com o áudio.
    video.muted = true;
    log("info", "Modo sincronizado ativo: playback real do vídeo + áudio do ficheiro original.");

    // ── Configurar stream de vídeo ────────────────────────────────────────────
    // 24 FPS mantém fluidez sem pesar demais no telemóvel.
    const FPS = 24;
    const videoStream = canvas.captureStream(FPS);
    const videoTrack = videoStream.getVideoTracks()[0];
    const audioGraph = await createExportAudioGraph({ duration: video.duration, log, musicFile, videoFile });
    const audioTracks = audioGraph?.stream.getAudioTracks() || [];
    const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioTracks]);

    log("info", "Stream leve criado.", {
      videoTracks: videoStream.getVideoTracks().length,
      audioTracks: audioTracks.length,
      fps: FPS
    });

    // Escolher codec suportado (preferir WebM no telemóvel por estabilidade)
    const mimeType = getSupportedMimeType();
    log("info", "Codec selecionado.", { mimeType });

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 900_000,
      ...(audioTracks.length ? { audioBitsPerSecond: 128_000 } : {})
    });

    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    // ── Loop de renderização sincronizado com playback ───────────────────────
    onProgress({ label: "A iniciar gravação…", value: 24 });

    const duration = video.duration;

    await seekVideo(video, 0);
    video.pause();
    drawScene(ctx, { data, format: renderFormat, logo, platform, video });
    await startRecorder(recorder);
    await video.play();
    await audioGraph?.start();
    log("info", "MediaRecorder iniciado. Playback sincronizado iniciado.", { audioTracks: audioTracks.length, duration });

    const frameCount = await renderVideoInRealtime({
      ctx,
      data,
      duration,
      format: renderFormat,
      logo,
      onProgress,
      platform,
      video
    });

    if (recorder.state === "recording") recorder.requestData();
    await wait(250);
    await stopRecorder(recorder);
    audioGraph?.stop();
    video.pause();
    videoTrack?.stop?.();
    audioTracks.forEach((track) => track.stop());

    onProgress({ label: "A finalizar ficheiro…", value: 96 });
    log("info", "Gravação concluída.", { chunks: chunks.length, frames: frameCount });

    // Montar blob final
    const rawBlob = new Blob(chunks, { type: mimeType });
    log("info", "Blob criado.", { size: rawBlob.size, mimeType });

    // Sem FFmpeg: o navegador entrega MP4 quando suportado; caso contrário entrega WebM.
    // Em ambos os casos o ficheiro contém canvas completo: template + texto + logo + vídeo.
    const finalBlob = rawBlob;
    const finalExtension = mimeType.includes("mp4") ? "mp4" : "webm";
    const finalFilename = getExportFilename(data, platform, finalExtension);
    validateVideoBlob(finalBlob, finalExtension);
    const download = downloadBlob(finalBlob, finalFilename);

    onProgress({ label: "Download pronto! ✓", value: 100 });
    log("info", "Exportação concluída com sucesso.", { size: finalBlob.size, extension: finalExtension });

    // Limpeza
    URL.revokeObjectURL(video.src);

    return {
      diagnostics: { ...diagnostics, method: "Canvas local sem FFmpeg", outputWidth: renderFormat.width, outputHeight: renderFormat.height },
      downloadUrl: download.url,
      filename: finalFilename,
      logs,
      method: "Canvas local sem FFmpeg"
    };
  } catch (err) {
    log("error", "Exportação falhou: " + getErrorMessage(err), { stack: err?.stack });
    throw attachDetails(
      new Error(`Exportação falhou: ${getErrorMessage(err)}`),
      { diagnostics, logs, method: "Canvas local sem FFmpeg" }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Selecionar mime type suportado pelo browser
// ─────────────────────────────────────────────────────────────────────────────
function getSupportedMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=h264,aac",
    "video/mp4;codecs=h264",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm"
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

// ─────────────────────────────────────────────────────────────────────────────
// ZIP do projeto (mantido para uso manual)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportProjectZip({
  data,
  format,
  logoFile,
  musicFile,
  onLog = () => {},
  onProgress,
  platform,
  videoFile
}) {
  const logs = [];
  const log = (level, message, extra = {}) => {
    const entry = { at: new Date().toISOString(), level, message, ...extra };
    logs.push(entry);
    onLog(entry);
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"]("[Export]", message, extra);
  };
  const context = { data, format, logoFile, musicFile, platform, videoFile };

  onProgress({ label: "Preparando ZIP do projeto", value: 8 });
  const diagnostics = await validateExportInput(context);
  log("info", "ZIP manual solicitado.", diagnostics);
  const zipBlob = await exportEmergencyZip(context, diagnostics, logs, onProgress, log);
  downloadBlob(zipBlob, getExportFilename(data, platform, "zip"));
  onProgress({ label: "ZIP do projeto pronto", value: 100 });
  return { diagnostics, logs, method: "ZIP do projeto" };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
async function validateExportInput({ format, platform, videoFile }) {
  const diagnostics = buildBasicDiagnostics({ format, platform, videoFile });

  if (!videoFile) throw new Error("Vídeo não carregado. Faz upload de um vídeo antes de exportar.");
  if (!videoFile.type.startsWith("video/")) throw new Error(`Formato inválido: ${videoFile.type || "tipo desconhecido"}.`);
  if (!format?.width || !format?.height || format.width < 320 || format.height < 320) {
    throw new Error("Formato inválido. O preset escolhido não tem dimensões válidas.");
  }

  diagnostics.canRecord = Boolean(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);

  if (videoFile.size > BROWSER_EXPORT_LIMIT_BYTES) {
    throw new Error(
      `Este vídeo tem ${formatBytes(videoFile.size)} e ultrapassa o limite desta versão gratuita (${formatBytes(BROWSER_EXPORT_LIMIT_BYTES)}). ` +
      "Comprime o vídeo para menos de 4 MB antes de exportar."
    );
  }

  const video = await loadVideo(videoFile);
  diagnostics.duration = Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : 0;
  diagnostics.videoWidth = video.videoWidth || null;
  diagnostics.videoHeight = video.videoHeight || null;
  diagnostics.codecSupport = video.canPlayType(videoFile.type) || "unknown";

  if (!diagnostics.duration || diagnostics.duration <= 0) {
    throw new Error("Não foi possível ler a duração do vídeo.");
  }
  if (diagnostics.duration > 300) {
    diagnostics.sizeWarning = "Vídeo acima de 5 minutos — a exportação pode ser lenta.";
  }

  diagnostics.isMobile = isMobileBrowser();
  diagnostics.mimeType = diagnostics.canRecord ? getSupportedMimeType() : "indisponível";
  diagnostics.method = "Canvas local sem FFmpeg";

  URL.revokeObjectURL(video.src);
  return diagnostics;
}

function buildBasicDiagnostics({ format, platform, videoFile }) {
  return {
    browser: navigator.userAgent,
    canRecord: Boolean(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream),
    codecSupport: "não verificado",
    duration: null,
    fileName: videoFile?.name || "",
    fileSize: videoFile?.size || 0,
    fileSizeReadable: videoFile ? formatBytes(videoFile.size) : "0 B",
    fileType: videoFile?.type || "",
    format: format?.label || "",
    height: format?.height || null,
    memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "desconhecido",
    method: "",
    preset: platform?.presetName || platform?.label || "Personalizado",
    safeArea: format?.safeArea || null,
    videoHeight: null,
    videoWidth: null,
    width: format?.width || null
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ZIP de emergência (mantido igual ao original)
// ─────────────────────────────────────────────────────────────────────────────
async function exportEmergencyZip(context, diagnostics, logs, onProgress, log) {
  onProgress({ label: "Preparando ZIP do projeto", value: 78 });
  const zip = new JSZip();
  const project = {
    createdAt: new Date().toISOString(),
    data: context.data,
    diagnostics,
    format: context.format,
    platform: context.platform,
    version: 1
  };

  zip.file(`video-original${getFileExtension(context.videoFile, ".mp4")}`, context.videoFile);
  if (context.logoFile) zip.file(`logo${getFileExtension(context.logoFile, ".png")}`, context.logoFile);
  if (context.musicFile) zip.file(`musica${getFileExtension(context.musicFile, ".mp3")}`, context.musicFile);
  zip.file("projeto.json", JSON.stringify(project, null, 2));
  zip.file("textos-editados.txt", buildTextExport(context.data, context.platform, context.format));
  zip.file("legendas.srt", buildSrtExport(context.data, diagnostics));
  zip.file("logs-exportacao.json", JSON.stringify(logs, null, 2));
  zip.file(
    "instrucoes-capcut.txt",
    [
      "ZIP do projeto - Viral Template Studio",
      "",
      "1. Importe video-original no CapCut.",
      "2. Use overlay-template.png como referência visual.",
      "3. Copie os textos de textos-editados.txt.",
      "4. Se existir musica, importe como faixa de áudio.",
      "5. Exporte no formato indicado em projeto.json."
    ].join("\n")
  );

  try {
    const overlay = await createOverlayPng(context);
    zip.file("overlay-template.png", overlay);
    log("info", "Overlay PNG adicionado ao ZIP.", { size: overlay.size });
  } catch (err) {
    log("error", "Não foi possível gerar overlay PNG.", { error: getErrorMessage(err) });
  }

  onProgress({ label: "Preparando ZIP do projeto", value: 88 });
  return zip.generateAsync({ type: "blob", compression: "STORE" }, (metadata) =>
    onProgress({ label: "Preparando ZIP do projeto", value: 88 + metadata.percent * 0.1 })
  );
}

async function createOverlayPng({ data, format, logoFile, platform, videoFile }) {
  const video = await loadVideo(videoFile);
  await seekVideo(video, Math.min(0.1, Math.max(0, video.duration || 0)));
  const logo = logoFile ? await loadImageFromFile(logoFile) : null;
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  drawScene(ctx, { data, format, logo, platform, video });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas não conseguiu gerar PNG."));
    }, "image/png");
  });
}

function buildTextExport(data, platform, format) {
  return [
    `Preset: ${platform?.presetName || platform?.label || "Personalizado"}`,
    `Formato: ${format.label} (${format.width}x${format.height})`,
    "",
    `Página: ${data.pageName}`,
    `Utilizador: ${data.handle}`,
    "",
    "Frase principal:",
    data.headline,
    "",
    `Destaques: ${data.highlights}`,
    data.subline ? `Linha curta: ${data.subline}` : "",
    "",
    "Blocos:",
    ...data.blocks.map((block, index) => `${index + 1}. ${block.title} / ${block.text}`),
    "",
    "CTA:",
    data.cta
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSrtExport(data, diagnostics) {
  const end = secondsToSrtTime(Math.min(Math.max(diagnostics?.duration || 5, 5), 12));
  return [
    "1",
    `00:00:00,000 --> ${end}`,
    data.headline,
    "",
    "2",
    `${end} --> ${secondsToSrtTime(diagnostics?.duration || 15)}`,
    data.cta.replace(/\n/g, " ")
  ].join("\n");
}

function secondsToSrtTime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}


function getBrowserRenderFormat(format) {
  // Exportação local no telemóvel: usar resolução social leve para evitar crash.
  // O ficheiro final mantém o template, textos, logo e vídeo.
  if (format.id === "landscape") {
    return { ...format, width: 854, height: 480, safeArea: scaleSafeArea(format.safeArea, 854 / format.width) };
  }
  if (format.id === "square") {
    return { ...format, width: 540, height: 540, safeArea: scaleSafeArea(format.safeArea, 540 / format.width) };
  }
  return { ...format, width: 540, height: 960, safeArea: scaleSafeArea(format.safeArea, 540 / format.width) };
}

function scaleSafeArea(safeArea, ratio) {
  if (!safeArea) return safeArea;
  return Object.fromEntries(Object.entries(safeArea).map(([key, value]) => [key, Math.round(value * ratio)]));
}
// ─────────────────────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DA CENA — idêntica à preview
// ─────────────────────────────────────────────────────────────────────────────
function drawScene(ctx, { data, format, logo, platform, video }) {
  const { width, height } = format;
  const accent = data.color || "#f8b91a";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  drawGlow(ctx, width, height, accent);

  if (format.id === "landscape") {
    drawLandscape(ctx, { accent, data, format, logo, platform, video });
    return;
  }

  drawStacked(ctx, { accent, data, format, logo, platform, video });
}

function drawStacked(ctx, { accent, data, format, logo, platform, video }) {
  const { width, height } = format;
  const compact = format.id === "square";

  if (compact) {
    const pad = 38;
    const logoSize = 92;
    const media = { x: pad, y: 178, w: width - pad * 2, h: 196, r: 24 };
    drawLogo(ctx, pad, 44, logoSize, accent, logo);
    drawText(ctx, data.pageName, pad + logoSize + 24, 82, {
      color: "#fff",
      fontSize: 38,
      maxWidth: width - pad * 2 - logoSize - 36,
      weight: "900",
      lineHeight: 1
    });
    drawVerified(ctx, Math.min(width - pad - 42, pad + logoSize + 28 + measureText(ctx, data.pageName, 38)), 52, accent, 32);
    drawText(ctx, data.handle || data.username, pad + logoSize + 24, 124, {
      color: "#d7d7dc",
      font: "Arial",
      fontSize: 23,
      maxWidth: width - pad * 2,
      weight: "800"
    });
    drawRoundedVideo(ctx, video, media, accent, data);
    drawHighlightedText(ctx, data.headline, data.highlights, pad, 432, {
      accent,
      fontSize: 48,
      lineHeight: 1.03,
      maxLines: 2,
      maxWidth: width - pad * 2,
      align: "center"
    });
    drawCta(ctx, data.cta, data.highlights, pad, height - 86, width - pad * 2, 66, accent);
    return;
  }

  const scale = width / 1080;
  const S = (value) => value * scale;
  const outer = {
    x: S(30),
    y: S(76),
    w: width - S(60),
    h: height - S(160),
    r: S(38)
  };

  ctx.save();
  roundedPath(ctx, outer.x, outer.y, outer.w, outer.h, outer.r);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, S(4));
  ctx.shadowColor = hexToRgba(accent, 0.78);
  ctx.shadowBlur = S(28);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexToRgba(accent, 0.68);
  ctx.lineWidth = Math.max(1, S(2));
  ctx.shadowColor = hexToRgba(accent, 0.45);
  ctx.shadowBlur = S(18);
  ctx.beginPath();
  ctx.moveTo(outer.x + S(40), outer.y + S(38));
  ctx.lineTo(outer.x + outer.w * 0.44, outer.y + S(38));
  ctx.moveTo(outer.x + outer.w * 0.56, outer.y + S(38));
  ctx.lineTo(outer.x + outer.w - S(40), outer.y + S(38));
  ctx.stroke();
  drawPlus(ctx, outer.x + outer.w / 2, outer.y + S(38), S(24), accent);
  ctx.restore();

  const logoSize = S(126);
  const logoX = outer.x + S(48);
  const logoY = outer.y + S(62);
  drawLogo(ctx, logoX, logoY, logoSize, accent, logo);

  const nameX = logoX + logoSize + S(30);
  const nameY = logoY + S(48);
  const nameFont = S(58);
  drawText(ctx, data.pageName, nameX, nameY, {
    color: "#fff",
    fontSize: nameFont,
    maxWidth: outer.w - logoSize - S(160),
    weight: "900",
    lineHeight: 1
  });
  const nameWidth = Math.min(outer.w - logoSize - S(190), measureText(ctx, data.pageName, nameFont));
  drawVerified(ctx, nameX + nameWidth + S(18), nameY - S(32), accent, S(42));
  drawText(ctx, data.handle || data.username, nameX, logoY + S(106), {
    color: "#d7d7dc",
    font: "Arial",
    fontSize: S(38),
    maxWidth: outer.w - logoSize - S(100),
    weight: "800"
  });

  const panel = {
    x: outer.x + S(32),
    y: outer.y + S(230),
    w: outer.w - S(64),
    h: S(1180),
    r: S(30)
  };
  drawInnerTemplatePanel(ctx, panel, accent);

  const media = {
    x: panel.x,
    y: panel.y,
    w: panel.w,
    h: S(880),
    r: S(30)
  };
  drawRoundedVideo(ctx, video, media, accent, data, { stroke: false });

  const headlineY = media.y + media.h + S(118);
  drawHighlightedText(ctx, data.headline, data.highlights, outer.x + S(74), headlineY, {
    accent,
    fontSize: S(78),
    lineHeight: 1.02,
    maxLines: 2,
    maxWidth: outer.w - S(148),
    align: "center"
  });

  if (data.subline || data.subHeadline) {
    drawCenteredRuleText(
      ctx,
      data.subHeadline || data.subline,
      outer.x + S(80),
      headlineY + S(126),
      outer.w - S(160),
      S(31),
      accent
    );
  }

  drawBlocks(ctx, data.blocks, outer.x + S(92), outer.y + S(1478), outer.w - S(184), S(156), accent);
  drawCta(ctx, data.ctaText || data.cta, data.highlights, outer.x + S(50), outer.y + S(1618), outer.w - S(100), S(104), accent);
}

function drawInnerTemplatePanel(ctx, rect, accent) {
  ctx.save();
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, rect.w * 0.0055);
  ctx.shadowColor = hexToRgba(accent, 0.72);
  ctx.shadowBlur = rect.w * 0.035;
  ctx.stroke();
  ctx.restore();
}

function drawCenteredRuleText(ctx, text, x, y, w, fontSize, accent) {
  const value = String(text || "").toUpperCase();
  ctx.save();
  ctx.font = `900 ${fontSize}px Arial Black, Impact, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 10;
  const center = x + w / 2;
  const textWidth = Math.min(ctx.measureText(value).width, w * 0.68);
  const lineY = y - fontSize * 0.38;
  const gap = fontSize * 0.95;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, fontSize * 0.12);
  ctx.shadowColor = hexToRgba(accent, 0.65);
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, lineY);
  ctx.lineTo(center - textWidth / 2 - gap, lineY);
  ctx.moveTo(center + textWidth / 2 + gap, lineY);
  ctx.lineTo(x + w, lineY);
  ctx.stroke();
  ctx.shadowColor = "rgba(0,0,0,0.88)";
  ctx.shadowBlur = 8;
  ctx.fillText(value, center, y);
  ctx.restore();
}

function drawPlus(ctx, x, y, size, accent) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, size * 0.22);
  ctx.lineCap = "round";
  ctx.shadowColor = hexToRgba(accent, 0.72);
  ctx.shadowBlur = size * 0.65;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawLandscape(ctx, { accent, data, format, logo, platform, video }) {
  const { width, height } = format;
  const pad = 76;
  const leftW = 690;
  const media = { x: 820, y: 130, w: 1010, h: 568, r: 34 };

  drawRail(ctx, pad, 54, width - pad * 2, accent, platform.presetName);
  drawLogo(ctx, pad, 130, 130, accent, logo);
  drawText(ctx, data.pageName, 232, 158, {
    color: "#fff",
    fontSize: 52,
    maxWidth: leftW - 180,
    weight: "900",
    lineHeight: 1
  });
  drawVerified(ctx, 232 + Math.min(410, measureText(ctx, data.pageName, 52) + 22), 134, accent);
  drawText(ctx, data.handle, 232, 218, {
    color: "#a8a8ae",
    font: "Arial",
    fontSize: 32,
    maxWidth: leftW,
    weight: "700"
  });
  drawHighlightedText(ctx, data.headline, data.highlights, pad, 325, {
    accent,
    fontSize: 68,
    lineHeight: 1.04,
    maxLines: 6,
    maxWidth: leftW
  });
  drawRoundedVideo(ctx, video, media, accent, data);
  drawBlocks(ctx, data.blocks, pad, 780, width - pad * 2, 132, accent);
  drawCta(ctx, data.cta, data.highlights, pad, 934, width - pad * 2, 92, accent);
}

function drawGlow(ctx, width, height, accent) {
  const gradient = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, width * 0.75);
  gradient.addColorStop(0, hexToRgba(accent, 0.28));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRail(ctx, x, y, w, accent, label) {
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.42, y);
  ctx.moveTo(x + w * 0.58, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  drawText(ctx, label.toUpperCase(), x + w * 0.43, y - 11, {
    color: accent,
    fontSize: 24,
    maxWidth: w * 0.14,
    align: "center",
    weight: "900"
  });
}

function drawLogo(ctx, x, y, size, accent, logo) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#050505";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(5, size * 0.04);
  ctx.stroke();
  ctx.clip();
  if (logo) {
    drawImageCover(ctx, logo, x, y, size, size);
  } else {
    ctx.strokeStyle = accent;
    ctx.lineWidth = size * 0.08;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.28, y + size * 0.62);
    ctx.lineTo(x + size * 0.45, y + size * 0.45);
    ctx.lineTo(x + size * 0.58, y + size * 0.54);
    ctx.lineTo(x + size * 0.76, y + size * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVerified(ctx, x, y, accent, size = 44) {
  const half = size / 2;
  ctx.fillStyle = "#159cff";
  ctx.beginPath();
  ctx.arc(x + half, y + half, size * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.27, y + size * 0.52);
  ctx.lineTo(x + size * 0.45, y + size * 0.7);
  ctx.lineTo(x + size * 0.77, y + size * 0.32);
  ctx.stroke();
}

function drawRoundedVideo(ctx, video, rect, accent, data = {}, options = {}) {
  ctx.save();
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.clip();
  drawImageWithPlacement(ctx, video, rect.x, rect.y, rect.w, rect.h, data);
  ctx.restore();
  if (options.stroke === false) return;
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawBlocks(ctx, blocks, x, y, w, h, accent) {
  const count = blocks.length;
  const itemW = w / count;
  const iconRadius = Math.min(17, h * 0.2);
  blocks.forEach((block, index) => {
    const bx = x + itemW * index;
    const hasSecondLine = Boolean(String(block.text || "").trim());
    ctx.strokeStyle = hexToRgba(accent, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, y + h * 0.05);
    ctx.lineTo(bx, y + h * 0.95);
    if (index === count - 1) {
      ctx.moveTo(bx + itemW, y + h * 0.05);
      ctx.lineTo(bx + itemW, y + h * 0.95);
    }
    ctx.stroke();

    drawSimpleIcon(ctx, bx + itemW / 2, y + h * 0.26, accent, block.icon, iconRadius);
    drawText(ctx, block.title, bx + 10, y + h * (hasSecondLine ? 0.62 : 0.72), {
      color: "#fff",
      fontSize: Math.max(10, h * 0.145),
      maxWidth: itemW - 20,
      align: "center",
      weight: "900",
      lineHeight: 1
    });
    if (hasSecondLine) {
      drawText(ctx, block.text, bx + 10, y + h * 0.82, {
        color: accent,
        fontSize: Math.max(8, h * 0.115),
        maxWidth: itemW - 20,
        align: "center",
        weight: "900",
        lineHeight: 1
      });
    }
  });
}

function drawSimpleIcon(ctx, x, y, accent, type = "", radius = 23) {
  const r = radius;
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.shadowColor = hexToRgba(accent, 0.58);
  ctx.shadowBlur = r * 0.65;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  if (type === "bookmark") {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.34, y - r * 0.52);
    ctx.lineTo(x + r * 0.34, y - r * 0.52);
    ctx.lineTo(x + r * 0.34, y + r * 0.5);
    ctx.lineTo(x, y + r * 0.22);
    ctx.lineTo(x - r * 0.34, y + r * 0.5);
    ctx.closePath();
    ctx.stroke();
  } else if (type === "plus" || type === "cross") {
    drawPlus(ctx, x, y, r * 0.55, accent);
  } else if (type === "heart") {
    ctx.font = "900 " + (r * 1.25) + "px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♡", x, y + r * 0.08);
  } else {
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y + r * 0.5);
    ctx.lineTo(x + r * 0.62, y - r * 0.55);
    ctx.moveTo(x + r * 0.62, y - r * 0.55);
    ctx.lineTo(x + r * 0.62, y + r * 0.08);
    ctx.moveTo(x + r * 0.62, y - r * 0.55);
    ctx.lineTo(x, y - r * 0.55);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCta(ctx, text, highlights, x, y, w, h, accent) {
  const radius = Math.max(12, h * 0.25);
  roundedPath(ctx, x, y, w, h, radius);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, h * 0.045);
  ctx.shadowColor = hexToRgba(accent, 0.58);
  ctx.shadowBlur = h * 0.24;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const saveX = x + h * 0.34;
  const saveY = y + h * 0.24;
  const saveW = h * 0.28;
  const saveH = h * 0.5;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, h * 0.055);
  ctx.beginPath();
  ctx.moveTo(saveX, saveY);
  ctx.lineTo(saveX + saveW, saveY);
  ctx.lineTo(saveX + saveW, saveY + saveH);
  ctx.lineTo(saveX + saveW / 2, saveY + saveH * 0.74);
  ctx.lineTo(saveX, saveY + saveH);
  ctx.closePath();
  ctx.stroke();

  const pillX = x + h * 1.06;
  const pillY = y + h * 0.25;
  const pillW = w - h * 2.12;
  const pillH = h * 0.5;
  roundedPath(ctx, pillX, pillY, pillW, pillH, Math.max(7, pillH * 0.2));
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.shadowColor = hexToRgba(accent, 0.55);
  ctx.shadowBlur = h * 0.14;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, h * 0.025);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const arrowSize = h * 0.38;
  const arrowX = x + w - h * 0.4;
  const arrowY = y + h * 0.31;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, h * 0.075);
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(arrowX - arrowSize * 0.78, arrowY + arrowSize * 0.78);
  ctx.lineTo(arrowX, arrowY);
  ctx.lineTo(arrowX, arrowY + arrowSize * 0.5);
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - arrowSize * 0.5, arrowY);
  ctx.stroke();

  drawSingleLineText(ctx, String(text || "").replace(/\n/g, " "), pillX + pillH * 0.42, pillY + pillH * 0.69, pillW - pillH * 0.84, Math.min(17, pillH * 0.48), "#050505");
}

function drawSingleLineText(ctx, text, x, baseline, maxWidth, fontSize, color) {
  const value = String(text || "").replace(/\s+/g, " ").trim().toUpperCase();
  let size = fontSize;
  ctx.font = "900 " + size + "px Impact, Arial Black, sans-serif";
  while (ctx.measureText(value).width > maxWidth && size > 8) {
    size -= 0.5;
    ctx.font = "900 " + size + "px Impact, Arial Black, sans-serif";
  }
  ctx.save();
  ctx.font = "900 " + size + "px Impact, Arial Black, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(255,255,255,0.18)";
  ctx.shadowBlur = 2;
  ctx.fillText(value, x + maxWidth / 2, baseline);
  ctx.restore();
}

function drawHighlightedSingleLine(ctx, text, highlights, x, baseline, maxWidth, fontSize, accent) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  let size = fontSize;
  ctx.font = "900 " + size + "px Impact, Arial Black, sans-serif";
  while (ctx.measureText(value).width > maxWidth && size > 9) {
    size -= 0.5;
    ctx.font = "900 " + size + "px Impact, Arial Black, sans-serif";
  }

  const highlightWords = new Set(
    String(highlights || "")
      .split(",")
      .flatMap((item) => item.trim().split(/\s+/))
      .map((word) => normalizeWord(word))
      .filter(Boolean)
  );
  const words = value.split(/\s+/).filter(Boolean);
  let cursor = x + Math.max(0, (maxWidth - ctx.measureText(value).width) / 2);
  ctx.save();
  ctx.font = "900 " + size + "px Impact, Arial Black, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 5;
  words.forEach((word) => {
    ctx.fillStyle = highlightWords.has(normalizeWord(word)) ? accent : "#fff";
    ctx.fillText(word, cursor, baseline);
    cursor += ctx.measureText(word + " ").width;
  });
  ctx.restore();
}

function drawHighlightedText(ctx, text, highlights, x, y, options) {
  const highlightWords = new Set(
    highlights
      .split(",")
      .flatMap((item) => item.trim().split(/\s+/))
      .map((word) => normalizeWord(word))
      .filter(Boolean)
  );
  const words = text.replace(/\n/g, " ").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = [];
  ctx.font = `900 ${options.fontSize}px Impact, Arial Black, sans-serif`;

  words.forEach((word) => {
    const test = [...line, word].join(" ");
    if (ctx.measureText(test).width > options.maxWidth && line.length) {
      lines.push(line);
      line = [word];
    } else {
      line.push(word);
    }
  });
  if (line.length) lines.push(line);

  lines.slice(0, options.maxLines).forEach((lineWords, lineIndex) => {
    const lineText = lineWords.join(" ");
    let cursor = x;
    if (options.align === "center") {
      cursor = x + (options.maxWidth - ctx.measureText(lineText).width) / 2;
    }
    lineWords.forEach((word) => {
      const clean = normalizeWord(word);
      ctx.fillStyle = highlightWords.has(clean) ? options.accent : "#fff";
      ctx.fillText(word, cursor, y + lineIndex * options.fontSize * options.lineHeight);
      cursor += ctx.measureText(`${word} `).width;
    });
  });
}

function drawText(ctx, text, x, y, options) {
  ctx.font = `${options.weight || "900"} ${options.fontSize}px ${options.font || "Impact, Arial Black, sans-serif"}`;
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align || "left";
  wrapLines(ctx, text, options.maxWidth).forEach((line, index) => {
    const drawX = options.align === "center" ? x + options.maxWidth / 2 : x;
    ctx.fillText(line, drawX, y + index * options.fontSize * (options.lineHeight || 1.1));
  });
  ctx.textAlign = "left";
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function measureText(ctx, text, fontSize) {
  ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
  return ctx.measureText(text).width;
}

function drawImageCover(ctx, source, x, y, w, h) {
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  const sourceRatio = sw / sh;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sWidth = sw, sHeight = sh;
  if (sourceRatio > targetRatio) {
    sWidth = sh * targetRatio;
    sx = (sw - sWidth) / 2;
  } else {
    sHeight = sw / targetRatio;
    sy = (sh - sHeight) / 2;
  }
  ctx.drawImage(source, sx, sy, sWidth, sHeight, x, y, w, h);
}

function drawImageWithPlacement(ctx, source, x, y, w, h, data = {}) {
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  if (!sw || !sh) return;

  const fit = data.mediaFit === "contain" ? "contain" : "cover";
  const zoom = Math.max(0.2, Number(data.mediaZoom || 1));
  const offsetX = Number(data.mediaOffsetX || 0) * (w / 1080);
  const offsetY = Number(data.mediaOffsetY || 0) * (w / 1080);
  const sourceRatio = sw / sh;
  const targetRatio = w / h;

  let drawW;
  let drawH;
  if (fit === "contain") {
    if (sourceRatio > targetRatio) {
      drawW = w;
      drawH = w / sourceRatio;
    } else {
      drawH = h;
      drawW = h * sourceRatio;
    }
  } else if (sourceRatio > targetRatio) {
    drawH = h;
    drawW = h * sourceRatio;
  } else {
    drawW = w;
    drawH = w / sourceRatio;
  }

  drawW *= zoom;
  drawH *= zoom;
  ctx.drawImage(source, x + (w - drawW) / 2 + offsetX, y + (h - drawH) / 2 + offsetY, drawW, drawH);
}

function roundedPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function normalizeWord(word) {
  return word
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]/g, "");
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
function loadVideo(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.preload = "auto";
    video.playsInline = true;
    video.muted = false; // manter áudio para a captura
    video.crossOrigin = "anonymous";
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("Vídeo não carregado. O navegador não conseguiu ler este ficheiro."));
  });
}

function startRecorder(recorder) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    recorder.onerror = (event) => {
      if (settled) return;
      settled = true;
      reject(new Error("MediaRecorder erro: " + getErrorMessage(event.error)));
    };
    recorder.onstart = finish;
    recorder.start(250);
    setTimeout(finish, 350);
  });
}

function stopRecorder(recorder) {
  return new Promise((resolve, reject) => {
    if (recorder.state === "inactive") {
      resolve();
      return;
    }
    recorder.onstop = () => resolve();
    recorder.onerror = (event) => reject(new Error("MediaRecorder erro: " + getErrorMessage(event.error)));
    recorder.stop();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderVideoInRealtime({ ctx, data, duration, format, logo, onProgress, platform, video }) {
  return new Promise((resolve) => {
    let frameCount = 0;
    let settled = false;
    let lastProgress = -1;

    const finish = () => {
      if (settled) return;
      settled = true;
      drawScene(ctx, { data, format, logo, platform, video });
      onProgress({ label: "A renderizar… 100%", value: 92 });
      resolve(frameCount);
    };

    const tick = () => {
      if (settled) return;
      drawScene(ctx, { data, format, logo, platform, video });
      frameCount++;

      const progress = duration > 0 ? Math.min(video.currentTime / duration, 1) : 1;
      const progressPercent = Math.round(progress * 100);
      if (progressPercent !== lastProgress && (progressPercent % 2 === 0 || progress >= 1)) {
        lastProgress = progressPercent;
        onProgress({
          label: `A renderizar… ${progressPercent}%`,
          value: Math.round(24 + progress * 68)
        });
      }

      if (video.ended || progress >= 0.999) {
        finish();
        return;
      }

      requestAnimationFrame(tick);
    };

    video.onended = finish;
    video.onerror = finish;
    requestAnimationFrame(tick);
  });
}

async function createExportAudioGraph({ duration, log, musicFile, videoFile }) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    log("warn", "Web Audio indisponível; exportação seguirá sem áudio.");
    return null;
  }

  const audioContext = new AudioContextCtor();
  const destination = audioContext.createMediaStreamDestination();
  const sources = [];

  async function addSource(file, label, gainValue) {
    if (!file) return;
    try {
      const buffer = await decodeAudioBuffer(audioContext, file);
      if (!buffer?.duration || !buffer.numberOfChannels) return;
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      gain.gain.value = gainValue;
      source.connect(gain).connect(destination);
      sources.push({ label, source });
      log("info", `${label} preparado para exportação.`, {
        channels: buffer.numberOfChannels,
        duration: Number(buffer.duration.toFixed(2))
      });
    } catch (err) {
      log("warn", `${label} não pôde ser usado no export.`, { error: getErrorMessage(err) });
    }
  }

  await addSource(videoFile, "Áudio do vídeo original", 1);
  await addSource(musicFile, "Música de fundo", 0.45);

  if (!sources.length) {
    await audioContext.close().catch(() => {});
    log("warn", "Nenhuma faixa de áudio decodificável encontrada; exportação seguirá sem som.");
    return null;
  }

  return {
    stream: destination.stream,
    async start() {
      if (audioContext.state === "suspended") await audioContext.resume();
      sources.forEach(({ source }) => {
        const maxDuration = Number.isFinite(duration) && duration > 0
          ? Math.min(duration, source.buffer.duration)
          : source.buffer.duration;
        source.start(0, 0, maxDuration);
      });
    },
    stop() {
      sources.forEach(({ source }) => {
        try {
          source.stop();
        } catch {
          // Source may already have ended.
        }
      });
      destination.stream.getTracks().forEach((track) => track.stop());
      audioContext.close().catch(() => {});
    }
  };
}

async function decodeAudioBuffer(audioContext, file) {
  const arrayBuffer = await file.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer.slice(0));
}

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < 0.01) { requestAnimationFrame(resolve); return; }
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, 1800);
    const cleanup = () => { clearTimeout(timer); video.onseeked = null; video.onerror = null; };
    video.onseeked = () => { cleanup(); resolve(); };
    video.onerror = () => { cleanup(); reject(new Error("Não foi possível capturar um frame do vídeo.")); };
    video.currentTime = time;
  });
}

function loadAudio(file) {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.src = URL.createObjectURL(file);
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.onloadedmetadata = () => resolve(audio);
    audio.onerror = () => reject(new Error("A música de fundo não pôde ser carregada."));
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Erro ao carregar o logo."));
    image.src = URL.createObjectURL(file);
  });
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Erro ao carregar o logo padrão do template."));
    image.src = url;
  });
}

function validateVideoBlob(blob, extension) {
  if (!blob || blob.size <= 0) {
    throw new Error("O navegador terminou a gravação, mas gerou um ficheiro vazio.");
  }

  if (blob.size < MIN_VALID_VIDEO_BYTES) {
    throw new Error(
      `O ficheiro gerado parece incompleto (${formatBytes(blob.size)}). Tenta exportar novamente com um vídeo mais curto ou comprimido.`
    );
  }

  if (!["mp4", "webm"].includes(extension)) {
    throw new Error(`Formato final inválido: ${extension}.`);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.addEventListener("beforeunload", () => URL.revokeObjectURL(url), { once: true });
  return { url, filename };
}

function attachDetails(error, details) {
  error.exportDetails = details;
  return error;
}

function getErrorMessage(error) {
  return error?.message || String(error || "Erro desconhecido");
}

function getExportFilename(data, platform, extension) {
  const preset = platform?.presetName || platform?.label || "personalizado";
  return `${data.id}-${preset.toLowerCase().replaceAll(" ", "-").replaceAll(":", "")}.${extension}`;
}

function getFileExtension(file, fallback) {
  const name = file?.name || "";
  const match = name.match(/\.[a-z0-9]+$/i);
  return match?.[0] || fallback;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exp).toFixed(exp ? 1 : 0)} ${units[exp]}`;
}

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
