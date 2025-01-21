import { ComponentChildren, h } from "preact";

import { PartialNodeInfo } from "@/types";
import styles from "./NodeRow.css";

type Props = {
  node: PartialNodeInfo;
  action?: ComponentChildren;
  keyComponent?: ComponentChildren;
  nsComponent?: ComponentChildren;
  compact?: boolean;
  remoteTranslation?: string;
  onClick?: () => void;
};

export const NodeRow = ({
  node,
  action,
  keyComponent,
  nsComponent,
  compact,
  remoteTranslation,
  onClick,
}: Props) => {
  const showText = node.characters || !compact || action;

  return (
    <div
      data-cy="general_node_list_row"
      className={styles.container}
      style={{
        gridTemplateColumns: action ? "1fr 1fr auto" : "1fr 1fr",
        cursor: onClick ? "pointer" : "default",
      }}
      role={onClick ? "button" : undefined}
      onClick={onClick}
    >
      {showText && (
        <div
          title="Translation text"
          className={styles.text}
          data-cy="general_node_list_row_text"
        >
          <span>{node.characters}</span>
          {remoteTranslation && remoteTranslation !== node.characters && (
            <div class={styles.remoteBox}>
              <span className={styles.remoteTextPrefix}>remote: </span>
              <span className={styles.remoteText}>{remoteTranslation}</span>
            </div>
          )}
        </div>
      )}
      <div className={styles.action} data-cy="general_node_list_row_action">
        {action}
      </div>
      <div
        title="Translation key"
        data-cy="general_node_list_row_key"
        className={styles.key}
      >
        {keyComponent ? keyComponent : node.key}
      </div>
      <div
        title="Translation namespace"
        data-cy="general_node_list_row_namespace"
      >
        {nsComponent
          ? nsComponent
          : node.ns && (
              <span>
                <span className={styles.disabled}>ns:</span>
                {node.ns}
              </span>
            )}
        {!keyComponent && node.sibilings && node.sibilings.length > 0 && (
          <div>used in {node.sibilings.length} nodes</div>
        )}
      </div>
    </div>
  );
};
