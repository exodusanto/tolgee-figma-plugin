import { h } from "preact";
import clsx from "clsx";

import { components } from "@/ui/client/apiSchema.generated";
import styles from "./SearchRow.css";
import { useGlobalState } from "@/ui/state/GlobalState";

type KeyWithTranslationsModel =
  components["schemas"]["KeyWithTranslationsModel"];

type Props = {
  onClick: () => void;
  data: KeyWithTranslationsModel;
};

export const SearchRow = ({ data, onClick }: Props) => {
  const language = useGlobalState((c) => c.config?.language);

  const translation = (Object.entries(data.translations).find(
    ([key]) => key === language
  ) ?? Object.entries(data.translations)[0])?.[1];

  return (
    <div className={styles.container} onClick={onClick}>
      <div className={styles.translation}>
        {translation?.text ?? "<not set>"}
      </div>
      <div>{data.keyName}</div>
      <div className={clsx({ [styles.disabled]: !data.keyNamespace })}>
        {data.keyNamespace || "<no namespace>"}
      </div>
    </div>
  );
};
