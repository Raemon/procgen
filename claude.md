Do not write comments. Instead, write file and function names that make it clear what it's doing and why. 

Make sure files only have one major responsibility, as soon as it seems like they are handling multiple things, split them into multiple files.

If a function is more than 5 lines and definitely if it's more than 10, see if you can split it into multiple functions, each of which carves the code as closely as possible along "why are we doing this?" axes.

Whenever you report back to a user, always end with a direct link to a running server