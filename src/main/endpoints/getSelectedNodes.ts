import { NodeInfo } from "@/types";
import { createEndpoint } from "../utils/createEndpoint";
import { findTextNodesInfo } from "../utils/nodeTools";

export type SelectedNodesEndpointProps = {
  includeSibilings?: boolean;
};

export const getSelectedNodesEndpoint = createEndpoint<
  SelectedNodesEndpointProps,
  { items: NodeInfo[]; somethingSelected: boolean }
>("GET_SELECTED_NODES", ({ includeSibilings = false }) => {
  const somethingSelected = figma.currentPage.selection.length > 0;

  const allConnectedNodes = includeSibilings
    ? findTextNodesInfo(figma.currentPage.children).filter(
        (item) => item.connected
      )
    : [];

  return {
    items: findTextNodesInfo(figma.currentPage.selection).map((item) => ({
      ...item,
      sibilings: allConnectedNodes.filter(
        (connectedNode) =>
          connectedNode.key === item.key &&
          (connectedNode.ns ?? "") === (item.ns ?? "") &&
          item.id !== connectedNode.id
      ),
    })),
    somethingSelected,
  };
});
