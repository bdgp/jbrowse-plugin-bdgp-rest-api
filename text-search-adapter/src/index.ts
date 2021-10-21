import TextSearchAdapterType from "@jbrowse/core/pluggableElementTypes/TextSearchAdapterType";
import Plugin from "@jbrowse/core/Plugin";
import PluginManager from "@jbrowse/core/PluginManager";
import { AdapterClass, configSchema } from "./BDGPTextSearchAdapter";

export default class extends Plugin {
  name = "BDGPTextSearchPlugin";

  install(pluginManager: PluginManager) {
    pluginManager.addTextSearchAdapterType(
      () =>
        new TextSearchAdapterType({
          name: "BDGPTextSearchAdapter",
          configSchema: configSchema,
          AdapterClass: AdapterClass,
          description: "BDGP text search adapter",
        }),
    );
  }
}
