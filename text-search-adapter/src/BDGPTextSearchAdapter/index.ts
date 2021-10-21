import {
  ConfigurationSchema,
  readConfObject,
} from "@jbrowse/core/configuration";
import {
  BaseAdapter,
  BaseArgs,
  BaseTextSearchAdapter,
} from "@jbrowse/core/data_adapters/BaseAdapter";
import { AnyConfigurationModel } from "@jbrowse/core/configuration/configurationSchema";
import BaseResult from "@jbrowse/core/TextSearch/BaseResults";
import { getSubAdapterType } from "@jbrowse/core/data_adapters/dataAdapterCache";
import PluginManager from "@jbrowse/core/PluginManager";

export const configSchema = ConfigurationSchema(
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
      description: "Assembly name to use for getRefNames",
      defaultValue: "",
    },
    tracks: {
      type: "stringArray",
      defaultValue: [],
      description: "List of tracks covered by text search adapter",
    },
  },
  { explicitlyTyped: true, explicitIdentifier: "textSearchAdapterId" },
);

export class AdapterClass extends BaseAdapter implements BaseTextSearchAdapter {
  config: AnyConfigurationModel;

  constructor(
    config: AnyConfigurationModel,
    getSubAdapter?: getSubAdapterType,
    pluginManager?: PluginManager,
  ) {
    super(config, getSubAdapter, pluginManager);
    this.config = config;
  }

  async searchIndex(args: BaseArgs): Promise<BaseResult[]> {
    const prefix = readConfObject(this.config, "prefix");
    const assemblyName = readConfObject(this.config, "assemblyName");
    const tracks = readConfObject(this.config, "tracks");
    const result = await fetch(
      `${prefix}/jbrowse/${encodeURIComponent(assemblyName)}/name?${
        args.searchType === "prefix" ? "startswith" : "equals"
      }=${encodeURIComponent(args.queryString)}${
        tracks
          ? `&tracks=${encodeURIComponent(
              tracks
                .map((t: String) => `"${t.replaceAll(/"/g, '""')}"`)
                .join(","),
            )}`
          : ""
      }`,
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
