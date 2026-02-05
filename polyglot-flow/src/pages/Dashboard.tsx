import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PhraseFeed } from "@/components/dashboard/PhraseFeed";
import { PhraseDetailSheet } from "@/components/dashboard/PhraseDetailSheet";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export interface Phrase {
  id: number;
  conteudo: string;
  idioma: string;
  grupo: string;
  titulo_pagina: string;
  favicon_url: string;
  created_at: string;
  detalhes: {
    traducao_completa: string;
    explicacao: string;
    fatias_traducoes: Record<string, string>;
  };
}

// Mock data para demonstração
const mockPhrases: Phrase[] = [
  {
    id: 1,
    conteudo: "I don't wanna go home yet",
    idioma: "en",
    grupo: "Inglês",
    titulo_pagina: "Reddit - r/CasualConversation",
    favicon_url: "https://www.reddit.com/favicon.ico",
    created_at: "2024-01-15T10:30:00Z",
    detalhes: {
      traducao_completa: "Eu não quero ir para casa ainda",
      explicacao: "O uso de 'wanna' é uma contração informal muito comum em inglês falado, combinando 'want' + 'to'. É amplamente usada em conversas casuais, músicas e filmes. Note que 'yet' no final indica que a ação ainda não aconteceu, mas pode acontecer no futuro.",
      fatias_traducoes: {
        "I don't": "Eu não",
        "wanna": "quero",
        "go home": "ir para casa",
        "yet": "ainda"
      }
    }
  },
  {
    id: 2,
    conteudo: "func main() { fmt.Println('Hello') }",
    idioma: "go",
    grupo: "Go Lang",
    titulo_pagina: "Go Documentation",
    favicon_url: "https://go.dev/favicon.ico",
    created_at: "2024-01-14T15:45:00Z",
    detalhes: {
      traducao_completa: "Função principal que imprime 'Hello' no console",
      explicacao: "Em Go, 'func main()' é o ponto de entrada do programa. O pacote 'fmt' fornece funções de formatação de I/O. 'Println' imprime uma linha com quebra de linha automática.",
      fatias_traducoes: {
        "func main()": "função principal",
        "fmt.Println": "imprimir linha formatada",
        "'Hello'": "string de texto"
      }
    }
  },
  {
    id: 3,
    conteudo: "Я хочу учить русский язык",
    idioma: "ru",
    grupo: "Russo",
    titulo_pagina: "Russian Learning Blog",
    favicon_url: "https://example.com/favicon.ico",
    created_at: "2024-01-13T09:20:00Z",
    detalhes: {
      traducao_completa: "Eu quero aprender a língua russa",
      explicacao: "Esta frase usa o verbo 'хотеть' (querer) conjugado na primeira pessoa. 'Учить' significa estudar/aprender. 'Русский язык' é literalmente 'língua russa'.",
      fatias_traducoes: {
        "Я": "Eu",
        "хочу": "quero",
        "учить": "aprender",
        "русский язык": "língua russa"
      }
    }
  },
  {
    id: 4,
    conteudo: "It's gonna be alright, don't worry about it",
    idioma: "en",
    grupo: "Inglês",
    titulo_pagina: "BBC News Article",
    favicon_url: "https://www.bbc.com/favicon.ico",
    created_at: "2024-01-12T18:00:00Z",
    detalhes: {
      traducao_completa: "Vai ficar tudo bem, não se preocupe com isso",
      explicacao: "'Gonna' é a contração informal de 'going to', muito usada em inglês falado. 'Alright' é uma forma coloquial de 'all right'. A expressão 'don't worry about it' é uma forma comum de tranquilizar alguém.",
      fatias_traducoes: {
        "It's gonna be": "Vai ser/ficar",
        "alright": "tudo bem",
        "don't worry": "não se preocupe",
        "about it": "com isso"
      }
    }
  },
  {
    id: 5,
    conteudo: "defer file.Close()",
    idioma: "go",
    grupo: "Go Lang",
    titulo_pagina: "Go by Example",
    favicon_url: "https://gobyexample.com/favicon.ico",
    created_at: "2024-01-11T14:30:00Z",
    detalhes: {
      traducao_completa: "Adiar o fechamento do arquivo",
      explicacao: "'defer' é uma palavra-chave única em Go que adia a execução de uma função até que a função atual retorne. É comumente usado para garantir que recursos como arquivos sejam fechados corretamente.",
      fatias_traducoes: {
        "defer": "adiar execução",
        "file.Close()": "fechar arquivo"
      }
    }
  }
];

const grupos = [
  { nome: "Inglês", cor: "#22d3ee", count: 2 },
  { nome: "Go Lang", cor: "#10b981", count: 2 },
  { nome: "Russo", cor: "#f43f5e", count: 1 },
];

const Dashboard = () => {
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const handlePhraseClick = (phrase: Phrase) => {
    setSelectedPhrase(phrase);
    setSheetOpen(true);
  };

  const filteredPhrases = activeGroup
    ? mockPhrases.filter((p) => p.grupo === activeGroup)
    : mockPhrases;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          grupos={grupos}
          activeGroup={activeGroup}
          onGroupSelect={setActiveGroup}
          totalPhrases={mockPhrases.length}
        />

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4 md:hidden">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {activeGroup || "Todas as Frases"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredPhrases.length} frase{filteredPhrases.length !== 1 ? "s" : ""} capturada{filteredPhrases.length !== 1 ? "s" : ""}
              </p>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            <PhraseFeed phrases={filteredPhrases} onPhraseClick={handlePhraseClick} />
          </div>
        </main>

        <PhraseDetailSheet
          phrase={selectedPhrase}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
