export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerDbStartupCheck } = await import("./instrumentation-node");

    registerDbStartupCheck("admin-startup");
  }
}
