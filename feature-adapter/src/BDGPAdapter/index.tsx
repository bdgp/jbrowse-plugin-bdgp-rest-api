import {
  ConfigurationSchema,
  readConfObject,
} from "@jbrowse/core/configuration";
import { ObservableCreate } from "@jbrowse/core/util/rxjs";
import {
  BaseFeatureDataAdapter,
} from "@jbrowse/core/data_adapters/BaseAdapter";
import SimpleFeature, { Feature } from "@jbrowse/core/util/simpleFeature";
import { AnyConfigurationModel } from "@jbrowse/core/configuration/configurationSchema";
import { BaseOptions } from "@jbrowse/core/data_adapters/BaseAdapter";
import { Region } from "@jbrowse/core/util/types";
import React from 'react';
import ReactDOMServer from 'react-dom/server';

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
          let data = undefined;
          try {
            data = await result.json();
          } catch(e) {
            console.log(e);
          }
          if (data) {
            for (const feature of data.features) {
              const a = <a target="_blank" href={feature.url}>{feature.name}</a>;
              let labtrack = "";
              try {
                labtrack = ReactDOMServer.renderToString(a);
              } catch (e) {
                console.log(e);
              }
              const attrs = {
                uniqueId: feature.uniqueID,
                name: feature.name,
                type: feature.type,
                refName: refName,
                start: feature.start,
                end: feature.end,
                strand: feature.strand,
                subfeatures: feature.subfeatures || [],
      	        labtrack,
                color: feature.color,
              };
              const sf: Feature = new SimpleFeature(attrs);
              observer.next(sf);
            }
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
