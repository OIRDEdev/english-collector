import { lazy, Suspense, type ComponentType } from "react";

// Lazy-load each animation to keep bundle light
const WordMemoryAnimation = lazy(() => import("./WordMemoryAnimation"));
const KeyBurstAnimation = lazy(() => import("./KeyBurstAnimation"));
const ConnectionAnimation = lazy(() => import("./ConnectionAnimation"));
const NexusConnectAnimation = lazy(() => import("./NexusConnectAnimation"));
const SentenceChainAnimation = lazy(() => import("./SentenceChainAnimation"));
const EchoWriteAnimation = lazy(() => import("./EchoWriteAnimation"));

/**
 * Maps catalog names (lowercased) to their card background animation component.
 */
const ANIMATION_MAP: Record<string, ComponentType> = {
  wordmemory: WordMemoryAnimation,
  "key burst": KeyBurstAnimation,
  key: KeyBurstAnimation,
  keyburst: KeyBurstAnimation,
  connection: ConnectionAnimation,
  "nexus connect": NexusConnectAnimation,
  nexusconnect: NexusConnectAnimation,
  chainofsentence: SentenceChainAnimation,
  sentencechain: SentenceChainAnimation,
  "echo write": EchoWriteAnimation,
  echowrite: EchoWriteAnimation,
};

/**
 * Returns the animation component for a given catalog name, or null if none exists.
 */
export const getCardAnimation = (catalogName: string): ComponentType | null => {
  return ANIMATION_MAP[catalogName.toLowerCase()] || null;
};

/**
 * Wrapper that renders the animation inside a Suspense boundary.
 */
export const CardAnimation = ({ catalogName }: { catalogName: string }) => {
  const AnimComponent = getCardAnimation(catalogName);
  if (!AnimComponent) return null;

  return (
    <Suspense fallback={null}>
      <AnimComponent />
    </Suspense>
  );
};

export default CardAnimation;
