import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useDebounce } from "use-debounce";
import {
  Button,
  Container,
  Divider,
  Modal,
  Muted,
  Text,
  Textbox,
  VerticalSpace,
} from "@create-figma-plugin/ui";

import { useGlobalActions, useGlobalState } from "@/ui/state/GlobalState";
import { TopBar } from "@/ui/components/TopBar/TopBar";
import { ActionsBottom } from "@/ui/components/ActionsBottom/ActionsBottom";
import { useApiQuery } from "@/ui/client/useQueryApi";
import { FullPageLoading } from "@/ui/components/FullPageLoading/FullPageLoading";
import { useSetNodesDataMutation } from "@/ui/hooks/useSetNodesDataMutation";
import { RouteParam } from "../routes";
import styles from "./Connect.css";
import { SearchRow } from "./SearchRow";
import { useSelectedNodes } from "@/ui/hooks/useSelectedNodes";

type Props = RouteParam<"connect">;

export const Connect = ({ node }: Props) => {
  const { setRoute } = useGlobalActions();

  const language = useGlobalState((c) => c.config?.language);

  const [search, setSearch] = useState(node.key || node.characters);

  const [debouncedSearch] = useDebounce(search, 1000);

  const translationsLoadable = useApiQuery({
    url: "/v2/projects/keys/search",
    method: "get",
    query: {
      search: debouncedSearch,
      size: 20,
      languageTag: language,
    },
    options: {
      enabled: Boolean(debouncedSearch),
    },
  });

  const setNodesDataMutation = useSetNodesDataMutation();

  const handleGoBack = () => {
    setRoute("index");
  };

  const syncNodeNameAtConnection = useGlobalState(
    (c) => c.config?.syncNodeNameAtConnection
  );

  const handleConnect = async (key: string, ns: string | undefined) => {
    await setNodesDataMutation.mutateAsync({
      nodes: [
        {
          ...node,
          ...(syncNodeNameAtConnection ? { name: key } : {}),
          key,
          ns: ns || "",
          connected: true,
        },
      ],
      syncName: syncNodeNameAtConnection,
    });
    setRoute("index");
  };

  const [confirmRemoveConnection, setConfirmRemoveConnection] = useState(false);

  const handleRemoveConnection = async () => {
    await setNodesDataMutation.mutateAsync({
      nodes: [
        {
          ...node,
          key: "",
          ns: undefined,
          connected: false,
        },
      ],
    });
    setConfirmRemoveConnection(false);
    setRoute("index");
  };

  const selectionLoadable = useSelectedNodes();

  const handleRemoveAllConnections = async () => {
    const nodes = selectionLoadable.data?.items || [];
    await setNodesDataMutation.mutateAsync({
      nodes: nodes.map((n) => ({
        ...n,
        key: "",
        ns: undefined,
        connected: false,
      })),
    });
    setRoute("index");
  };

  const handleConfirmRemoveConnection = () => {
    setConfirmRemoveConnection(true);
  };

  const handleCancelRemoveConnection = () => {
    setConfirmRemoveConnection(false);
  };

  return (
    <Fragment>
      {translationsLoadable.isFetching && <FullPageLoading />}
      <TopBar
        onBack={handleGoBack}
        leftPart={<div className={styles.title}>Connect to existing key</div>}
      />
      <Divider />
      <VerticalSpace space="large" />
      <Container space="medium">
        <div className={styles.container}>
          <div>
            <Text>
              <Muted>Search</Muted>
            </Text>
            <VerticalSpace space="small" />
            <Textbox
              data-cy="connect_search_input"
              placeholder="Search by key or translation"
              autoFocus={true}
              onValueInput={(value) => setSearch(value)}
              value={search}
              variant="border"
            />
          </div>
          <div />
        </div>
        <VerticalSpace space="large" />
      </Container>
      <div className={styles.results}>
        {debouncedSearch &&
          translationsLoadable.data?._embedded?.keys?.map((key) => (
            <SearchRow
              key={key.id}
              data={key}
              onClick={() => handleConnect(key.name, key.namespace)}
            />
          ))}
      </div>
      <ActionsBottom>
        {node.connected && (
          <Button secondary onClick={handleConfirmRemoveConnection}>
            Remove connection
          </Button>
        )}
        <Button secondary onClick={handleGoBack}>
          Cancel
        </Button>
      </ActionsBottom>
      <Modal
        open={confirmRemoveConnection}
        title="Do you want to remove the connection?"
        onCloseButtonClick={handleCancelRemoveConnection}
      >
        <div className={styles.modalBody}>
          <Container space="small">
            <VerticalSpace space="large" />
            <Muted>
              Do you want to remove the connection only for this node or for
              all?
            </Muted>
            <VerticalSpace space="large" />
          </Container>
          <Divider />
          <Container space="small">
            <div className={styles.modalActions}>
              <Button
                style={styles.modalButton}
                onClick={handleRemoveConnection}
              >
                Remove node
              </Button>
              <Button
                secondary
                style={styles.modalButton}
                onClick={handleRemoveAllConnections}
              >
                Remove all
              </Button>
            </div>
          </Container>
        </div>
      </Modal>
    </Fragment>
  );
};
