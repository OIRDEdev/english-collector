import { useHistoriaExercise } from "./useHistoriaExercise";
import { Button } from "@/components/ui/button";
import ReadingPhase from "./ReadingPhase";
import TextReference from "./TextReference";
import QuestionSection from "./QuestionSection";
import type { HistoriaExerciseProps } from "./types";

// ─── HistoriaExercise — Entry Point ─────────────────────────────
// Assembles sub-components; all state lives in useHistoriaExercise.

export function HistoriaExercise({ data, onComplete, onExit }: HistoriaExerciseProps) {
  const {
    phase,
    timeLeft,
    timerProgress,
    formatTime,
    questions,
    questionEntries,
    answers,
    results,
    clickTarget,
    clickedCorrect,
    selectedWordIndex,
    allAnswered,
    textRef,
    questionRefs,
    goToQuestions,
    handleAnswerChange,
    activateClickMode,
    handleTextClick,
    handleConfirmSelection,
    handleSubmit,
  } = useHistoriaExercise(data, onComplete, onExit);

  // ── Reading phase ──
  if (phase === "reading") {
    return (
      <ReadingPhase
        texto={data.texto}
        timeLeft={timeLeft}
        timerProgress={timerProgress}
        formatTime={formatTime}
        onSkip={goToQuestions}
      />
    );
  }

  // ── Questions / Results phase ──
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto p-6 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold font-mono italic tracking-tighter">
          <span className="text-white">{phase === "results" ? "RESULTADO" : "PERGUNTAS"}</span>
          <span className="text-violet-400"> DO TEXTO</span>
        </h2>
        <p className="text-muted-foreground uppercase tracking-widest text-xs font-semibold">
          {phase === "results"
            ? `${Object.values(results).filter(Boolean).length}/${questionEntries.length} corretas`
            : "Responda com base no que você leu"}
        </p>
      </div>

      {/* Text reference panel — memoized */}
      <TextReference
        texto={data.texto}
        questions={questions}
        clickTarget={clickTarget}
        clickedCorrect={clickedCorrect}
        selectedWordIndex={selectedWordIndex}
        onWordClick={handleTextClick}
        onConfirm={handleConfirmSelection}
        containerRef={textRef}
      />

      {/* Question list — memoized */}
      <QuestionSection
        questionEntries={questionEntries}
        phase={phase}
        answers={answers}
        results={results}
        clickTarget={clickTarget}
        clickedCorrect={clickedCorrect}
        questionRefs={questionRefs}
        onAnswerChange={handleAnswerChange}
        onActivateClick={activateClickMode}
      />

      {/* Submit */}
      {phase === "questions" && (
        <Button
          size="lg"
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold tracking-wide"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          VERIFICAR RESPOSTAS
        </Button>
      )}
    </div>
  );
}
