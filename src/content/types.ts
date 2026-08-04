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
  | 'radar_question';

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
}

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
