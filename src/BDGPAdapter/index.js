import {
  ConfigurationSchema,
  readConfObject,
} from "@jbrowse/core/configuration";
import { ObservableCreate } from "@jbrowse/core/util/rxjs";
import { BaseFeatureDataAdapter, BaseArgs, BaseTextSearchAdapter, SearchScope } from "@jbrowse/core/data_adapters/BaseAdapter";
import SimpleFeature from "@jbrowse/core/util/simpleFeature";
import stringify from "json-stable-stringify";

export const configSchema = ConfigurationSchema(
  "BDGPAdapter",
  {
    source: {
      type: "string",
      description: "the track source",
      defaultValue: "",
    },
    track: {
      type: "string",
      description: "the track to select data from",
      defaultValue: "",
    },
    prefix: {
      type: "string",
      description: "url prefix to use for name searches",
      defaultValue: "",
    },
  },
  { explicitlyTyped: true },
);

export class AdapterClass extends BaseFeatureDataAdapter {
  constructor(config) {
    super(config);
    this.config = config;
  }

  getFeatures(region) {
    const { assemblyName, start, end, refName } = region;
    return ObservableCreate(async observer => {
      const source = readConfObject(this.config, "source");
      const track = readConfObject(this.config, "track");
      const prefix = readConfObject(this.config, "prefix");
      try {
        if (source === 'labtrack') {
          const result = await fetch(
            `/cgi-bin/labtrack/query/data/jbrowse.pl/track/${encodeURIComponent(track)}/features/${encodeURIComponent(refName)}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          );
          if (!result.ok) {
            throw new Error(
              `Failed to fetch ${result.status} ${result.statusText}`,
            );
          }
          const data = await result.json();
          for (feature of data['features']) {
            observer.next(new SimpleFeature({
              id: feature.uniqueID,
              data: {
                ...feature,
                refName
              },
            }));
          }
          observer.complete();
        }
        else {
          throw new Error(`Unknown source parameter: ${source}`);
        }
      } catch (e) {
        observer.error(e);
      }
    });
  }

  async getRefNames() {
    const prefix = readConfObject(this.config, "prefix");
    const result = await fetch(`${prefix}/jbrowse/${encodeURIComponent(searchScope.assemblyName)}/refSeqs.json`);
    if (!result.ok) {
      throw new Error(
        `Failed to fetch ${result.status} ${result.statusText}`,
      );
    }
    const results = await result.json();
    const refnames = results.map(entry => {
      return entry.name;
    });
    return refnames;
  }

  async searchIndex(args, searchScope) {
    const prefix = readConfObject(this.config, "prefix");
    const result = await fetch(
            `${prefix}/jbrowse/${encodeURIComponent(searchScope.assemblyName)}/name?${args.searchType==='prefix'?'startswith':'equals'}=${encodeURIComponent(args.queryString)}`
    );
    if (!result.ok) {
      throw new Error(
        `Failed to fetch ${result.status} ${result.statusText}`,
      );
    }
    const results = await result.json();
    const locstrings = results.map(entry => {
      return new LocStringResult({
        locString: `${entry.location.ref}:${entry.location.start}-${entry.location.end}`,
        label: entry.name,
      })
    }).slice(0, args.limit? args.limit : undefined);
    return locstrings;
  }
  freeResources() {}
}
