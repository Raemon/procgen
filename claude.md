This is an engine and editor for rapidly prototyping procedural world generation variations, while keeping it clear to users how the procedural generation works.

The broader goal we are trying to achieve as soon as we can is to generate worlds that are interesting to explore, that have a unique backstory and adventure hooks. 

Obstacles are facing:
- current LLMs don't have good enough judgment to one-shot entire worlds or puzzles, so we need to assemble good building blocks they can use

RULES

Do not write comments or docs. Instead, write file and function names that make it clear what it's doing and why. 

Make sure files only have one major responsibility, as soon as it seems like they are handling multiple things, split them into multiple files.

If a function is more than 5 lines and definitely if it's more than 10, see if you can split it into multiple functions, each of which carves the code as closely as possible along "why are we doing this?" axes. Group files into folders that help convey what they are for.

Whenever you report back to a user, always end with a direct link to a running server

When adding or changing procgen node types, follow docs/authoring-nodes.md and keep the determinism rules; extend checks/checkProcgenInvariants.ts with checks for new nodes.

Node types follow the knob typology: every field is either 
- a numeric knob (number / int / choice / toggle — all stored as numbers
- a tile link (tile param)
- node link (an input). 

No text, boolean, or string-enum params; sizes are numeric knobs. RegisterNodeType enforces this at both type level and runtime (custom script is the sole escape hatch via registerScriptNodeType), and npm run check verifies it.

Do NOT attempt to test code in browser. If you you need to test something you can't do without the browser, design the code and build yourself a script such that you can test via scripting and API. Once you've tested everything you can quickly test via API and just reading the code and thinking about it, show it to me.

