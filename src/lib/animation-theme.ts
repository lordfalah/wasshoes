import { flushSync } from "react-dom";

export const handleAnimationThemeToggle = async ({
  elementDiv,
  setTheme,
  theme,
}: {
  elementDiv: React.RefObject<HTMLDivElement | null>;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  theme: string | undefined;
}) => {
  /**
   * Return early if View Transition API is not supported
   * or user prefers reduced motion
   */
  if (
    !elementDiv.current ||
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    setTheme(theme === "light" ? "dark" : "light");
    return;
  }

  await document.startViewTransition(() => {
    flushSync(() => {
      setTheme(theme === "light" ? "dark" : "light");
    });
  }).ready;

  const { top, left, width, height } =
    elementDiv.current.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const right = window.innerWidth - left;
  const bottom = window.innerHeight - top;
  const maxRadius = Math.hypot(Math.max(left, right), Math.max(top, bottom));

  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${maxRadius}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 500,
      easing: "ease-in-out",
      pseudoElement: "::view-transition-new(root)",
    },
  );
};
