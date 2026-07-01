import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toPng } from "html-to-image";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Bell,
  Bookmark,
  Brain,
  CalendarDays,
  CircleDollarSign,
  Cross,
  Crown,
  Dumbbell,
  Flame,
  Film,
  Gamepad2,
  Globe2,
  Goal,
  Heart,
  HeartPulse,
  Laugh,
  Lightbulb,
  LineChart,
  Landmark,
  MessageCircle,
  Mountain,
  Newspaper,
  Plane,
  Play,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Shirt,
  Sparkles,
  Smartphone,
  Target,
  Trophy,
  Utensils,
  Upload,
  Zap
} from "lucide-react";
import { exportEditedVideo, exportProjectZip, formatPresets, platformPresets } from "./videoExport";
import { gamingTemplate } from "./templates/gaming-template";
import { memesTemplate } from "./templates/memes-template";
import { newsTemplate } from "./templates/news-template";
import "./styles.css";

const iconMap = {
  banknote: Banknote,
  bell: Bell,
  bookmark: Bookmark,
  brain: Brain,
  calendar: CalendarDays,
  cross: Cross,
  crown: Crown,
  dollar: CircleDollarSign,
  dumbbell: Dumbbell,
  flame: Flame,
  film: Film,
  gamepad: Gamepad2,
  goal: Goal,
  globe: Globe2,
  heart: Heart,
  heartPulse: HeartPulse,
  landmark: Landmark,
  laugh: Laugh,
  lightbulb: Lightbulb,
  line: LineChart,
  message: MessageCircle,
  mountain: Mountain,
  newspaper: Newspaper,
  plane: Plane,
  plus: Plus,
  search: Search,
  share: Share2,
  shield: ShieldCheck,
  shirt: Shirt,
  sparkles: Sparkles,
  star: Sparkles,
  smartphone: Smartphone,
  target: Target,
  trophy: Trophy,
  utensils: Utensils,
  zap: Zap
};

const templates = [
  {
    id: "fe-proposito",
    label: "Anime",
    category: "Anime",
    color: "#7cff00",
    secondaryColor: "#ffffff",
    logoIcon: "flame",
    ornament: "plus",
    defaultLogoUrl: "/reference-images/logo-goku.jpeg",
    pageName: "GOKUZINHO",
    handle: "@goku.sem.filtro",
    username: "@goku.sem.filtro",
    headline: "ESSES ANIMES TA BOCA SUJA!!",
    highlights: "ANIMES, BOCA SUJA",
    subline: "PARA RIR E CHORAR!",
    subHeadline: "PARA RIR E CHORAR!",
    cta: "SIGA PARA MAIS!!!",
    ctaText: "SIGA PARA MAIS!!!",
    blocks: [
      { icon: "heart", title: "LIKE", text: "" },
      { icon: "bookmark", title: "FAVORITA", text: "" },
      { icon: "plus", title: "SEGUE", text: "" }
    ]
  },
  {
    id: "fe-proposito-classico",
    label: "Fé e Propósito",
    category: "Religioso",
    color: "#f8b91a",
    logoIcon: "cross",
    ornament: "cross",
    pageName: "FÉ E PROPÓSITO",
    handle: "@feeproposito",
    headline: "DEUS JÁ NOS FALOU TUDO. VOCÊ APENAS NÃO QUIS OUVIR.",
    highlights: "FALOU TUDO",
    subline: "",
    cta: "SIGA PARA MAIS\nMENSAGENS QUE EDIFICAM",
    blocks: [
      { icon: "heart", title: "ORAÇÃO", text: "DIÁRIA" },
      { icon: "bookmark", title: "PALAVRA", text: "VIVA" },
      { icon: "sparkles", title: "PROPÓSITO", text: "COM FÉ" }
    ]
  },
  {
    id: "mente-forte",
    label: "Mente Forte",
    color: "#9b5cff",
    logoIcon: "brain",
    ornament: "shield",
    pageName: "MENTE FORTE",
    handle: "@menteforte.oficial",
    headline: "A SUA MENTE DESISTE ANTES DO SEU CORPO. TREINE O FOCO.",
    highlights: "MENTE, FOCO",
    subline: "RESPIRE • CONTROLE • AVANCE",
    cta: "SIGA PARA MAIS\nDISCIPLINA MENTAL",
    blocks: [
      { icon: "brain", title: "MENTE", text: "BLINDADA" },
      { icon: "shield", title: "CONTROLE", text: "EMOCIONAL" },
      { icon: "target", title: "FOCO", text: "TOTAL" },
      { icon: "line", title: "EVOLUÇÃO", text: "DIÁRIA" }
    ]
  },
  {
    id: "vida-em-foco",
    label: "Vida em Foco",
    color: "#ffc21a",
    logoIcon: "mountain",
    ornament: "crown",
    pageName: "VIDA EM FOCO",
    handle: "@vidaemfoco.oficial",
    headline: "NEM SEMPRE É FÁCIL, MAS SEMPRE VALE A PENA CONTINUAR.",
    highlights: "MAS SEMPRE VALE A PENA",
    subline: "",
    cta: "SIGA PARA MAIS\nMOTIVAÇÃO E REFLEXÕES",
    blocks: [
      { icon: "target", title: "FOCO", text: "PROPÓSITO" },
      { icon: "heart", title: "GRATIDÃO", text: "DIÁRIA" },
      { icon: "line", title: "DISCIPLINA", text: "SEMPRE" }
    ]
  },
  {
    id: "mentalidade-milionaria",
    label: "Mentalidade Milionária",
    color: "#f7ac16",
    logoIcon: "line",
    ornament: "dollar",
    pageName: "MENTALIDADE MILIONÁRIA",
    handle: "@mentalidademilionaria.oficial",
    headline: "A DISCIPLINA DE HOJE CONSTROI A LIBERDADE FINANCEIRA DE AMANHÃ.",
    highlights: "CONSTROI A LIBERDADE",
    subline: "PENSE • PLANEJE • EXECUTE • ENRIQUEÇA",
    cta: "SIGA PARA MAIS\nCONTEÚDOS QUE GERAM RIQUEZA!",
    blocks: [
      { icon: "target", title: "FOCO", text: "OBJETIVO" },
      { icon: "brain", title: "MENTE", text: "ESTRATÉGICA" },
      { icon: "line", title: "AÇÕES", text: "RESULTADOS" },
      { icon: "banknote", title: "LIBERDADE", text: "FINANCEIRA" }
    ]
  },
  {
    id: "mentes-curiosas",
    label: "Mentes Curiosas",
    color: "#129cff",
    logoIcon: "lightbulb",
    ornament: "search",
    pageName: "MENTES CURIOSAS",
    handle: "@mentescuriosas.oficial",
    headline: "5 FATOS QUE VÃO MUDAR A FORMA COMO VOCÊ VÊ O MUNDO!",
    highlights: "VÃO MUDAR, O MUNDO",
    subline: "",
    cta: "SIGA PARA MAIS\nCURIOSIDADES INCRÍVEIS!",
    blocks: [
      { icon: "lightbulb", title: "FATOS", text: "VIRAIS" },
      { icon: "brain", title: "MENTE", text: "CURIOSA" },
      { icon: "search", title: "DETALHES", text: "INCRÍVEIS" }
    ]
  },
  {
    id: "fitness-transformacao",
    label: "Fitness",
    category: "Fitness",
    color: "#00e5ff",
    secondaryColor: "#ffffff",
    logoIcon: "dumbbell",
    ornament: "zap",
    pageName: "CORPO EM FOCO",
    handle: "@corpoemfoco.oficial",
    headline: "O RESULTADO QUE VOCÊ QUER MORA NA DISCIPLINA QUE VOCÊ EVITA.",
    highlights: "RESULTADO, DISCIPLINA",
    subline: "TREINO • FOCO • EVOLUÇÃO",
    cta: "SIGA PARA MAIS\nTREINOS E MOTIVAÇÃO",
    blocks: [
      { icon: "dumbbell", title: "TREINO", text: "FORTE" },
      { icon: "heartPulse", title: "SAÚDE", text: "ATIVA" },
      { icon: "target", title: "META", text: "CLARA" }
    ]
  },
  {
    id: "culinaria-rapida",
    label: "Culinária",
    category: "Receitas",
    color: "#ff7a00",
    secondaryColor: "#ffffff",
    logoIcon: "utensils",
    ornament: "heart",
    pageName: "RECEITAS VIRAIS",
    handle: "@receitasvirais.oficial",
    headline: "ESSA RECEITA FICA PRONTA RÁPIDO E TODO MUNDO PEDE MAIS.",
    highlights: "PRONTA RÁPIDO, PEDE MAIS",
    subline: "SIMPLES • BARATO • GOSTOSO",
    cta: "SIGA PARA MAIS\nRECEITAS FÁCEIS",
    blocks: [
      { icon: "utensils", title: "PASSO A", text: "PASSO" },
      { icon: "flame", title: "SABOR", text: "FORTE" },
      { icon: "bookmark", title: "SALVE", text: "RECEITA" }
    ]
  },
  {
    id: "viagens-explora",
    label: "Viagens",
    category: "Viagens",
    color: "#18d17b",
    secondaryColor: "#ffffff",
    logoIcon: "plane",
    ornament: "globe",
    pageName: "ROTA SECRETA",
    handle: "@rotasecreta.oficial",
    headline: "LUGARES QUE PARECEM MENTIRA, MAS EXISTEM E CABEM NO ROTEIRO.",
    highlights: "PARECEM MENTIRA, EXISTEM",
    subline: "DESTINOS • DICAS • ROTEIROS",
    cta: "SIGA PARA MAIS\nDESTINOS INCRÍVEIS",
    blocks: [
      { icon: "plane", title: "DESTINOS", text: "REAIS" },
      { icon: "mountain", title: "VISUAIS", text: "ÉPICOS" },
      { icon: "bookmark", title: "SALVE", text: "ROTEIRO" }
    ]
  },
  {
    id: "beleza-estilo",
    label: "Beleza",
    category: "Moda e Beleza",
    color: "#ff2fb3",
    secondaryColor: "#ffffff",
    logoIcon: "shirt",
    ornament: "sparkles",
    pageName: "ESTILO VIRAL",
    handle: "@estiloviral.oficial",
    headline: "UM DETALHE MUDA O LOOK INTEIRO E DEIXA TUDO MAIS CARO.",
    highlights: "DETALHE, LOOK INTEIRO",
    subline: "LOOKS • BELEZA • CONFIANÇA",
    cta: "SIGA PARA MAIS\nIDEIAS DE ESTILO",
    blocks: [
      { icon: "sparkles", title: "LOOK", text: "DO DIA" },
      { icon: "shirt", title: "ESTILO", text: "FÁCIL" },
      { icon: "heart", title: "INSPIRE", text: "SALVE" }
    ]
  },
  {
    id: "tech-ia",
    label: "Tecnologia",
    category: "Tecnologia",
    color: "#00e5ff",
    secondaryColor: "#ffffff",
    logoIcon: "smartphone",
    ornament: "brain",
    pageName: "TECH EM ALTA",
    handle: "@techemalta.oficial",
    headline: "ESSA FERRAMENTA DE IA PODE ECONOMIZAR HORAS DO SEU DIA.",
    highlights: "IA, ECONOMIZAR HORAS",
    subline: "APPS • IA • PRODUTIVIDADE",
    cta: "SIGA PARA MAIS\nFERRAMENTAS ÚTEIS",
    blocks: [
      { icon: "smartphone", title: "APPS", text: "ÚTEIS" },
      { icon: "brain", title: "IA", text: "PRÁTICA" },
      { icon: "zap", title: "GANHE", text: "TEMPO" }
    ]
  },
  {
    id: "cinema-series",
    label: "Cinema",
    category: "Filmes e Séries",
    color: "#facc15",
    secondaryColor: "#ffffff",
    logoIcon: "film",
    ornament: "star",
    pageName: "CENA FINAL",
    handle: "@cenafinal.oficial",
    headline: "ESSE FINAL FEZ TODO MUNDO PAUSAR E VOLTAR A CENA.",
    highlights: "FINAL, VOLTAR A CENA",
    subline: "FILMES • SÉRIES • TEORIAS",
    cta: "SIGA PARA MAIS\nCENAS E TEORIAS",
    blocks: [
      { icon: "film", title: "CENA", text: "ÉPICA" },
      { icon: "search", title: "DETALHES", text: "OCULTOS" },
      { icon: "message", title: "COMENTE", text: "TEORIA" }
    ]
  },
  {
    id: "futebol-viral",
    label: "Futebol",
    category: "Esportes",
    color: "#22c55e",
    secondaryColor: "#ffffff",
    logoIcon: "goal",
    ornament: "trophy",
    pageName: "FUTEBOL VIRAL",
    handle: "@futebolviral.oficial",
    headline: "ESSE LANCE FEZ A TORCIDA LEVANTAR E O ESTADIO TREMER.",
    highlights: "LANCE, TORCIDA, ESTADIO TREMER",
    subline: "GOLS • LANCES • ZOEIRA",
    cta: "SIGA PARA MAIS\nFUTEBOL TODO DIA",
    blocks: [
      { icon: "goal", title: "GOLS", text: "DO DIA" },
      { icon: "trophy", title: "CRAQUES", text: "EM CAMPO" },
      { icon: "flame", title: "LANCES", text: "QUENTES" }
    ]
  },
  gamingTemplate,
  newsTemplate,
  memesTemplate
];



const colorPalettes = [
  { name: "Dourado", primary: "#f8b91a", secondary: "#ffffff" },
  { name: "Azul Viral", primary: "#129cff", secondary: "#e0f2fe" },
  { name: "Vermelho Notícias", primary: "#ff1f24", secondary: "#ffffff" },
  { name: "Verde Gaming", primary: "#7cff00", secondary: "#ecfccb" },
  { name: "Roxo Premium", primary: "#9b5cff", secondary: "#f5f3ff" },
  { name: "Rosa Neon", primary: "#ff2fb3", secondary: "#ffe4f5" },
  { name: "Laranja Forte", primary: "#ff7a00", secondary: "#fff7ed" },
  { name: "Ciano Tech", primary: "#00e5ff", secondary: "#e0fbff" },
  { name: "Lima Meme", primary: "#a7ff00", secondary: "#f7ffe0" },
  { name: "Branco Luxo", primary: "#f5f5f5", secondary: "#f8b91a" },
  { name: "Preto/Gold", primary: "#d4af37", secondary: "#fef3c7" },
  { name: "Vinho", primary: "#b91c1c", secondary: "#fee2e2" }
];

function applyPaletteToData(current, palette) {
  return {
    ...current,
    color: palette.primary,
    primaryColor: palette.primary,
    secondaryColor: palette.secondary
  };
}

const defaultMedia = {
  "fe-proposito": "linear-gradient(135deg, #030602 0%, #102408 42%, #7cff00 120%)",
  "fe-proposito-classico": "linear-gradient(135deg, #171717 0%, #332412 38%, #f7aa20 70%, #111 100%)",
  "mente-forte": "linear-gradient(135deg, #12091f 0%, #37205f 48%, #9562ff 100%)",
  "vida-em-foco": "linear-gradient(135deg, #18130b 0%, #40310f 42%, #f8b91a 74%, #111 100%)",
  "mentalidade-milionaria": "linear-gradient(135deg, #0b0b0b 0%, #2d220f 40%, #d98b17 72%, #111 100%)",
  "mentes-curiosas": "linear-gradient(135deg, #02070f 0%, #063255 45%, #129cff 100%)",
  "fitness-transformacao": "linear-gradient(135deg, #041014 0%, #08384a 45%, #00e5ff 120%)",
  "culinaria-rapida": "linear-gradient(135deg, #160802 0%, #4a1d08 46%, #ff7a00 120%)",
  "viagens-explora": "linear-gradient(135deg, #03130a 0%, #06402a 46%, #18d17b 120%)",
  "beleza-estilo": "linear-gradient(135deg, #16030e 0%, #4a1236 46%, #ff2fb3 120%)",
  "tech-ia": "linear-gradient(135deg, #020912 0%, #063255 46%, #00e5ff 120%)",
  "cinema-series": "linear-gradient(135deg, #141006 0%, #3a2b06 46%, #facc15 120%)",
  "futebol-viral": "linear-gradient(135deg, #031108 0%, #0a3d1f 46%, #22c55e 120%)",
  "gaming-esports": "linear-gradient(135deg, #031006 0%, #0d2b13 45%, #7cff00 120%)",
  "noticias-breaking": "linear-gradient(135deg, #150404 0%, #320909 46%, #ff1f24 120%)",
  "memes-viral": "linear-gradient(135deg, #111 0%, #222 48%, #a7ff00 120%)"
};

function getFreshTemplate(template) {
  const fresh = JSON.parse(JSON.stringify(template));
  return {
    ...fresh,
    category: fresh.category || "Motivacional",
    primaryColor: fresh.primaryColor || fresh.color,
    secondaryColor: fresh.secondaryColor || "#ffffff",
    mediaFit: fresh.mediaFit || "cover",
    mediaOffsetX: fresh.mediaOffsetX || 0,
    mediaOffsetY: fresh.mediaOffsetY || 0,
    mediaZoom: fresh.mediaZoom || 1,
    username: fresh.username || fresh.handle,
    subHeadline: fresh.subHeadline || fresh.subline || "",
    ctaText: fresh.ctaText || fresh.cta
  };
}

function App() {
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [data, setData] = useState(() => getFreshTemplate(templates[0]));
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [platformId, setPlatformId] = useState("tiktok");
  const [formatId, setFormatId] = useState(platformPresets.tiktok.format);
  const [exportState, setExportState] = useState({
    diagnostics: null,
    downloadUrl: "",
    error: "",
    filename: "",
    label: "",
    logs: [],
    method: "",
    running: false,
    value: 0
  });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [colorsOpen, setColorsOpen] = useState(false);
  const exportRef = useRef(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [selectedId]
  );
  const selectedPlatform = platformPresets[platformId];
  const selectedFormat = formatPresets[formatId];

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations?.()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {});
    }

    setInstallPrompt(null);
    setShowInstall(false);
  }, []);

  function selectTemplate(id) {
    const next = getFreshTemplate(templates.find((template) => template.id === id));
    setSelectedId(id);
    setData(next);
  }

  function updateField(field, value) {
    setData((current) => {
      const next = { ...current, [field]: value };
      if (field === "color") next.primaryColor = value;
      if (field === "primaryColor") next.color = value;
      if (field === "secondaryColor") next.secondaryColor = value;
      if (field === "handle") next.username = value;
      if (field === "username") next.handle = value;
      if (field === "subHeadline") next.subline = value;
      if (field === "subline") next.subHeadline = value;
      if (field === "cta") next.ctaText = value;
      if (field === "ctaText") next.cta = value;
      return next;
    });
  }

  function applyPalette(palette) {
    setData((current) => applyPaletteToData(current, palette));
  }

  function updateBlock(index, field, value) {
    setData((current) => ({
      ...current,
      blocks: current.blocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, [field]: value } : block
      )
    }));
  }

  function updateMediaPlacement(patch) {
    setData((current) => ({ ...current, ...patch }));
  }

  function nudgeMedia(axis, amount) {
    setData((current) => ({
      ...current,
      [axis]: Math.max(-240, Math.min(240, Number(current[axis] || 0) + amount))
    }));
  }

  function resetMediaPlacement() {
    setData((current) => ({
      ...current,
      mediaFit: "cover",
      mediaOffsetX: 0,
      mediaOffsetY: 0,
      mediaZoom: 1
    }));
  }

  function handleUpload(event, fileSetter, urlSetter, typeSetter, expectedKind) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (expectedKind !== "image" && expectedKind !== "audio" && file.type.startsWith("video/") && file.size > 4 * 1024 * 1024) {
      setExportState((current) => ({
        ...current,
        error: "Vídeo acima de 4 MB. Nesta versão gratuita, comprime o vídeo antes de exportar."
      }));
      return;
    }
    if (expectedKind && !file.type.startsWith(`${expectedKind}/`)) {
      setExportState((current) => ({
        ...current,
        error: `Formato inválido. Escolhe um ficheiro de ${expectedKind === "audio" ? "áudio" : expectedKind}.`
      }));
      return;
    }
    fileSetter(file);
    const nextUrl = URL.createObjectURL(file);
    urlSetter((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return nextUrl;
    });
    setExportState((current) => ({ ...current, error: "" }));
    if (typeSetter) typeSetter(file.type.startsWith("video") ? "video" : "image");
  }

  function selectPlatform(id) {
    if (id === "custom") {
      setPlatformId("custom");
      return;
    }
    const nextPlatform = platformPresets[id];
    setPlatformId(id);
    setFormatId(nextPlatform.format);
  }

  function selectFormat(id) {
    setFormatId(id);
    const matchingPlatform = Object.values(platformPresets).find(
      (platform) => platform.format === id && platform.id === platformId
    );
    if (!matchingPlatform) setPlatformId("custom");
  }

  async function exportPng() {
    if (!exportRef.current) return;
    const dataUrl = await toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 1,
      width: 1080,
      height: 1920,
      backgroundColor: "#000000",
      style: {
        width: "1080px",
        height: "1920px",
        transform: "none"
      }
    });
    const link = document.createElement("a");
    link.download = `${data.id}-viral-template.png`;
    link.href = dataUrl;
    link.click();
  }

  async function installApp() {
    if (!installPrompt) {
      setShowInstall(false);
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstall(false);
  }

  async function exportVideo() {
    setExportState({
      diagnostics: null,
      downloadUrl: "",
      error: "",
      filename: "",
      label: "Validando ficheiro",
      logs: [],
      method: "",
      running: true,
      value: 3
    });
    try {
      setExportState((current) => ({
        ...current,
        label: "A preparar exportação local…",
        value: 8
      }));

      const result = await exportEditedVideo({
        data,
        format: selectedFormat,
        logoFile,
        musicFile,
        overlayFile: null,
        onLog: (entry) =>
          setExportState((current) => ({
            ...current,
            logs: [...current.logs, entry].slice(-80)
          })),
        onProgress: (progress) =>
          setExportState((current) => ({
            ...current,
            error: "",
            label: progress.label,
            value: Math.round(progress.value)
          })),
        platform: selectedPlatform || {
          id: "custom",
          label: selectedFormat.label,
          presetName: selectedFormat.label,
          format: selectedFormat.id
        },
        videoFile: mediaType === "video" ? mediaFile : null
      });
      setExportState((current) => ({
        ...current,
        diagnostics: result.diagnostics,
        downloadUrl: result.downloadUrl || "",
        filename: result.filename || "video-exportado.webm",
        label: "Exportação concluída",
        method: result.method,
        running: false,
        value: 100
      }));
    } catch (error) {
      console.error("[Viral Template Studio export] Falha final da exportação", error);
      setExportState({
        diagnostics: error?.exportDetails?.diagnostics || null,
        downloadUrl: "",
        error: error?.message || "Erro ao exportar: falha técnica desconhecida.",
        filename: "",
        label: "Exportação interrompida",
        logs: error?.exportDetails?.logs || [],
        method: error?.exportDetails?.method || "failed",
        running: false,
        value: 0
      });
      return;
    }
  }



  async function createTransparentTemplateOverlay() {
    if (!exportRef.current) return null;

    const node = exportRef.current;
    node.classList.add("export-overlay-capture");
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
        backgroundColor: "transparent",
        style: {
          width: "1080px",
          height: "1920px",
          transform: "none"
        }
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new File([blob], "template-overlay.png", { type: "image/png" });
    } finally {
      node.classList.remove("export-overlay-capture");
    }
  }
  async function downloadProjectZip() {
    setExportState({
      diagnostics: null,
      downloadUrl: "",
      error: "",
      filename: "",
      label: "Preparando ZIP do projeto",
      logs: [],
      method: "",
      running: true,
      value: 3
    });
    try {
      const result = await exportProjectZip({
        data,
        format: selectedFormat,
        logoFile,
        musicFile,
        onLog: (entry) =>
          setExportState((current) => ({
            ...current,
            logs: [...current.logs, entry].slice(-80)
          })),
        onProgress: (progress) =>
          setExportState((current) => ({
            ...current,
            error: "",
            label: progress.label,
            value: Math.round(progress.value)
          })),
        platform: selectedPlatform || {
          id: "custom",
          label: selectedFormat.label,
          presetName: selectedFormat.label,
          format: selectedFormat.id
        },
        videoFile: mediaType === "video" ? mediaFile : null
      });
      setExportState((current) => ({
        ...current,
        diagnostics: result.diagnostics,
        downloadUrl: "",
        filename: "",
        label: "ZIP do projeto pronto",
        method: result.method,
        running: false,
        value: 100
      }));
    } catch (error) {
      console.error("[Viral Template Studio export] Falha ao gerar ZIP do projeto", error);
      setExportState({
        diagnostics: error?.exportDetails?.diagnostics || null,
        downloadUrl: "",
        error: error?.message || "Erro ao preparar ZIP do projeto.",
        filename: "",
        label: "Exportação interrompida",
        logs: error?.exportDetails?.logs || [],
        method: error?.exportDetails?.method || "zip-failed",
        running: false,
        value: 0
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {showInstall && (
        <div className="install-banner">
          <div>
            <strong>Instalar no telemóvel</strong>
            <span>Android: toca em Instalar. iPhone: Partilhar e depois “Adicionar ao ecrã principal”.</span>
          </div>
          <button onClick={installApp}>{installPrompt ? "Instalar" : "OK"}</button>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 lg:flex-row">
        <aside className="panel order-2 w-full lg:order-1 lg:w-[390px]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Editor</p>
              <h1 className="mt-1 text-2xl font-black uppercase">Viral Template Studio</h1>
            </div>
            <button onClick={exportPng} className="primary-button">
              Exportar PNG
            </button>
          </div>

          <Field label="Escolher template / nicho">
            <select
              className="template-select"
              value={selectedId}
              onChange={(event) => selectTemplate(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label} - {template.category || "Motivacional"}
                </option>
              ))}
            </select>
          </Field>

          <section className="template-gallery collapsible-panel">
            <button
              className="collapsible-trigger"
              onClick={() => setTemplatesOpen((open) => !open)}
              type="button"
            >
              <span>Escolher template</span>
              <strong>{templatesOpen ? "Lista aberta" : "Ver lista"}</strong>
            </button>

            <div className="selected-template-summary">
              <span>Selecionado</span>
              <strong>{templates.find((template) => template.id === selectedId)?.label}</strong>
            </div>

            {templatesOpen && (
              <div className="gallery-grid gallery-list">
                {templates.map((template, index) => (
                  <button
                    className={selectedId === template.id ? "template-card template-row active" : "template-card template-row"}
                    key={template.id}
                    onClick={() => {
                      selectTemplate(template.id);
                      setTemplatesOpen(false);
                    }}
                    style={{
                      "--card-accent": template.color,
                      "--card-secondary": template.secondaryColor || "#ffffff"
                    }}
                    type="button"
                  >
                    <span className="template-number">{index + 1}</span>
                    <div>
                      <strong>{template.label}</strong>
                      <small>{template.category || "Motivacional"} · {template.pageName}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <UploadBox
              label="Logo"
              accept="image/*"
              onChange={(event) => handleUpload(event, setLogoFile, setLogoUrl, null, "image")}
            />
            <UploadBox
              label="Imagem/Vídeo"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              onChange={(event) => handleUpload(event, setMediaFile, setMediaUrl, setMediaType)}
            />
            <UploadBox
              label="Música"
              accept="audio/*"
              onChange={(event) => handleUpload(event, setMusicFile, setMusicUrl, null, "audio")}
            />
          </div>
          {musicUrl && <p className="file-pill">Música carregada: {musicFile?.name}</p>}

          <div className="export-card">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Exportação de vídeo</p>
            <div className="mobile-server-note">
              Exporta no navegador até 4 MB. Melhor com vídeos curtos e já comprimidos em Chrome/Android. O ficheiro final sai com template, texto, logo, vídeo e áudio quando o navegador conseguir decodificar o som.
            </div>
            <Field label="Plataforma">
              <select value={platformId} onChange={(event) => selectPlatform(event.target.value)}>
                {Object.values(platformPresets).map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.label}
                  </option>
                ))}
                <option value="custom">Personalizado</option>
              </select>
            </Field>

            <div className="format-grid">
              {Object.values(formatPresets).map((format) => (
                <button
                  className={formatId === format.id ? "format-chip active" : "format-chip"}
                  key={format.id}
                  onClick={() => selectFormat(format.id)}
                  type="button"
                >
                  <strong>{format.label}</strong>
                  <span>
                    {format.width}x{format.height}
                  </span>
                </button>
              ))}
            </div>

            <div className="preset-summary">
              <strong>{selectedPlatform?.presetName || "Personalizado"}</strong>
              <span>
                {selectedFormat.width}x{selectedFormat.height} · Área segura: topo {selectedFormat.safeArea.top}px,
                laterais {selectedFormat.safeArea.left}px
              </span>
            </div>

            <button
              className="video-export-button"
              disabled={exportState.running}
              onClick={exportVideo}
              type="button"
            >
              {exportState.running ? "A exportar vídeo…" : "Exportar vídeo"}
            </button>

            <button
              className="zip-export-button"
              disabled={exportState.running}
              onClick={downloadProjectZip}
              type="button"
            >
              Baixar projeto ZIP
            </button>

            {(exportState.running || exportState.label) && (
              <div className="progress-box">
                <div className="progress-copy">
                  <span>{exportState.label || "Download pronto"}</span>
                  <strong>{exportState.value}%</strong>
                </div>
                <div className="progress-track">
                  <i style={{ width: `${exportState.value}%` }} />
                </div>
              </div>
            )}

            {exportState.downloadUrl && !exportState.running && (
              <a
                className="download-ready-button"
                download={exportState.filename || "video-exportado.webm"}
                href={exportState.downloadUrl}
              >
                Baixar vídeo pronto
              </a>
            )}

            {exportState.error && (
              <div className="error-box">
                <p>{exportState.error}</p>
                <div className="error-actions">
                  <button disabled={exportState.running} onClick={exportVideo} type="button">
                    Tentar novamente
                  </button>
                  <button disabled={exportState.running} onClick={downloadProjectZip} type="button">
                    Baixar projeto ZIP
                  </button>
                </div>
              </div>
            )}

            {(exportState.diagnostics || exportState.logs.length > 0 || exportState.method) && (
              <details className="technical-details">
                <summary>Detalhes técnicos</summary>
                <dl>
                  <div>
                    <dt>Navegador</dt>
                    <dd>{exportState.diagnostics?.browser || navigator.userAgent}</dd>
                  </div>
                  <div>
                    <dt>Sistema operativo</dt>
                    <dd>{getOperatingSystem()}</dd>
                  </div>
                  <div>
                    <dt>Memória aprox.</dt>
                    <dd>{exportState.diagnostics?.memory || (navigator.deviceMemory ? `${navigator.deviceMemory} GB aprox.` : "não disponível")}</dd>
                  </div>
                  <div>
                    <dt>Vídeo</dt>
                    <dd>
                      {exportState.diagnostics?.fileName || mediaFile?.name || "não carregado"} ·{" "}
                      {exportState.diagnostics?.fileSizeReadable || `${mediaFile?.size || 0} bytes`}
                    </dd>
                  </div>
                  <div>
                    <dt>Duração</dt>
                    <dd>{exportState.diagnostics?.duration ? `${exportState.diagnostics.duration}s` : "não verificada"}</dd>
                  </div>
                  <div>
                    <dt>Preset</dt>
                    <dd>{exportState.diagnostics?.preset || selectedPlatform?.presetName || "Personalizado"}</dd>
                  </div>
                  <div>
                    <dt>Dimensões</dt>
                    <dd>
                      {exportState.diagnostics?.width || selectedFormat.width}x
                      {exportState.diagnostics?.height || selectedFormat.height}
                    </dd>
                  </div>
                  <div>
                    <dt>Método usado</dt>
                    <dd>{exportState.method || "ainda não concluído"}</dd>
                  </div>
                  <div>
                    <dt>Codec</dt>
                    <dd>{exportState.diagnostics?.codecSupport || "não verificado"}</dd>
                  </div>
                </dl>
                {exportState.logs.length > 0 && (
                  <pre>{exportState.logs.map((log) => `${log.at} [${log.level}] ${log.message}${log.error ? ` — ${log.error}` : ""}`).join("\n")}</pre>
                )}
              </details>
            )}
          </div>

          <section className="color-panel collapsible-panel">
            <button
              className="collapsible-trigger"
              onClick={() => setColorsOpen((open) => !open)}
              type="button"
            >
              <span>Cores do template</span>
              <strong>{colorsOpen ? "Fechar" : "Abrir"}</strong>
            </button>

            <div className="current-colors">
              <i style={{ background: data.color }} />
              <i style={{ background: data.secondaryColor || "#ffffff" }} />
              <span>{data.color} / {data.secondaryColor || "#ffffff"}</span>
            </div>

            {colorsOpen && (
              <>
                <div className="palette-grid">
                  {colorPalettes.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => applyPalette(palette)}
                      type="button"
                      className="palette-button"
                    >
                      <span>
                        <i style={{ background: palette.primary }} />
                        <i style={{ background: palette.secondary }} />
                      </span>
                      <strong>{palette.name}</strong>
                    </button>
                  ))}
                </div>

                <Field label="Cor principal personalizada">
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={data.color}
                      onChange={(event) => updateField("color", event.target.value)}
                      className="h-11 w-14 shrink-0 rounded border border-zinc-700 bg-transparent p-1"
                    />
                    <input
                      value={data.color}
                      onChange={(event) => updateField("color", event.target.value)}
                    />
                  </div>
                </Field>

                <Field label="Cor secundária personalizada">
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={data.secondaryColor || "#ffffff"}
                      onChange={(event) => updateField("secondaryColor", event.target.value)}
                      className="h-11 w-14 shrink-0 rounded border border-zinc-700 bg-transparent p-1"
                    />
                    <input
                      value={data.secondaryColor || "#ffffff"}
                      onChange={(event) => updateField("secondaryColor", event.target.value)}
                    />
                  </div>
                </Field>
              </>
            )}
          </section>

          <Field label="Nome da página">
            <input value={data.pageName} onChange={(event) => updateField("pageName", event.target.value)} />
          </Field>
          <Field label="@utilizador">
            <input value={data.username || data.handle} onChange={(event) => updateField("username", event.target.value)} />
          </Field>
          <Field label="Frase principal">
            <textarea
              rows="4"
              value={data.headline}
              onChange={(event) => updateField("headline", event.target.value)}
            />
          </Field>
          <Field label="Palavras destacadas, separadas por vírgula">
            <input value={data.highlights} onChange={(event) => updateField("highlights", event.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <input value={data.subHeadline || data.subline || ""} onChange={(event) => updateField("subHeadline", event.target.value)} />
          </Field>

          <div className="mt-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Blocos inferiores</p>
            {data.blocks.map((block, index) => (
              <div key={index} className="rounded-lg border border-zinc-800 bg-black/30 p-3">
                <div className="grid grid-cols-[92px_1fr] gap-3">
                  <Field label="Ícone">
                    <select value={block.icon} onChange={(event) => updateBlock(index, "icon", event.target.value)}>
                      {Object.keys(iconMap).map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Texto 1">
                    <input value={block.title} onChange={(event) => updateBlock(index, "title", event.target.value)} />
                  </Field>
                </div>
                <Field label="Texto 2">
                  <input value={block.text} onChange={(event) => updateBlock(index, "text", event.target.value)} />
                </Field>
              </div>
            ))}
          </div>

          <Field label="CTA final">
            <textarea rows="2" value={data.ctaText || data.cta} onChange={(event) => updateField("ctaText", event.target.value)} />
          </Field>
        </aside>

        <section className="preview-panel order-1 min-w-0 flex-1 lg:order-2">
          {mediaUrl && (
            <section className="media-fit-panel">
              <div className="media-fit-header">
                <div>
                  <p>Enquadramento do vídeo</p>
                  <span>
                    Zoom {Math.round(Number(data.mediaZoom || 1) * 100)}% · X {Math.round(Number(data.mediaOffsetX || 0))} · Y {Math.round(Number(data.mediaOffsetY || 0))}
                  </span>
                </div>
                <button onClick={resetMediaPlacement} type="button">Reset</button>
              </div>

              <div className="media-fit-tabs">
                <button
                  className={(data.mediaFit || "cover") === "cover" ? "active" : ""}
                  onClick={() => updateMediaPlacement({ mediaFit: "cover" })}
                  type="button"
                >
                  Preencher
                </button>
                <button
                  className={data.mediaFit === "contain" ? "active" : ""}
                  onClick={() => updateMediaPlacement({ mediaFit: "contain" })}
                  type="button"
                >
                  Inteiro
                </button>
              </div>

              <Field label="Zoom do vídeo">
                <input
                  max="2"
                  min="0.65"
                  onChange={(event) => updateMediaPlacement({ mediaZoom: Number(event.target.value) })}
                  step="0.01"
                  type="range"
                  value={Number(data.mediaZoom || 1)}
                />
              </Field>

              <div className="position-nudge-grid" aria-label="Mover vídeo">
                <span />
                <button onClick={() => nudgeMedia("mediaOffsetY", -12)} type="button">Cima</button>
                <span />
                <button onClick={() => nudgeMedia("mediaOffsetX", -12)} type="button">Esq.</button>
                <button onClick={() => updateMediaPlacement({ mediaOffsetX: 0, mediaOffsetY: 0 })} type="button">Centro</button>
                <button onClick={() => nudgeMedia("mediaOffsetX", 12)} type="button">Dir.</button>
                <span />
                <button onClick={() => nudgeMedia("mediaOffsetY", 12)} type="button">Baixo</button>
                <span />
              </div>
            </section>
          )}
          <div className="stage-viewport">
            <TemplateCanvas
              ref={exportRef}
              data={data}
              logoUrl={logoUrl}
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              fallbackMedia={defaultMedia[selectedTemplate.id]}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="mt-4 block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function UploadBox({ accept = "image/*,video/*", label, onChange }) {
  return (
    <label className="upload-box">
      <Upload size={18} />
      <span>{label}</span>
      <input type="file" accept={accept} onChange={onChange} className="hidden" />
    </label>
  );
}

function getMediaElementStyle(data) {
  const zoom = Number(data.mediaZoom || 1);
  const offsetX = Number(data.mediaOffsetX || 0);
  const offsetY = Number(data.mediaOffsetY || 0);
  return {
    objectFit: data.mediaFit === "contain" ? "contain" : "cover",
    transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`
  };
}

const TemplateCanvas = React.forwardRef(function TemplateCanvas(
  { data, logoUrl, mediaUrl, mediaType, fallbackMedia },
  ref
) {
  const LogoIcon = iconMap[data.logoIcon] || Sparkles;
  const OrnamentIcon = iconMap[data.ornament] || Crown;
  const videoRef = useRef(null);
  const [showPlay, setShowPlay] = useState(true);

  function toggleVideoPlayback() {
    const video = videoRef.current;
    if (!video || mediaType !== "video") return;
    if (video.paused || video.ended) {
      video.play();
      return;
    }
    video.pause();
  }

  const templateStyle = data.style || (data.id === "fe-proposito" ? "classic" : "niche");
  const secondaryColor = data.secondaryColor || "#ffffff";

  return (
    <article
      ref={ref}
      className={`template-stage template-${templateStyle}`}
      style={{ "--accent": data.color, "--secondary": secondaryColor }}
    >
      <div className="noise" />
      <div className="dot-grid dot-grid-left" />
      <div className="dot-grid dot-grid-right" />

      <header className="template-header">
        <div className="top-rail">
          <span />
          <div className="rail-icon">
            <OrnamentIcon size={52} strokeWidth={2.4} />
          </div>
          <span />
        </div>

        <div className="profile-row">
          <div className="logo-ring">
            {logoUrl || data.defaultLogoUrl ? (
              <img src={logoUrl || data.defaultLogoUrl} alt="" />
            ) : (
              <LogoIcon size={92} strokeWidth={2.1} />
            )}
          </div>
          <div className="profile-copy">
            <div className="page-name">
              <span>{data.pageName}</span>
              <BadgeCheck className="verify" size={42} fill="#159cff" />
            </div>
            <p>{data.username || data.handle}</p>
          </div>
          <div className="menu-dots">
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="mid-rail">
          <span />
          <OrnamentIcon size={42} />
          <span />
        </div>
      </header>

      {data.eyebrow && <div className="breaking-strip">{data.eyebrow}</div>}

      <section className="media-frame">
        {mediaUrl ? (
          mediaType === "video" ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              playsInline
              style={getMediaElementStyle(data)}
              onClick={toggleVideoPlayback}
              onEnded={() => setShowPlay(true)}
              onPause={() => setShowPlay(true)}
              onPlay={() => setShowPlay(false)}
            />
          ) : (
            <img src={mediaUrl} alt="" style={getMediaElementStyle(data)} />
          )
        ) : (
          <div className="media-placeholder" style={{ background: fallbackMedia }}>
            <LogoIcon size={190} />
            {templateStyle === "memes" && (
              <div className="meme-grid-placeholder">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span key={index}>MEME {index + 1}</span>
                ))}
              </div>
            )}
          </div>
        )}
        {templateStyle === "news" && (
          <div className="news-video-badges">
            <strong>URGENTE</strong>
            <span>AO VIVO</span>
          </div>
        )}
        <button
          aria-label="Reproduzir vídeo"
          className={`play-button ${mediaType === "video" && !showPlay ? "is-hidden" : ""}`}
          onClick={toggleVideoPlayback}
          type="button"
        >
          <Play size={74} fill="white" strokeWidth={0} />
        </button>
      </section>

      <section className="headline-block">
        <h2 className="headline">
          <HighlightedText text={data.headline} highlights={data.highlights} />
        </h2>
        {(data.subHeadline || data.subline) && <p className="subline">{data.subHeadline || data.subline}</p>}
      </section>

      <section className={`block-grid count-${data.blocks.length}`}>
        {data.blocks.map((block, index) => {
          const Icon = iconMap[block.icon] || Sparkles;
          return (
            <div className="info-block" key={`${block.title}-${index}`}>
              <Icon size={62} strokeWidth={2.2} />
              <strong>{block.title}</strong>
              <span>{block.text}</span>
            </div>
          );
        })}
      </section>

      <footer className="cta-box">
        <Bookmark size={78} />
        <p>
          <HighlightedText text={data.ctaText || data.cta} highlights={data.highlights} compact />
        </p>
        <ArrowUpRight size={86} />
      </footer>
    </article>
  );
});

function HighlightedText({ text, highlights, compact = false }) {
  const highlightItems = String(highlights || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  let parts = [String(text || "")];
  highlightItems.forEach((highlight) => {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return [part];
      const regex = new RegExp(`(${escapeRegExp(highlight)})`, "gi");
      return part.split(regex).filter(Boolean).map((piece) =>
        piece.toUpperCase() === highlight ? { text: piece, highlight: true } : piece
      );
    });
  });

  return parts.map((part, index) => {
    if (typeof part === "string") {
      return compact ? (
        <React.Fragment key={index}>{part}</React.Fragment>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      );
    }
    return (
      <mark key={index} className="accent-text">
        {part.text}
      </mark>
    );
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOperatingSystem() {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Desconhecido";
}

createRoot(document.getElementById("root")).render(<App />);
