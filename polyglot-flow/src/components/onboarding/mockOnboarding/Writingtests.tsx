interface TranslationQuestion {
  id: number;
  type: "translate" | "form-sentence";
  prompt: string;
  answer: string;
  options?: string[];
  hint?: string;
}
export const MOCK_QUESTIONS: TranslationQuestion[] = [
  // --- PORTUGUÊS (pt-br) ---
  {
    id: 4,
    type: "translate",
    prompt: "Eu gosto de ler livros na biblioteca.",
    answer: "Eu gosto de ler livros na biblioteca.",
    hint: "Sujeito + Verbo + Objeto + Lugar",
  },
  {
    id: 5,
    type: "translate",
    prompt: "Onde fica o banheiro?",
    answer: "Onde fica o banheiro?",
    hint: "Frase interrogativa comum",
  },
  {
    id: 6,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "Nós vamos viajar amanhã cedo.",
    options: ["cedo", "amanhã", "vamos", "Nós", "viajar"],
  },

  // --- ENGLISH (en) ---
  {
    id: 7,
    type: "translate",
    prompt: "Está chovendo muito lá fora.",
    answer: "It is raining a lot outside.",
    hint: "Use 'It is' para tempo meteorológico",
  },
  {
    id: 8,
    type: "translate",
    prompt: "Você quer tomar um café?",
    answer: "Do you want to have a coffee?",
    hint: "Auxiliar 'Do' para perguntas",
  },
  {
    id: 9,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "I have never been to London.",
    options: ["been", "never", "I", "London", "to", "have"],
  },

  // --- ESPAÑOL (es) ---
  {
    id: 10,
    type: "translate",
    prompt: "Meus pais moram em Madrid.",
    answer: "Mis padres viven en Madrid.",
    hint: "Possessivo plural + verbo viver",
  },
  {
    id: 11,
    type: "translate",
    prompt: "O que você está fazendo?",
    answer: "¿Qué estás haciendo?",
    hint: "Gerúndio com o verbo estar",
  },
  {
    id: 12,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "Me encanta la comida mexicana.",
    options: ["la", "comida", "encanta", "mexicana", "Me"],
  },

  // --- FRANÇAIS (fr) ---
  {
    id: 13,
    type: "translate",
    prompt: "Eu falo um pouco de francês.",
    answer: "Je parle un peu de français.",
    hint: "Sujeito + verbo parler",
  },
  {
    id: 14,
    type: "translate",
    prompt: "Como você se chama?",
    answer: "Comment t'appelles-tu ?",
    hint: "Verbo reflexivo para nomes",
  },
  {
    id: 15,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "Il fait beau aujourd'hui.",
    options: ["beau", "Il", "aujourd'hui", "fait"],
  },

  // --- DEUTSCH (de) ---
  {
    id: 16,
    type: "translate",
    prompt: "Eu tenho um cachorro e um gato.",
    answer: "Ich habe einen Hund und eine Katze.",
    hint: "Atenção ao gênero dos animais",
  },
  {
    id: 17,
    type: "translate",
    prompt: "A cerveja é muito gelada.",
    answer: "Das Bier ist sehr kalt.",
    hint: "Artigo neutro 'Das'",
  },
  {
    id: 18,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "Wir lernen jeden Tag Deutsch.",
    options: ["Tag", "jeden", "Deutsch", "Wir", "lernen"],
  },

  // --- ITALIANO (it) ---
  {
    id: 19,
    type: "translate",
    prompt: "A massa está deliciosa.",
    answer: "La pasta è deliziosa.",
    hint: "Verbo essere no presente",
  },
  {
    id: 20,
    type: "translate",
    prompt: "Tchau, até logo!",
    answer: "Ciao, a dopo!",
    hint: "Saudação informal",
  },
  {
    id: 21,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "Voglio mangiare una pizza margherita.",
    options: ["mangiare", "una", "Voglio", "margherita", "pizza"],
  },

  // --- NIHONGO / JAPONÊS (ja) ---
  {
    id: 22,
    type: "translate",
    prompt: "Prazer em conhecê-lo.",
    answer: "Hajimemashite.",
    hint: "Saudação ao conhecer alguém",
  },
  {
    id: 23,
    type: "translate",
    prompt: "Que horas são?",
    answer: "Nan-ji desu ka?",
    hint: "Pergunta sobre tempo",
  },
  {
    id: 24,
    type: "form-sentence",
    prompt: "Forme a frase:",
    answer: "Kore wa ringo desu.",
    options: ["desu", "wa", "Kore", "ringo"],
  },

  // --- KOREAN / COREANO (ko) ---
  {
  id: 25,
  type: "translate",
  prompt: "Traduza isso(maneira educada): Desculpa.",
  answer: "미안해요",
  hint: "Pedido de desculpa educado",
},
{
  id: 26,
  type: "translate",
  prompt: "Traduza isso: Quanto custa isso?",
  answer: "이거 얼마예요?",
  hint: "Pergunta comum em compras",
},
{
  id: 27,
  type: "form-sentence",
  prompt: "Forme a frase:",
  answer: "나는 한국어를 배우고 있어요.",
  options: ["있어요", "배우고", "한국어를", "나는"],
  hint: "Eu estou aprendendo coreano",
},
];

export const MOCK_QUESTIONS_BY_LANG: Record<string, TranslationQuestion[]> = {
  "pt-br": MOCK_QUESTIONS.slice(0, 3),
  "en": MOCK_QUESTIONS.slice(3, 6),
  "es": MOCK_QUESTIONS.slice(6, 9),
  "fr": MOCK_QUESTIONS.slice(9, 12),
  "de": MOCK_QUESTIONS.slice(12, 15),
  "it": MOCK_QUESTIONS.slice(15, 18),
  "ja": MOCK_QUESTIONS.slice(18, 21),
  "ko": MOCK_QUESTIONS.slice(21, 24),
};