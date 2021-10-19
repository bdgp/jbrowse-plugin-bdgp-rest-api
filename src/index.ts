import AdapterType from "@jbrowse/core/pluggableElementTypes/AdapterType";
import Plugin from "@jbrowse/core/Plugin";
import {
  AdapterClass,
  configSchema,
  SearchAdapterClass,
  searchConfigSchema,
} from "./BDGPAdapter";
import { version } from "../package.json";

export default class BDGPPlugin extends Plugin {
  name = "BDGPPlugin";
  version = version;
  install(pluginManager: any) {
    pluginManager.addAdapterType(
      () =>
        new AdapterType({
          name: "BDGPAdapter",
          configSchema,
          AdapterClass,
        }),
    );
    pluginManager.addAdapterType(
      () =>
        new AdapterType({
          name: "BDGPTextSearchAdapter",
          configSchema: searchConfigSchema,
          AdapterClass: SearchAdapterClass,
        }),
    );
  }
}
