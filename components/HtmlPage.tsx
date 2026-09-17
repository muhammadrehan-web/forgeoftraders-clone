"use client";

import { useEffect, useRef } from "react";

/**
 * Renders mirrored HTML as React and re-executes its <script> tags.
 * Also applies the original body classes so CSS selectors like body.home-page keep working.
 */
export function HtmlPage({
  html,
  bodyClass = "ui-finished",
}: {
  html: string;
  bodyClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.className;
    document.body.className = bodyClass;
    return () => {
      document.body.className = previous;
    };
  }, [bodyClass]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let cancelled = false;

    const runScripts = async () => {
      const scripts = Array.from(root.querySelectorAll("script"));
      for (const oldScript of scripts) {
        if (cancelled) return;
        const newScript = document.createElement("script");
        for (const { name, value } of Array.from(oldScript.attributes)) {
          newScript.setAttribute(name, value);
        }
        if (oldScript.src) {
          await new Promise<void>((resolve) => {
            newScript.onload = () => resolve();
            newScript.onerror = () => resolve();
            oldScript.parentNode?.replaceChild(newScript, oldScript);
          });
        } else {
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        }
      }
      if (!cancelled) {
        document.documentElement.classList.add("forge-react-ready");
      }
    };

    void runScripts();
    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={ref}
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
