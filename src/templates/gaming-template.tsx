export interface TemplateConfig {
  logo: string;
  pageName: string;
  username: string;
  headline: string;
  subHeadline: string;
  ctaText: string;
  primaryColor: string;
  secondaryColor: string;
  videoSource: string;
}

export const gamingTemplate = {
  id: "gaming-esports",
  label: "Gaming",
  category: "Gaming",
  color: "#7CFF00",
  secondaryColor: "#ffffff",
  logo: "",
  logoIcon: "gamepad",
  ornament: "star",
  pageName: "FOCO E DISCIPLINA",
  handle: "@focoedisciplina.oficial",
  username: "@focoedisciplina.oficial",
  headline: "VENCEDORES NÃO NASCEM PRONTOS, ELES JOGAM, ERRAM E EVOLUEM.",
  subHeadline: "Visual competitivo para páginas gaming e eSports",
  subline: "",
  highlights: "NÃO NASCEM PRONTOS, E EVOLUEM",
  cta: "SIGA PARA MAIS\nCONTEÚDOS QUE EVOLUEM",
  ctaText: "SIGA PARA MAIS\nCONTEÚDOS QUE EVOLUEM",
  videoSource: "",
  style: "gaming",
  blocks: [
    { icon: "target", title: "GAMEPLAY", text: "ÉPICO" },
    { icon: "zap", title: "DICAS", text: "AVANÇADAS" },
    { icon: "trophy", title: "ESTRATÉGIAS", text: "VENCEDORAS" },
    { icon: "flame", title: "FOCO E", text: "DISCIPLINA" }
  ]
};
