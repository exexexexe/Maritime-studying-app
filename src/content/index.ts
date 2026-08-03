import type { Item, ModuleDef, TopicDef, TopicFile, Track } from './types';

/**
 * Content registry. All bundled JSON is imported statically so Metro packs it
 * into the app — content never loads from the network.
 *
 * Adding a topic file = author the JSON under content/, then register it in
 * TOPIC_FILES below. `npm run check:content` validates structure and
 * distractor quality (Phase 3).
 */

const modulesJson = require('../../content/modules.json') as {
  modules: ModuleDef[];
  topics: TopicDef[];
};

const TOPIC_FILES: TopicFile[] = [
  require('../../content/lanterns/grundlanternor.json'),
  require('../../content/lanterns/maskindrivna.json'),
  require('../../content/lanterns/segelfartyg.json'),
  require('../../content/lanterns/sarskilda-fartyg.json'),
];

export const modules: ModuleDef[] = [...modulesJson.modules].sort(
  (a, b) => a.order - b.order,
);

export const topics: TopicDef[] = modulesJson.topics;

const allItems: Item[] = TOPIC_FILES.flatMap((f) => f.items);

const itemsById = new Map(allItems.map((i) => [i.id, i]));

export function moduleBySlug(slug: string): ModuleDef | undefined {
  return modules.find((m) => m.slug === slug);
}

export function topicsForModule(moduleId: string): TopicDef[] {
  return topics.filter((t) => t.moduleId === moduleId);
}

export function itemById(id: string): Item | undefined {
  return itemsById.get(id);
}

export function itemsForModule(moduleId: string, track: Track): Item[] {
  const topicIds = new Set(topicsForModule(moduleId).map((t) => t.id));
  return allItems.filter((i) => topicIds.has(i.topicId) && i.tracks.includes(track));
}

export function itemsForTrack(track: Track): Item[] {
  return allItems.filter((i) => i.tracks.includes(track));
}

/** Question text lives in the payload so item types can extend it freely. */
export function questionText(item: Item): string {
  const p = item.payload as { questionSv?: string } | undefined;
  return p?.questionSv ?? '';
}
