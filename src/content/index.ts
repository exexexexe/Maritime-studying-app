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
  require('../../content/colreg/vajningsregler.json'),
  require('../../content/colreg/ljudsignaler.json'),
  require('../../content/lanterns/grundlanternor.json'),
  require('../../content/lanterns/maskindrivna.json'),
  require('../../content/lanterns/segelfartyg.json'),
  require('../../content/lanterns/sarskilda-fartyg.json'),
  require('../../content/buoyage/sidomarkering.json'),
  require('../../content/buoyage/kardinalmarkering.json'),
  require('../../content/buoyage/fyrar-och-ljuskaraktarer.json'),
  require('../../content/navcalc/kursrattning.json'),
  require('../../content/navcalc/fart-tid-distans.json'),
  require('../../content/weather/vadersystem.json'),
  require('../../content/weather/sikt-och-prognos.json'),
  require('../../content/safety/nodsignaler.json'),
  require('../../content/safety/sakerhet-ombord.json'),
  require('../../content/stability/begrepp.json'),
  require('../../content/stability/last-och-vatskor.json'),
  require('../../content/vhf/anrop-och-rutiner.json'),
  require('../../content/vhf/dsc-och-nod.json'),
  require('../../content/radar/grunder-och-plotting.json'),
  require('../../content/radar/ekotolkning.json'),
  require('../../content/radar/installning.json'),
  require('../../content/radar/presentationslagen.json'),
  require('../../content/radar/antenn-och-puls.json'),
  require('../../content/radar/radarnavigering.json'),
  require('../../content/radar/mal-och-storningar.json'),
  require('../../content/navcalc/sjokortslasning.json'),
  require('../../content/navcalc/instrument-och-deviation.json'),
  require('../../content/navcalc/baringar-och-position.json'),
  require('../../content/lanterns/ljusbildsovningar.json'),
  require('../../content/safety/forsta-hjalpen.json'),
  require('../../content/seamanship/fortojning-och-ankring.json'),
  require('../../content/seamanship/tagvirke-och-knopar.json'),
  require('../../content/rules/miljo-och-allemansratt.json'),
  require('../../content/rules/utomlands-och-passagerare.json'),
  require('../../content/rules/sjolag-och-bemanning.json'),
  require('../../content/buoyage/ljuskaraktarer-bilder.json'),
  require('../../content/colreg/vajningsscenarier.json'),
  require('../../content/navcalc/praktisk-sjokortsnavigering.json'),
  require('../../content/buoyage/sjomarken-bilder.json'),
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

export function itemsForTopic(topicId: string, track: Track): Item[] {
  return allItems.filter((i) => i.topicId === topicId && i.tracks.includes(track));
}

export function itemsForTrack(track: Track): Item[] {
  return allItems.filter((i) => i.tracks.includes(track));
}

/** Question text lives in the payload so item types can extend it freely. */
export function questionText(item: Item): string {
  const p = item.payload as { questionSv?: string } | undefined;
  return p?.questionSv ?? '';
}
