import { NodeInfo } from "@/types";
import { createEndpoint } from "../utils/createEndpoint";
import { findTextNodesInfo } from "../utils/nodeTools";

export type ConnectedNodesProps = {
  ignoreSelection: boolean;
  useNameAsDefaultKey?: boolean;
};

export const getConnectedNodesEndpoint = createEndpoint<
  ConnectedNodesProps,
  {
    items: NodeInfo[];
    basedOnSelection: boolean;
    useNameAsDefaultKey?: boolean;
  }
>("GET_CONNECTED_NODES", async ({ ignoreSelection, useNameAsDefaultKey }) => {
  const basedOnSelection =
    !ignoreSelection && figma.currentPage.selection.length > 0;
  const items = basedOnSelection
    ? figma.currentPage.selection
    : figma.currentPage.children;
  return {
    items: findTextNodesInfo(items, { useNameAsDefaultKey }).filter(
      ({ key }) => key
    ),
    basedOnSelection,
  };
});
