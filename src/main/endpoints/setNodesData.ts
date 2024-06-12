import { NodeInfo } from "@/types";
import { createEndpoint } from "../utils/createEndpoint";
import { TOLGEE_NODE_INFO } from "@/constants";

export type SetNodesDataProps = {
  nodes: NodeInfo[];
  syncName?: boolean;
};

export const setNodesDataEndpoint = createEndpoint<SetNodesDataProps, void>(
  "SET_NODES_DATA",
  async ({ nodes, syncName }) => {
    for (const nodeInfo of nodes) {
      const node = figma.getNodeById(nodeInfo.id);

      node?.setPluginData(
        TOLGEE_NODE_INFO,
        JSON.stringify({
          key: nodeInfo.key,
          ns: nodeInfo.ns,
          connected: nodeInfo.connected,
        })
      );

      if (syncName && node) {
        node.name = nodeInfo.name;
      }
    }
  }
);
