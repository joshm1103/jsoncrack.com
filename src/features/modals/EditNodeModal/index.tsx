import React from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, TextInput, Group, Button, CloseButton, Flex, ScrollArea } from "@mantine/core";
import { useModal } from "../../../store/useModal";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

export const EditNodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const setVisible = useModal(state => state.setVisible);
  const [editedValues, setEditedValues] = React.useState<Record<string, string | number>>({});
  const json = useJson(state => state.getJson());
  const setJson = useJson(state => state.setJson);

  React.useEffect(() => {
    if (nodeData?.text) {
      const values: Record<string, string | number> = {};
      nodeData.text.forEach(row => {
        if (row.key && row.type !== "object" && row.type !== "array") {
          values[row.key] = row.value ?? "";
        }
      });
      setEditedValues(values);
    } else {
      setEditedValues({});
    }
  }, [nodeData]);

  const handleSave = React.useCallback(() => {
    if (!nodeData?.path) return;

    try {
      const data = JSON.parse(json);
      let current: any = data;

      // Navigate to the target object using the path
      for (let i = 0; i < nodeData.path!.length; i++) {
        current = current[nodeData.path![i]];
      }

      // Update the values
      Object.entries(editedValues).forEach(([key, value]) => {
        current[key] = value;
      });

      const updatedJson = JSON.stringify(data, null, 2);
      setJson(updatedJson);
      onClose();
    } catch (error) {
      console.error("Error updating node:", error);
    }
  }, [nodeData, editedValues, json, setJson, onClose]);

  const jsonPathToString = (path?: NodeData["path"]) => {
    if (!path || path.length === 0) return "$";
    const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
    return `$[${segments.join("][")}]`;
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Flex justify="space-between" align="center">
          <Text fz="xs" fw={500}>
            Content
          </Text>

          <Group>
            <Button size="sm" color="green" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" color="red" variant="filled" onClick={() => onClose()}>
              Cancel
            </Button>
            <CloseButton onClick={onClose} />
          </Group>
        </Flex>

        <Stack gap="sm">
          {nodeData?.text
            .filter(row => row.key && row.type !== "object" && row.type !== "array")
            .map((row, index) => (
              <div key={index}>
                <Text fz="xs" fw={500} mb={4} style={{ textTransform: "lowercase" }}>
                  {row.key}
                </Text>
                <TextInput
                  placeholder={`Enter ${row.key}`}
                  value={editedValues[row.key!] ?? ""}
                  onChange={e =>
                    setEditedValues(prev => ({
                      ...prev,
                      [row.key!]: e.currentTarget.value,
                    }))
                  }
                  size="sm"
                />
              </div>
            ))}
        </Stack>

        <Text fz="xs" fw={500}>
          JSON Path
        </Text>

        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};
