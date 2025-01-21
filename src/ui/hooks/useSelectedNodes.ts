import {
  getSelectedNodesEndpoint,
  SelectedNodesEndpointProps,
} from "@/main/endpoints/getSelectedNodes";
import { delayed } from "@/main/utils/delayed";
import { DocumentChangeHandler, SelectionChangeHandler } from "@/types";
import { on } from "@create-figma-plugin/utilities";
import { useEffect } from "preact/hooks";
import { useQuery } from "react-query";

export const useSelectedNodes = (props: SelectedNodesEndpointProps = {}) => {
  const result = useQuery(
    [getSelectedNodesEndpoint.name],
    delayed(() => getSelectedNodesEndpoint.call(props))
  );

  useEffect(() => {
    return on<DocumentChangeHandler>("DOCUMENT_CHANGE", () => {
      result.refetch();
    });
  }, []);

  useEffect(() => {
    return on<SelectionChangeHandler>("SELECTION_CHANGE", () => {
      result.refetch();
    });
  });

  return { ...result };
};
