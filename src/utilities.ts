import {
  EventHandler,
  emit as originalEmit,
} from "@create-figma-plugin/utilities";
export { on, once } from "@create-figma-plugin/utilities";

export const emit = <Handler extends EventHandler>(
  name: Handler["name"],
  ...args: Parameters<Handler["handler"]>
): void => {
  const iframe = document?.getElementById("plugin_iframe") as HTMLIFrameElement;
  if (iframe) {
    iframe.contentWindow!.postMessage({ pluginMessage: [name, ...args] });
  } else {
    originalEmit(name, ...args);
  }
};

export const uuidv4 = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
