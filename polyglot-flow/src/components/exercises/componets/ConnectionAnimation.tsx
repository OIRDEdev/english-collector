/**
 * ConnectionAnimation — Phrase connector with slot-machine style word cycling.
 * Two context phrases on the sides, a central hub cycles through connector words.
 * Pure CSS keyframe animations, zero JS timers needed.
 */
const ConnectionAnimation = () => {
  const leftPhrase = "Renewable Energy";
  const rightPhrase = "Economic Limits";
  const words = ["Therefore", "Because", "However", "Moreover", "Nevertheless", "Therefore"];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none px-3">
      {/* Left context */}
      <div
        className="text-[9px] uppercase tracking-wider text-center px-2 py-1.5 rounded-lg shrink-0"
        style={{
          color: "#888",
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed #333",
          maxWidth: "70px",
          lineHeight: "1.3",
        }}
      >
        {leftPhrase}
      </div>

      {/* Left line */}
      <div
        className="flex-1 h-[1px] mx-1"
        style={{
          background: "linear-gradient(90deg, transparent, #adff2f, transparent)",
          opacity: 0.3,
        }}
      />

      {/* Central hub */}
      <div
        className="relative overflow-hidden flex items-center justify-center shrink-0"
        style={{
          width: "110px",
          height: "34px",
          border: "1.5px solid #adff2f",
          borderRadius: "50px",
          background: "rgba(173,255,47,0.05)",
          boxShadow: "0 0 12px rgba(173,255,47,0.2)",
        }}
      >
        <div
          className="absolute flex flex-col items-center"
          style={{
            animation: "conn-slot 5s cubic-bezier(0.65,0,0.35,1) infinite",
          }}
        >
          {words.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[10px] font-extrabold uppercase tracking-wide"
              style={{
                height: "34px",
                color: "#adff2f",
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Glow pulse on correct word */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 20px #adff2f",
            animation: "conn-glow 5s infinite",
          }}
        />
      </div>

      {/* Right line */}
      <div
        className="flex-1 h-[1px] mx-1"
        style={{
          background: "linear-gradient(90deg, transparent, #adff2f, transparent)",
          opacity: 0.3,
        }}
      />

      {/* Right context */}
      <div
        className="text-[9px] uppercase tracking-wider text-center px-2 py-1.5 rounded-lg shrink-0"
        style={{
          color: "#888",
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed #333",
          maxWidth: "70px",
          lineHeight: "1.3",
        }}
      >
        {rightPhrase}
      </div>

      <style>{`
        @keyframes conn-slot {
          0%,10% { transform: translateY(20px); }
          20% { transform: translateY(-40px); }
          30% { transform: translateY(-80px); }
          40% { transform: translateY(-120px); }
          50%,90% { transform: translateY(-160px); opacity: 1; }
          100% { transform: translateY(-200px); opacity: 0; }
        }
        @keyframes conn-glow {
          0%,45% { opacity: 0; }
          50%,85% { opacity: 0.35; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ConnectionAnimation;
