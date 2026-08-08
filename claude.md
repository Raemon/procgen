Do not write comments. Instead, write file and function names that make it clear what it's doing and why. 

Make sure files only have one major responsibility, as soon as it seems like they are handling multiple things, split them into multiple files.

If a function is more than 5 lines and definitely if it's more than 10, see if you can split it into multiple functions, each of which carves the code as closely as possible along "why are we doing this?" axes. Group files into folders that help convey what they are for.

Codebase should follow the principle of being able to quickly derive what parts of the codebase do what from looking at the UI, following the same structure as the UI

All json files should be pretty-print formatted.

Whenever you report back to a user, always end with a direct link to a running server

When adding or changing procgen node types, keep the determinism rules — a node's output must be a pure function of (world seed, node, chunk coordinates, inputs), never of time, Math.random, or which chunks happened to generate first — and extend checks/checkProcgenInvariants.ts with checks for new nodes.

Documentation is generated, never written. GET /docs renders the codebase page and GET /api/v1/docs renders the agent API, both from the live registries. A sentence about this codebase belongs in a check claim, where a failing assertion falsifies it, or it does not get written down. checks/checkDocumentationHasNotRegrown.ts enforces this, and claude.md is its only allowlisted exception.

Node types follow the knob typology: every field is either a numeric knob (number / int / choice / toggle — all stored as numbers), a tile link (tile param), or a node link (an input). No text, boolean, or string-enum params; sizes are numeric knobs, never named presets. registerNodeType enforces this at both type level and runtime (custom script is the sole escape hatch via registerScriptNodeType), and npm run check verifies it.

Do NOT attempt to test code in browser. As much as possible, design the code such that you can test as much as you can via scripting or API. Once you've tested everything you can quickly test via API and just reading the code and thinking about it, show it to me.


Claims come in two kinds and both are recorded through checks/claims.ts. An invariant, recorded with check, earns its place by failing on a mistake someone could plausibly make; a red run means something is broken. A characterization, recorded with characterize, pins the shape the world currently has so that changing it reports as a change to confirm rather than a failure. A threshold you would happily move is a characterization. A threshold that only moves when something broke is an invariant. Never file a content or tuning choice as an invariant: it makes exploring the design feel like a regression. Documentation value justifies neither kind — if a claim exists only to state something true and you would not want to be told it had changed, delete it.

A claim states what is true. It states why only when the user said why, in conversation. Causal clauses — "so ...", "because ...", "rather than ...", "instead of ..." — assert intent, and intent read back off the code is invented rather than recorded. This binds characterizations exactly as tightly as invariants. Where you cannot point at where the reason was given, state the fact and stop.

When reviewing code, read every causal clause in every claim and ask whether it flows downstream of a choice the user explained. Flag the ones that do not, and do not rewrite them silently: a claim that explains itself out of nowhere is the codebase telling itself a story about why it is the way it is, and only the user can say which stories are true.
