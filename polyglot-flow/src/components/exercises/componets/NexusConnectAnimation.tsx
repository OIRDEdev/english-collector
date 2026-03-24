/**
 * NexusConnectAnimation — Similar words connector with slot-machine style cycling.
 * Two single words on the sides, a central hub cycles through similar/synonym words.
 * Pure CSS keyframe animations, zero JS timers.
 */
const NexusConnectAnimation = () => {
  const leftWord = "Happy";
  const rightWord = "Sad";
  const words = ["Joyful", "Content", "Pleased", "Glad", "Cheerful", "Joyful"];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none px-4">
      {/* Left word */}
      <div
        className="text-xs font-bold uppercase tracking-wider text-center px-3 py-2 rounded-xl shrink-0"
        style={{
          color: "#c084fc",
          background: "rgba(192,132,252,0.08)",
          border: "1px solid rgba(192,132,252,0.25)",
        }}
      >
        {leftWord}
      </div>

      {/* Left line */}
      <div
        className="flex-1 h-[1px] mx-2"
        style={{
          background: "linear-gradient(90deg, transparent, #c084fc, transparent)",
          opacity: 0.3,
        }}
      />

      {/* Central hub */}
      <div
        className="relative overflow-hidden flex items-center justify-center shrink-0"
        style={{
          width: "100px",
          height: "34px",
          border: "1.5px solid #c084fc",
          borderRadius: "50px",
          background: "rgba(192,132,252,0.05)",
          boxShadow: "0 0 12px rgba(192,132,252,0.2)",
        }}
      >
        <div
          className="absolute flex flex-col items-center"
          style={{
            animation: "nexus-slot 5s cubic-bezier(0.65,0,0.35,1) infinite",
          }}
        >
          {words.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[11px] font-extrabold uppercase tracking-wide"
              style={{ height: "34px", color: "#c084fc" }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Glow pulse */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 20px #c084fc",
            animation: "nexus-glow 5s infinite",
          }}
        />
      </div>

      {/* Right line */}
      <div
        className="flex-1 h-[1px] mx-2"
        style={{
          background: "linear-gradient(90deg, transparent, #c084fc, transparent)",
          opacity: 0.3,
        }}
      />

      {/* Right word */}
      <div
        className="text-xs font-bold uppercase tracking-wider text-center px-3 py-2 rounded-xl shrink-0"
        style={{
          color: "#f472b6",
          background: "rgba(244,114,182,0.08)",
          border: "1px solid rgba(244,114,182,0.25)",
        }}
      >
        {rightWord}
      </div>

      <style>{`
        @keyframes nexus-slot {
          0%,10% { transform: translateY(20px); }
          20% { transform: translateY(-40px); }
          30% { transform: translateY(-80px); }
          40% { transform: translateY(-120px); }
          50%,90% { transform: translateY(-160px); opacity: 1; }
          100% { transform: translateY(-200px); opacity: 0; }
        }
        @keyframes nexus-glow {
          0%,45% { opacity: 0; }
          50%,85% { opacity: 0.35; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default NexusConnectAnimation;
