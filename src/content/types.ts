/** Certification tracks. Klass 8 is the anchor track. */
export type Track = 'forarintyg' | 'kustskeppare' | 'klass8' | 'vhf';

export type ItemType =
  | 'mcq'
  | 'scenario'
  | 'calculation'
  | 'lantern'
  | 'buoy'
  | 'stability_diagram'
  | 'chart_question'
  | 'radar_question'
  | 'map_question'
  | 'term_card'
  | 'radio_procedure';

export type CallType = 'mayday' | 'pan-pan' | 'securite' | 'routine' | 'mob';

/** A phrase block in a radio_procedure pool — pool = requiredBlocks +
 * distractorBlocks, shuffled per attempt (see radio-procedure-builder.tsx). */
export interface RadioBlock {
  id: string;
  text: string;
}

export interface RequiredRadioBlock extends RadioBlock {
  /** 1-based position in the correct sequence. Must match the block's
   * position in the requiredBlocks array — check-content.js validates
   * this as a guard against accidental reordering during authoring. */
  order: number;
}

export interface ModuleDef {
  id: string;
  slug: string;
  titleSv: string;
  titleEn: string;
  order: number;
}

export interface TopicDef {
  id: string;
  moduleId: string;
  slug: string;
  titleSv: string;
  titleEn: string;
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

/**
 * One drillable question. Correctness lives on each option (`isCorrect`) —
 * never rely on option order; options are shuffled per attempt at render.
 */
export interface Item {
  id: string;
  topicId: string;
  tracks: Track[];
  type: ItemType;
  /** Type-specific data, e.g. a LanternScene for type 'lantern'. */
  payload?: unknown;
  options: Option[];
  explanationSv: string;
  explanationEn?: string;
  /** Relative path under assets/content-images/ for image-based items. */
  imageAsset?: string;
  /** Seam for the future theory reader — not rendered yet. */
  theoryAnchor?: string;
  /** False until a human has signed off on the item. */
  authorReviewed: boolean;
  /** True when conversion required guessing — see needsReviewNote. */
  needsReview?: boolean;
  /** Short note on what is uncertain, for the focused review pass. */
  needsReviewNote?: string | null;

  // --- map_question only (no in-app chart rendering — see MapChartRef) ---
  chartRef?: MapChartRef;
  /** Task text for a map_question, using the chart's own printed labels. */
  instructions?: string;
  answerMode?: 'numeric_tolerance' | 'mcq';
  /** Present when answerMode is 'numeric_tolerance'; options[] unused then. */
  answer?: MapAnswer;

  // --- term_card only — a flashcard, not a graded question. The back of
  // the card reuses explanationSv/explanationEn as its definition text
  // rather than duplicating a parallel field; options[] unused. ---
  /** Front of the card. */
  termSv?: string;
  /** Front of the card in English, if the term has a clean equivalent. */
  termEn?: string;

  // --- radio_procedure only — tap-to-order VHF call construction. No
  // payload/options; the task text is `scenario` (see questionText()).
  // Grading and per-attempt block-pool shuffling live in
  // src/lib/radio-procedure.ts and the drill screen, not here. ---
  callType?: CallType;
  scenario?: string;
  vesselName?: string;
  /** The correct message, in order. The pool shown to the student is this
   * plus distractorBlocks, shuffled. */
  requiredBlocks?: RequiredRadioBlock[];
  /** Plausible-but-wrong inclusions — wrong call-type prefix, irrelevant
   * detail, a real mistake a student might make. Never in the pool
   * without at least one being a genuine wrong-prefix confusion. */
  distractorBlocks?: RadioBlock[];
}

/** Identifies the physical paper chart a map_question requires. Never
 * rendered — see the copyright note in content/AUTHORING.md. */
export interface MapChartRef {
  chart: 'SE61' | 'SE93';
  /** Optional printing/edition note, if the course specifies one. */
  edition?: string | null;
}

interface MapAnswerScalar {
  kind: 'bearing' | 'distance' | 'depth';
  expected: number;
  /** Display unit — informational; the UI derives its own label from `kind`. */
  unit: string;
  tolerance: number;
}

interface MapAnswerPosition {
  kind: 'position';
  expected: { lat: number; lon: number };
  unit: string;
  /** Acceptance radius in meters (great-circle distance). */
  tolerance: number;
}

export type MapAnswer = MapAnswerScalar | MapAnswerPosition;

/** Night-view light picture rendered by LanternDiagram. */
export interface LanternScene {
  /** Lights positioned in a 100 × 60 field; y grows downward. */
  lights: {
    color: 'white' | 'red' | 'green' | 'yellow' | 'blue';
    x: number;
    y: number;
    /**
     * Standard light-characteristic notation, e.g. "Fl(2) 6s" — see
     * src/lantern/characteristics.ts. When present, this light blinks its
     * real rhythm instead of staying always on. Omit for the ordinary
     * vessel light-picture items, where lights are simply lit or not.
     */
    characteristic?: string;
  }[];
  /** Optional faint hull silhouette beneath the lights. */
  hull?: 'none' | 'silhouette';
  /** Short caption shown under the diagram, e.g. viewing aspect. */
  captionSv?: string;
}

/** Daytime buoy picture rendered by BuoyDiagram. */
export interface BuoyScene {
  /** Body colors top→bottom (or left→right for vertical stripes). */
  colors: ('red' | 'green' | 'yellow' | 'black' | 'white')[];
  pattern?: 'bands' | 'vertical-stripes';
  topmark?:
    | 'cones-up'
    | 'cones-down'
    | 'cones-base-to-base'
    | 'cones-point-to-point'
    | 'spheres-2'
    | 'sphere-red'
    | 'x-yellow'
    | 'cone-up-green'
    | 'can-red'
    | null;
  captionSv?: string;
}

/** Hull cross-section rendered by StabilityDiagram. */
export interface StabilityScene {
  variant: 'upright' | 'heeled';
  /** Which of K/B/G/M to mark; defaults to all four. */
  markPoints?: ('K' | 'B' | 'G' | 'M')[];
  captionSv?: string;
}

export interface TopicFile {
  topicId: string;
  items: Item[];
}
