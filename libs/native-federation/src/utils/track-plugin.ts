import { Plugin } from 'esbuild';

export type TrackedPlugin = {
  plugin: Plugin;
  awaitDisposal: () => Promise<void>;
};

export function trackPlugin(plugin: Plugin): TrackedPlugin {
  let cleanupResolver: (() => void) | null = null;
  const cleanupPromise = new Promise<void>((resolve) => {
    cleanupResolver = resolve;
  });

  return {
    plugin: {
      name: plugin.name,
      async setup(build) {
        const originalOnDispose = build.onDispose;
        build.onDispose = (callback) => {
          originalOnDispose.call(build, () => {
            callback();

            if (cleanupResolver) {
              cleanupResolver();
              cleanupResolver = null;
            }
          });
        };

        return await plugin.setup(build);
      },
    },
    awaitDisposal: () => cleanupPromise,
  };
}
