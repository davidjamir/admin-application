import React, { useState, useEffect } from "react"

const TECH_LINES = [
  "INITIALIZING_CORE_HANDSHAKE...",
  "ESTABLISHING_ENCRYPTED_TUNNEL...",
  "VERIFYING_REGISTRY_INTEGRITY...",
  "SYNCHRONIZING_ASSET_METADATA...",
  "PULLING_SECURE_CREDENTIALS...",
  "REPLYING_TO_CHALLENGE_NODE...",
  "VALIDATING_RSA_4096_BITMAP...",
  "SESSION_TOKEN_GENERATED: 0x8F2A...",
  "BYPASSING_LATENCY_BARRIERS...",
  "READY_FOR_PROVISIONING."
];

export const Terminal = () => {
  const [lines, setLines] = useState<string[]>([
    "BOOTING SYSTEM KERNEL v8.2.4...",
    "NODE_ID: 7FORGE-SOC-NORTH-01",
    "DECRYPTION_MODULE: LOADED",
    "CORE_STABILITY: 99.99%",
  ]);
  const [currentLine, setCurrentLine] = useState("");
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    let charIndex = 0;
    const lineToType = TECH_LINES[lineIndex];
    
    const typingInterval = setInterval(() => {
      if (charIndex < lineToType.length) {
        setCurrentLine(lineToType.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        const timeout = setTimeout(() => {
          setLines(prev => [...prev.slice(-6), lineToType]);
          setCurrentLine("");
          setLineIndex(prev => (prev + 1) % TECH_LINES.length);
        }, 800);
        return () => clearTimeout(timeout);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [lineIndex]);

  return (
    <div className="bg-[#0a0a0a] dark:bg-black/40 rounded-2xl p-5 font-mono text-[10px] text-emerald-400/90 border border-emerald-500/20 shadow-2xl overflow-hidden h-48 flex flex-col justify-end">
      {lines.map((line, i) => (
        <div key={`static-${i}`} className="mb-1 font-bold tracking-tight opacity-70 text-left">
          <span className="text-blue-500 mr-2">➜</span>
          {line}
        </div>
      ))}
      <div className="mb-1 font-bold tracking-tight text-left">
        <span className="text-blue-500 mr-2">➜</span>
        {currentLine}
        <span className="inline-block w-2 h-3.5 bg-emerald-500 animate-pulse ml-1 align-middle" />
      </div>
    </div>
  );
};
