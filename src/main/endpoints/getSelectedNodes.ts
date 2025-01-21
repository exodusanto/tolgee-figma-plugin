import { NodeInfo } from "@/types";
import { createEndpoint } from "../utils/createEndpoint";
import { findTextNodesInfo } from "../utils/nodeTools";

export type SelectedNodesEndpointProps = {
  currentPageNodes?: NodeInfo[];
};

export const getSelectedNodesEndpoint = createEndpoint<
  SelectedNodesEndpointProps,
  { items: NodeInfo[]; somethingSelected: boolean }
>("GET_SELECTED_NODES", ({ currentPageNodes }) => {
  const somethingSelected = figma.currentPage.selection.length > 0;

  return {
    items: findTextNodesInfo(figma.currentPage.selection).map((item) => ({
      ...item,
      sibilings: currentPageNodes?.filter(
        (connectedNode) =>
          connectedNode.key === item.key &&
          (connectedNode.ns ?? "") === (item.ns ?? "") &&
          item.id !== connectedNode.id
      ),
    })),
    somethingSelected,
  };
});
