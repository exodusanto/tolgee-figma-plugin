import { GenerateKey } from "@/ui/icons/SvgIcons";
import { Textbox } from "@create-figma-plugin/ui";
import { h } from "preact";
import { useState } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce";
import styles from "./KeyInput.css";
import { uuidv4 } from "@/utilities";

type Props = {
  initialValue: string;
  onDebouncedChange: (value: string, syncName: boolean) => void;
  showGenerateKey?: boolean;
};

export const KeyInput = ({
  initialValue,
  onDebouncedChange,
  showGenerateKey,
}: Props) => {
  const [value, setValue] = useState(initialValue);

  const debouncedcallback = useDebouncedCallback(
    (value: string, syncName = false) => onDebouncedChange(value, syncName),
    100
  );

  return (
    <div className={styles.wrapper}>
      <Textbox
        data-cy="index_unconnected_key_input"
        placeholder="Key name"
        value={value}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          debouncedcallback(e.currentTarget.value);
        }}
        variant="border"
        style={{
          fontSize: 12,
          height: 23,
          paddingRight: showGenerateKey ? 24 : undefined,
        }}
      />
      {!!showGenerateKey && (
        <div className={styles.overlayAction}>
          <div
            className={styles.generateKeyButton}
            role="button"
            title="Generate a random key"
            onClick={() => {
              const key = uuidv4();
              setValue(key);
              onDebouncedChange(key, true);
            }}
          >
            <GenerateKey width={14} height={14} />
          </div>
        </div>
      )}
    </div>
  );
};
