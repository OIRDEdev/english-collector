/**
 * SentenceChainAnimation — Word pills assemble into a sentence with staggered entry.
 * Pure CSS animations with incremental delays, no JS needed.
 */
const SentenceChainAnimation = () => {
  const words = ["I", "don't", "know", "yet..."];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      {/* Label */}
      <span
        className="absolute top-4 left-4 text-[8px] uppercase tracking-[2px]"
        style={{ color: "#57606f" }}
      >
        Co-op Syntax
      </span>

      {/* Word pills */}
      <div
        className="flex flex-wrap justify-center gap-2.5"
        style={{ animation: "sc-settle 0.5s ease-out 1.8s" }}
      >
        {words.map((w, i) => (
          <div
            key={i}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: "rgba(125,95,255,0.1)",
              border: "1px solid rgba(125,95,255,0.3)",
              color: "#f1f2f6",
              opacity: 0,
              transform: "translateY(15px) scale(0.8)",
              animation: `sc-assemble 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards`,
              animationDelay: `${0.2 + i * 0.3}s`,
              animationIterationCount: "infinite",
              animationDuration: `${3 + i * 0.3}s`,
            }}
          >
            {w}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes sc-assemble {
          0% { opacity: 0; transform: translateY(15px) scale(0.8); }
          15% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.9); }
        }
        @keyframes sc-settle {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default SentenceChainAnimation;
