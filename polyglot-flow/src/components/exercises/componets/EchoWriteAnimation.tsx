/**
 * EchoWriteAnimation — Audio waveform bars + typing simulation.
 * Pure CSS animations for the bars and cursor, no JS needed.
 */
const EchoWriteAnimation = () => {
  const bars = 10;
  const barDelays = [
    { dur: "0.8s", delay: "-0.2s" },
    { dur: "1.1s", delay: "-0.4s" },
    { dur: "0.9s", delay: "-0.7s" },
    { dur: "1.3s", delay: "-0.1s" },
    { dur: "0.7s", delay: "-0.5s" },
    { dur: "1.2s", delay: "-0.3s" },
    { dur: "1.0s", delay: "-0.6s" },
    { dur: "1.4s", delay: "-0.2s" },
    { dur: "0.9s", delay: "-0.4s" },
    { dur: "1.1s", delay: "-0.1s" },
  ];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none select-none">
      {/* Header */}
      <div className="flex items-center gap-2" style={{ color: "#00ffff" }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: "#00ffff",
            boxShadow: "0 0 8px rgba(0,255,255,0.6)",
            animation: "ew-pulse 1.5s infinite",
          }}
        />
        <span className="text-[10px] uppercase tracking-[2px]">Live Audio</span>
      </div>

      {/* Waveform */}
      <div className="flex items-center justify-center gap-[3px] h-12">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "3px",
              height: "12px",
              background: "#00ffff",
              boxShadow: "0 0 8px rgba(0,255,255,0.4)",
              animation: `ew-wave ${barDelays[i]?.dur || "1s"} ease-in-out infinite alternate`,
              animationDelay: barDelays[i]?.delay || "0s",
            }}
          />
        ))}
      </div>

      {/* Typing simulation */}
      <div className="flex items-center text-xs italic" style={{ color: "#8b949e" }}>
        <span>"I don't </span>
        <span style={{ color: "#e6edf3" }}>think we are...</span>
        <span>"</span>
        <span
          className="ml-0.5 inline-block w-[2px] h-3.5 font-bold"
          style={{
            background: "#00ffff",
            animation: "ew-blink 0.8s step-end infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes ew-wave {
          0% { height: 8px; opacity: 0.4; }
          100% { height: 40px; opacity: 1; }
        }
        @keyframes ew-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; background: #ff4b4b; box-shadow: 0 0 10px #ff4b4b; }
        }
        @keyframes ew-blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default EchoWriteAnimation;
