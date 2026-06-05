/**
 * Share render orchestrator — maps data → Satori JSX element.
 * All imports are static so the edge bundler can tree-shake.
 */

import { T01_Summary } from "@/components/share/T01_Summary";
import { T02_Position } from "@/components/share/T02_Position";
import { T03_Match } from "@/components/share/T03_Match";
import { T04_Achievement } from "@/components/share/T04_Achievement";
import type { ShareData, ShareFormat } from "./templates";
import type { ReactElement } from "react";

export function renderTemplate(
  data: ShareData,
  format: ShareFormat,
  origin = ""
): ReactElement {
  switch (data.template) {
    case "summary":
      return T01_Summary({ data, format }) as ReactElement;
    case "position":
      return T02_Position({ data, format, origin }) as ReactElement;
    case "match":
      return T03_Match({ data, format, origin }) as ReactElement;
    case "achievement":
      return T04_Achievement({ data, format }) as ReactElement;
  }
}
