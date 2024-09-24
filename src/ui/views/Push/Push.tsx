import { Fragment, FunctionalComponent, h } from "preact";
import { useMemo, useState } from "preact/hooks";
import {
  Banner,
  Button,
  Checkbox,
  Container,
  Divider,
  IconWarning32,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";

import { components } from "@/ui/client/apiSchema.generated";
import { useApiMutation, useApiQuery } from "@/ui/client/useQueryApi";
import { ActionsBottom } from "@/ui/components/ActionsBottom/ActionsBottom";
import { FullPageLoading } from "@/ui/components/FullPageLoading/FullPageLoading";
import { useGlobalActions, useGlobalState } from "@/ui/state/GlobalState";
import {
  getPushChanges,
  KeyChanges,
  KeyChangeValue,
} from "@/tools/getPushChanges";
import { TopBar } from "../../components/TopBar/TopBar";
import { Changes } from "./Changes";
import { FrameScreenshot, NodeInfo } from "@/types";
import { compareNs } from "@/tools/compareNs";
import { getScreenshotsEndpoint } from "@/main/endpoints/getScreenshots";
import { useConnectedNodes } from "@/ui/hooks/useConnectedNodes";
import { useSetNodesDataMutation } from "@/ui/hooks/useSetNodesDataMutation";

type ImportKeysResolvableItemDto =
  components["schemas"]["ImportKeysResolvableItemDto"];
type KeyScreenshotDto = components["schemas"]["KeyScreenshotDto"];

export const Push: FunctionalComponent = () => {
  const language = useGlobalState((c) => c.config!.language!);
  const useNameAsDefaultKey = useGlobalState(
    (c) => c.config?.useNameAsDefaultKey
  );
  const defaultNamespace = useGlobalState((c) => c.config?.namespace);
  const { setRoute } = useGlobalActions();
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [_loadingStatus, setLoadingStatus] = useState<string | undefined>();
  const [changes, setChanges] = useState<KeyChanges>();
  const selectedNodes = useConnectedNodes({
    ignoreSelection: false,
    useNameAsDefaultKey,
    defaultNamespace,
  });

  const nodes = selectedNodes.data?.items ?? [];

  const keys = useMemo(() => [...new Set(nodes.map((n) => n.key))], [nodes]);

  const [uploadScreenshots, setUploadScreenshots] = useState(true);
  const [keyResolution, setKeyResolution] = useState<"OVERRIDE" | "KEEP">(
    "KEEP"
  );

  const deduplicatedNodes = useMemo(() => {
    const deduplicatedNodes: NodeInfo[] = [];
    nodes.forEach((node) => {
      if (
        !deduplicatedNodes.find(
          (n) => node.key === n.key && compareNs(node.ns, n.ns)
        )
      ) {
        deduplicatedNodes.push(node);
      }
    });
    return deduplicatedNodes;
  }, [nodes]);

  const translationsLoadable = useApiQuery({
    url: "/v2/projects/translations",
    method: "get",
    query: {
      languages: [language],
      size: 1000000,
      filterKeyName: keys,
    },
    options: {
      enabled: selectedNodes.isSuccess,
      cacheTime: 0,
      staleTime: 0,
      onSuccess(data) {
        getScreenshotsEndpoint
          .call(nodes)
          .then((screenshots) => {
            setChanges(
              getPushChanges(
                deduplicatedNodes,
                data?._embedded?.keys || [],
                language,
                screenshots
              )
            );
          })
          .finally(() => {
            setLoadingStatus(undefined);
          });
      },
    },
  });

  const setNodesDataMutation = useSetNodesDataMutation();

  const loadingStatus =
    translationsLoadable.isLoading || selectedNodes.isLoading
      ? "Loading data and generating screenshots"
      : _loadingStatus;

  const updateTranslations = useApiMutation({
    url: "/v2/projects/keys/import-resolvable",
    method: "post",
  });

  const uploadImage = useApiMutation({
    url: "/v2/image-upload",
    method: "post",
  });

  const bigMeta = useApiMutation({
    url: "/v2/projects/big-meta",
    method: "post",
  });

  const handleGoBack = () => {
    setRoute("index");
  };

  const connectNodes = () => {
    setNodesDataMutation.mutate({
      nodes: nodes.map((n) => ({
        ...n,
        connected: true,
      })),
    });
  };

  const handleConnectOnly = () => {
    connectNodes();
    setRoute("index");
  };

  const handleSubmit = async () => {
    const keys: ImportKeysResolvableItemDto[] = [];

    if (!changes) {
      return;
    }

    try {
      const screenshotsMap = new Map<FrameScreenshot, number>();
      const requiredScreenshots = uploadScreenshots ? changes.screenshots : [];

      for (const [i, screenshot] of requiredScreenshots.entries()) {
        setLoadingStatus(
          `Uploading images (${i + 1}/${requiredScreenshots.length})`
        );
        const imageBlob = new Blob([screenshot.image.buffer], {
          type: "image/png",
        });
        const location = `figma-${screenshot.info.id}`;
        const infoBlob = new Blob([JSON.stringify({ location })], {
          type: "application/json",
        });
        const data = await uploadImage.mutateAsync({
          content: {
            "multipart/form-data": {
              image: imageBlob as any,
              info: infoBlob as any,
            },
          },
        });
        screenshotsMap.set(screenshot, data.id);
      }

      const mapScreenshots = (item: KeyChangeValue): KeyScreenshotDto[] => {
        const result: KeyScreenshotDto[] = [];
        if (uploadScreenshots) {
          item.screenshots.forEach((screenshot) => {
            const relevantNodes = screenshot.keys.filter(
              ({ key, ns }) => key === item.key && compareNs(ns, item.ns)
            );

            result.push({
              text: item.newValue,
              uploadedImageId: screenshotsMap.get(screenshot)!,
              positions: relevantNodes.map(({ x, y, width, height }) => {
                return {
                  x,
                  y,
                  width,
                  height,
                };
              }),
            });
          });
        }
        return result;
      };

      setLoadingStatus("Updating keys");

      changes.unchangedKeys.forEach((item) => {
        keys.push({
          name: item.key,
          namespace: item.ns || undefined,
          screenshots: mapScreenshots(item),
          translations: {},
        });
      });

      changes.changedKeys.forEach((item) => {
        keys.push({
          name: item.key,
          namespace: item.ns || undefined,
          screenshots: mapScreenshots(item),
          translations: {
            [language]: {
              text: item.newValue,
              resolution: keyResolution,
            },
          },
        });
      });

      changes.newKeys.forEach((item) => {
        keys.push({
          name: item.key,
          namespace: item.ns || undefined,
          screenshots: mapScreenshots(item),
          translations: {
            [language]: { text: item.newValue, resolution: "NEW" },
          },
        });
      });

      await updateTranslations.mutateAsync({
        content: {
          "application/json": {
            keys,
          },
        },
      });

      for (const screenshot of changes.screenshots.values()) {
        const relatedKeys = screenshot.keys
          .map((data) => ({
            keyName: data.key,
            namespace: data.ns || undefined,
          }))
          .slice(0, 100);
        await bigMeta.mutateAsync({
          content: {
            "application/json": {
              relatedKeysInOrder: relatedKeys,
            },
          },
        });
      }

      connectNodes();
      setSuccess(true);
    } catch (e) {
      setError(true);
      console.error(e);
    } finally {
      setLoadingStatus(undefined);
    }
  };

  const handleRepeat = () => {
    setError(false);
    setSuccess(false);
    translationsLoadable.refetch();
  };

  const isLoading =
    translationsLoadable.isFetching ||
    updateTranslations.isLoading ||
    uploadImage.isLoading;

  const changesSize = changes
    ? changes.changedKeys.length + changes.newKeys.length
    : 0;

  const screenshotCount = changes?.screenshots.length || 0;

  const noChanges = changesSize === 0;

  return (
    <Fragment>
      <TopBar
        onBack={handleGoBack}
        leftPart={<div>Push translations to Tolgee ({language})</div>}
      />
      <Divider />
      <VerticalSpace space="large" />
      <Container space="medium">
        {isLoading || !changes ? (
          <FullPageLoading text={loadingStatus} />
        ) : error ? (
          <Fragment>
            <div>
              <Banner icon={<IconWarning32 />}>
                {updateTranslations.error ||
                  "An error has occurred during push."}
              </Banner>
            </div>
            <ActionsBottom>
              <Button onClick={handleRepeat}>Try again</Button>
            </ActionsBottom>
          </Fragment>
        ) : success ? (
          <Fragment>
            <div>
              Successfully updated {changesSize} key(s)
              {uploadScreenshots
                ? ` and uploaded ${screenshotCount} screenshot(s).`
                : "."}
            </div>
            <ActionsBottom>
              <Button data-cy="push_ok_button" onClick={handleGoBack}>
                OK
              </Button>
            </ActionsBottom>
          </Fragment>
        ) : (
          <Fragment>
            {screenshotCount !== 0 && (
              <Fragment>
                <Checkbox
                  data-cy="push_upload_screenshots_checkbox"
                  value={uploadScreenshots}
                  onChange={(e) =>
                    setUploadScreenshots(Boolean(e.currentTarget.checked))
                  }
                >
                  <Text>Upload {screenshotCount} screenshot(s)</Text>
                </Checkbox>
                <VerticalSpace space="small" />
              </Fragment>
            )}
            <Checkbox
              data-cy="push_override_checkbox"
              value={keyResolution === "OVERRIDE"}
              onChange={(e) =>
                setKeyResolution(e.currentTarget.checked ? "OVERRIDE" : "KEEP")
              }
            >
              <Text>Override existing translations on Tolgee</Text>
            </Checkbox>
            <VerticalSpace space="medium" />
            <Changes changes={changes} />
            {noChanges && <div>No changes necessary</div>}
            <ActionsBottom>
              <Button
                data-cy="push_cancel_button"
                onClick={handleGoBack}
                secondary
              >
                Cancel
              </Button>
              {noChanges && (screenshotCount === 0 || !uploadScreenshots) ? (
                <Button
                  data-cy="push_finish_button"
                  onClick={handleConnectOnly}
                >
                  Finish
                </Button>
              ) : (
                <Button data-cy="push_submit_button" onClick={handleSubmit}>
                  Push to Tolgee
                </Button>
              )}
            </ActionsBottom>
          </Fragment>
        )}
      </Container>
    </Fragment>
  );
};
