import { PluginOption, PluginClass } from './plugin';
import Annotate from './annotate';
import Search from './search';
import Theme from './theme';

class PluginsManager {
  private static pluginsMap: Map<string, PluginClass> = new Map();

  static get(name: string) {
    return PluginsManager.pluginsMap.get(name);
  }

  static set(name: string, cls: PluginClass) {
    PluginsManager.pluginsMap.set(name, cls);
  }

  static has(name: string) {
    return PluginsManager.pluginsMap.has(name);
  }

  static create(pluginName: string, opt: PluginOption) {
    if (!PluginsManager.has(pluginName)) {
      throw new Error('no plugin with name: ' + pluginName);
    }

    const PluginClass = PluginsManager.get(pluginName)!;

    return new PluginClass(opt);
  }
}

PluginsManager.set(Annotate.pluginName, Annotate);
PluginsManager.set(Search.pluginName, Search);
PluginsManager.set(Theme.pluginName, Theme);

export default PluginsManager;
