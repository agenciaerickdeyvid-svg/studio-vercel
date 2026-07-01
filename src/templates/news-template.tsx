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

export const newsTemplate = {
  id: "noticias-breaking",
  label: "Notícias",
  category: "Notícias",
  color: "#ff1f24",
  secondaryColor: "#ffffff",
  logo: "",
  logoIcon: "newspaper",
  ornament: "bell",
  pageName: "NOTÍCIAS EM FOCO",
  handle: "@noticiasemfoco.oficial",
  username: "@noticiasemfoco.oficial",
  eyebrow: "URGENTE",
  headline: "DECISÃO HISTÓRICA PODE MUDAR O FUTURO DE MILHÕES DE PESSOAS",
  subHeadline: "AO VIVO • ÚLTIMA HORA",
  subline: "AO VIVO • ÚLTIMA HORA",
  highlights: "PODE MUDAR O FUTURO",
  cta: "SIGA PARA MAIS\nNOTÍCIAS EM TEMPO REAL",
  ctaText: "SIGA PARA MAIS\nNOTÍCIAS EM TEMPO REAL",
  videoSource: "",
  style: "news",
  blocks: [
    { icon: "globe", title: "MUNDO", text: "NOTÍCIAS GLOBAIS" },
    { icon: "zap", title: "URGENTE", text: "ÚLTIMA HORA" },
    { icon: "line", title: "ECONOMIA", text: "MERCADOS" },
    { icon: "landmark", title: "POLÍTICA", text: "DECISÕES" }
  ]
};
