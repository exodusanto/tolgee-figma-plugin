import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { useDebounce } from "use-debounce";
import {
  Button,
  Container,
  Divider,
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
    setRoute("index");
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
          <Button secondary onClick={handleRemoveConnection}>
            Remove connection
          </Button>
        )}
        <Button secondary onClick={handleGoBack}>
          Cancel
        </Button>
      </ActionsBottom>
    </Fragment>
  );
};
