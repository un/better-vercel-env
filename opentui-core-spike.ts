import { Box, Text, createCliRenderer } from "@opentui/core";

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
});

renderer.root.add(
  Box(
    {
      borderStyle: "rounded",
      padding: 1,
      flexDirection: "column",
      gap: 1,
    },
    Text({ content: "OpenTUI core spike" }),
    Text({ content: "This validates construct-based setup." }),
  ),
);

setTimeout(() => {
  renderer.destroy();
}, 20);
