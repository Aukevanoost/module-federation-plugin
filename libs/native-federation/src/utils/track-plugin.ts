import { Plugin } from 'esbuild';

export type TrackedPlugin = Plugin & { waitForCleanup(): Promise<void> };

export function trackPlugin(plugin: Plugin): TrackedPlugin {
  let cleanupResolver: (() => void) | null = null;
  const cleanupPromise = new Promise<void>((resolve) => {
    cleanupResolver = resolve;
  });

  return {
    name: plugin.name,
    async setup(build) {
      const originalOnDispose = build.onDispose.bind(build);
      build.onDispose = (callback) => {
        originalOnDispose(() => {
          callback();

          if (cleanupResolver) {
            cleanupResolver();
            cleanupResolver = null;
          }
        });
      };

      return await plugin.setup(build);
    },

    async waitForCleanup() {
      await cleanupPromise;
    },
  };
}
