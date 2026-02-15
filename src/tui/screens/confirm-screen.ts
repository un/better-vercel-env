import { Box, Text } from "@opentui/core";

export interface ConfirmScreenModel {
  expectedPhrase: string;
  input: string;
  ready: boolean;
  pendingOperationCount: number;
  statusMessage: string;
  keyHints: string;
}

export function ConfirmScreen(model: ConfirmScreenModel) {
  return Box(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 1,
      gap: 1,
      borderStyle: "rounded",
    },
    Text({ content: "Apply Confirmation" }),
    Text({ content: `Pending operations: ${model.pendingOperationCount}` }),
    Text({ content: `Type exactly: ${model.expectedPhrase}` }),
    Text({ content: `Input: ${model.input}` }),
    Text({ content: model.ready ? "Status: phrase matches, press Enter to continue." : "Status: phrase does not match." }),
    Text({ content: `Message: ${model.statusMessage}` }),
    Text({ content: model.keyHints }),
  );
}
