import { useState } from "react";
import { cn } from "@/lib/utils";
import { PenLine, ArrowRight, Check, X, Sparkles } from "lucide-react";

interface TranslationQuestion {
  id: number;
  type: "translate" | "form-sentence";
  prompt: string;
  answer: string;
  options?: string[];
  hint?: string;
}

const MOCK_QUESTIONS: TranslationQuestion[] = [
  {
    id: 1,
    type: "translate",
    prompt: "O gato está dormindo no sofá.",
    answer: "The cat is sleeping on the couch.",
    hint: "Sujeito + verbo + preposição",
  },
  {
    id: 2,
    type: "translate",
    prompt: "Eu preciso comprar comida no mercado amanhã.",
    answer: "I need to buy food at the market tomorrow.",
    hint: "Sujeito + verbo + objeto + lugar + tempo",
  },
  {
    id: 3,
    type: "form-sentence",
    prompt: "Forme uma frase usando as palavras abaixo:",
    answer: "She has been studying English for three years.",
    options: ["years", "She", "studying", "for", "English", "three", "has", "been"],
  },
];

interface Props {
  onNext: (data: { writingScore: number }) => void;
}

export function OnboardingWritingTest({ onNext }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [input, setInput] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const question = MOCK_QUESTIONS[currentQ];
  const totalQuestions = MOCK_QUESTIONS.length;

  const checkAnswer = () => {
    let userAnswer: string;

    if (question.type === "form-sentence") {
      userAnswer = selectedWords.join(" ");
    } else {
      userAnswer = input.trim();
    }

    const correct =
      userAnswer.toLowerCase().replace(/[.!?,]/g, "").trim() ===
      question.answer.toLowerCase().replace(/[.!?,]/g, "").trim();

    setIsCorrect(correct);
    setShowFeedback(true);
    setResults((prev) => [...prev, correct]);

    setTimeout(() => {
      if (currentQ < totalQuestions - 1) {
        setCurrentQ((q) => q + 1);
        setInput("");
        setSelectedWords([]);
        setShowFeedback(false);
      } else {
        const score = Math.round(
          (([...results, correct].filter(Boolean).length / totalQuestions) * 100)
        );
        onNext({ writingScore: score });
      }
    }, 1800);
  };

  const toggleWord = (word: string, index: number) => {
    const key = `${word}-${index}`;
    if (selectedWords.includes(key)) {
      setSelectedWords((prev) => prev.filter((w) => w !== key));
    } else {
      setSelectedWords((prev) => [...prev, key]);
    }
  };

  const getDisplayWords = () => selectedWords.map((w) => w.split("-")[0]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
          <PenLine className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Teste de <span className="text-amber-400">Escrita</span>
        </h2>
        <p className="text-sm text-muted-foreground/70">Vamos ver seu nível de tradução e formação de frases</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {MOCK_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              i < currentQ
                ? results[i] ? "bg-emerald-500" : "bg-red-500/60"
                : i === currentQ
                  ? "bg-amber-400"
                  : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* Question card */}
      <div
        className={cn(
          "rounded-2xl border p-6 transition-all duration-500",
          showFeedback && isCorrect && "border-emerald-500/30 bg-emerald-500/5",
          showFeedback && !isCorrect && "border-red-500/30 bg-red-500/5",
          !showFeedback && "border-white/5 bg-card/20 backdrop-blur-md"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            {question.type === "translate" ? "Tradução" : "Formação de frase"}
          </span>
          <span className="text-xs text-muted-foreground/40">
            {currentQ + 1}/{totalQuestions}
          </span>
        </div>

        {/* Prompt */}
        <p className="text-lg font-medium text-foreground leading-relaxed mb-6">
          {question.prompt}
        </p>

        {question.hint && !showFeedback && (
          <p className="text-xs text-muted-foreground/40 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {question.hint}
          </p>
        )}

        {/* Input area */}
        {question.type === "translate" && !showFeedback && (
          <div className="space-y-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite a tradução em inglês..."
              className="w-full h-24 bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/30 resize-none focus:outline-none focus:border-amber-500/30 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) checkAnswer();
                }
              }}
            />
          </div>
        )}

        {/* Word selector */}
        {question.type === "form-sentence" && !showFeedback && (
          <div className="space-y-4">
            {/* Formed sentence display */}
            <div className="min-h-[48px] bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground">
              {getDisplayWords().length > 0 ? (
                <span>{getDisplayWords().join(" ")}</span>
              ) : (
                <span className="text-muted-foreground/30">Toque nas palavras para formar a frase...</span>
              )}
            </div>

            {/* Word buttons */}
            <div className="flex flex-wrap gap-2">
              {question.options?.map((word, i) => {
                const key = `${word}-${i}`;
                const isSelected = selectedWords.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleWord(word, i)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 scale-95 opacity-50"
                        : "bg-white/5 text-foreground/80 border border-white/10 hover:bg-white/10 hover:scale-[1.05]"
                    )}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isCorrect ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-5 h-5" />
                <span className="font-bold">Correto!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-400">
                  <X className="w-5 h-5" />
                  <span className="font-bold">Não é bem assim...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Resposta correta: <strong className="text-foreground">{question.answer}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      {!showFeedback && (
        <button
          onClick={checkAnswer}
          disabled={question.type === "translate" ? !input.trim() : selectedWords.length === 0}
          className={cn(
            "w-full py-4 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2",
            (question.type === "translate" ? input.trim() : selectedWords.length > 0)
              ? "bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
              : "bg-white/5 border border-white/5 text-muted-foreground/40 cursor-not-allowed"
          )}
        >
          Verificar
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
