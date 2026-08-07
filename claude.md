Do not write comments. Instead, write file and function names that make it clear what it's doing and why. 

Make sure files only have one major responsibility, as soon as it seems like they are handling multiple things, split them into multiple files.

If a function is more than 5 lines and definitely if it's more than 10, see if you can split it into multiple functions, each of which carves the code as closely as possible along "why are we doing this?" axes. Group files into folders that help convey what they are for.

Codebase should follow the principle of being able to quickly derive what parts of the codebase do what from looking at the UI, following the same structure as the UI

All json files should be pretty-print formatted.

Whenever you report back to a user, always end with a direct link to a running server

When adding or changing procgen node types, follow docs/authoring-nodes.md and keep the determinism rules; extend scripts/checkProcgenInvariants.ts with checks for new nodes.

Node types follow the knob typology: every field is either a numeric knob (number / int / choice / toggle — all stored as numbers), a tile link (tile param), or a node link (an input). No text, boolean, or string-enum params; sizes are numeric knobs, never named presets. registerNodeType enforces this at both type level and runtime (custom script is the sole escape hatch via registerScriptNodeType), and npm run check verifies it.

Do NOT attempt to test code in browser. As much as possible, design the code such that you can test as much as you can via scripting or API. Once you've tested everything you can quickly test via API and just reading the code and thinking about it, show it to me.

