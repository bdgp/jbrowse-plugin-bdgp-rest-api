import {
  ConfigurationSchema,
  readConfObject,
} from "@jbrowse/core/configuration";
import { ObservableCreate } from "@jbrowse/core/util/rxjs";
import {
  BaseFeatureDataAdapter,
  BaseArgs,
  BaseAdapter,
  BaseTextSearchAdapter,
} from "@jbrowse/core/data_adapters/BaseAdapter";
import SimpleFeature, { Feature } from "@jbrowse/core/util/simpleFeature";
import { AnyConfigurationModel } from "@jbrowse/core/configuration/configurationSchema";
import { BaseOptions } from "@jbrowse/core/data_adapters/BaseAdapter";
import { Region } from "@jbrowse/core/util/types";
import BaseResult from "@jbrowse/core/TextSearch/BaseResults";

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
    assemblyName: {
      type: "string",
      description: "Assembly name to use for getRefNames",
      defaultValue: "",
    },
  },
  { explicitlyTyped: true },
);

export const searchConfigSchema = ConfigurationSchema(
  "BDGPTextSearchAdapter",
  {
    prefix: {
      type: "string",
      description: "url prefix to use for name searches",
      defaultValue: "",
    },
    assemblyNames: {
      type: "stringArray",
      defaultValue: [],
      description: "List of assemblies covered by text search adapter",
    },
    assemblyName: {
      type: "string",
      defaultValue: "",
      description: "Assembly covered by text search adapter",
    },
  },
  { explicitlyTyped: true, explicitIdentifier: "textSearchAdapterId" },
);

export class AdapterClass extends BaseFeatureDataAdapter {
  config: AnyConfigurationModel;

  constructor(config: AnyConfigurationModel) {
    super(config);
    this.config = config;
  }

  public getFeatures(region: Region, _?: BaseOptions) {
    const { assemblyName, start, end, refName } = region;
    const source = readConfObject(this.config, "source");
    const track = readConfObject(this.config, "track");
    return ObservableCreate<Feature>(async observer => {
      try {
        if (source === "labtrack") {
          const result = await fetch(
            `/cgi-bin/labtrack/query/data/jbrowse.pl/track/${encodeURIComponent(
              track,
            )}/features/${encodeURIComponent(
              refName,
            )}?assemblyName=${encodeURIComponent(
              assemblyName,
            )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(
              end,
            )}`,
          );
          if (!result.ok) {
            throw new Error(
              `Failed to fetch ${result.status} ${result.statusText}`,
            );
          }
          const data = await result.json();
          for (const feature of data.features) {
            const div = document.createElement("div");
            const a = document.createElement("a");
            a.setAttribute("href", feature.url);
            const text = document.createTextNode(feature.name);
            a.appendChild(text);
            div.appendChild(a);
            const attrs = {
              uniqueId: feature.uniqueID,
              name: feature.name,
              type: feature.type,
              refName: refName,
              start: feature.start,
              end: feature.end,
              strand: feature.strand,
              subfeatures: feature.subfeatures || [],
              color: feature.color,
              url: feature.url,
              "Labtrack Link": div.innerHTML,
            };
            const sf: Feature = new SimpleFeature(attrs);
            observer.next(sf);
          }
          observer.complete();
        } else {
          throw new Error(`Unknown source parameter: ${source}`);
        }
      } catch (e) {
        observer.error(e);
      }
    });
  }

  async getRefNames() {
    const prefix = readConfObject(this.config, "prefix");
    const assemblyName = readConfObject(this.config, "assemblyName");
    const result = await fetch(
      `${prefix}/jbrowse/${encodeURIComponent(assemblyName)}/refSeqs.json`,
    );
    if (!result.ok) {
      throw new Error(`Failed to fetch ${result.status} ${result.statusText}`);
    }
    const results = await result.json();
    const refnames = results.map((entry: { name: any }) => {
      return entry.name;
    });
    return refnames;
  }

  freeResources() {}
}

export class SearchAdapterClass extends BaseAdapter
  implements BaseTextSearchAdapter {
  config: AnyConfigurationModel;
  constructor(config: AnyConfigurationModel) {
    super(config);
    this.config = config;
  }

  async searchIndex(args: BaseArgs): Promise<BaseResult[]> {
    const prefix = readConfObject(this.config, "prefix");
    const assemblyName = readConfObject(this.config, "assemblyName");
    const result = await fetch(
      `${prefix}/jbrowse/${encodeURIComponent(assemblyName)}/name?${
        args.searchType === "prefix" ? "startswith" : "equals"
      }=${encodeURIComponent(args.queryString)}`,
    );
    if (!result.ok) {
      throw new Error(`Failed to fetch ${result.status} ${result.statusText}`);
    }
    const results = await result.json();
    const locstrings = results
      .map(
        (entry: {
          location: { ref: any; start: any; end: any };
          name: any;
        }) => {
          return new BaseResult({
            locString: `${entry.location.ref}:${entry.location.start}-${entry.location.end}`,
            label: entry.name,
          });
        },
      )
      .slice(0, args.limit ? args.limit : undefined);
    return locstrings;
  }
  freeResources() {}
}
