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

export const memesTemplate = {
  id: "memes-viral",
  label: "Memes",
  category: "Memes",
  color: "#a7ff00",
  secondaryColor: "#fff200",
  logo: "",
  logoIcon: "laugh",
  ornament: "star",
  pageName: "MEMES BRASIL",
  handle: "@memesbrasil.oficial",
  username: "@memesbrasil.oficial",
  headline: "SE RIR, JÁ ERA",
  subHeadline: "A VIDA É MELHOR QUANDO A GENTE RI",
  subline: "A VIDA É MELHOR QUANDO A GENTE RI",
  highlights: "JÁ ERA, QUANDO A GENTE RI",
  cta: "SIGA PARA MAIS\nMEMES QUE SÃO A SUA CARA",
  ctaText: "SIGA PARA MAIS\nMEMES QUE SÃO A SUA CARA",
  videoSource: "",
  style: "memes",
  blocks: [
    { icon: "laugh", title: "MEMES", text: "TODOS OS DIAS" },
    { icon: "flame", title: "HUMOR", text: "SEM LIMITES" },
    { icon: "message", title: "COMENTE", text: "SUA RISADA" },
    { icon: "share", title: "COMPARTILHE", text: "COM OS AMIGOS" }
  ]
};
