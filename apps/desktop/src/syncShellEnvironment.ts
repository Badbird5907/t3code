import {
  readEnvironmentFromLoginShell,
  resolveWindowsEnvironment,
  resolveLoginShell,
  ShellEnvironmentReader,
  WindowsShellEnvironmentReader,
  type CommandAvailabilityOptions,
} from "@t3tools/shared/shell";

type WindowsCommandAvailabilityChecker = (
  command: string,
  options?: CommandAvailabilityOptions,
) => boolean;

export function syncShellEnvironment(
  env: NodeJS.ProcessEnv = process.env,
  options: {
    platform?: NodeJS.Platform;
    readEnvironment?: ShellEnvironmentReader;
    readWindowsEnvironment?: WindowsShellEnvironmentReader;
    isWindowsCommandAvailable?: WindowsCommandAvailabilityChecker;
  } = {},
): void {
  const platform = options.platform ?? process.platform;

  try {
    if (platform === "win32") {
      const repairedEnvironment = resolveWindowsEnvironment(env, {
        ...(options.readWindowsEnvironment
          ? { readEnvironment: options.readWindowsEnvironment }
          : {}),
        ...(options.isWindowsCommandAvailable
          ? { commandAvailable: options.isWindowsCommandAvailable }
          : {}),
      });
      for (const [key, value] of Object.entries(repairedEnvironment)) {
        if (value !== undefined) {
          env[key] = value;
        }
      }
      return;
    }

    if (platform !== "darwin" && platform !== "linux") return;

    const shell = resolveLoginShell(platform, env.SHELL);
    if (!shell) return;

    const shellEnvironment = (options.readEnvironment ?? readEnvironmentFromLoginShell)(shell, [
      "PATH",
      "SSH_AUTH_SOCK",
    ]);

    if (shellEnvironment.PATH) {
      env.PATH = shellEnvironment.PATH;
    }

    if (!env.SSH_AUTH_SOCK && shellEnvironment.SSH_AUTH_SOCK) {
      env.SSH_AUTH_SOCK = shellEnvironment.SSH_AUTH_SOCK;
    }
  } catch {
    // Keep inherited environment if shell lookup fails.
  }
}
