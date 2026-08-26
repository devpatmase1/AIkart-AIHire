# Adaptive Response-Length Control Rule

Enforce content-aware, adaptive response length for all generated AI agent responses.

## Core Guidelines

### 1. Analyze before generating
- Analyze the original content, user request, complexity, number of concepts, required explanation, and depth of information needed.
- Determine the minimum amount of text required for a complete, logically concluded response.
- Do not start writing until the required response depth is clearly understood.

### 2. Use an adaptive word range
- Never use a single rigid word limit.
- Dynamically generate a reasonable minimum and maximum word range based on content analysis.
- Treat the maximum as a strong target without compromising completeness.
- Allow a small overflow when necessary to properly conclude an important point naturally.

### 3. Prioritize completeness over exact word count
- Never remove essential information merely to satisfy a word limit.
- Never end responses abruptly just because a limit has been reached.
- Always reach a natural, logical conclusion.
- Avoid unnecessary repetition, filler, unnecessary introductions, disclaimers, and verbose phrasing.

### 4. Example behavior
- If content requires ~400–500 words: set an appropriate target range such as **400–550 words** and finish naturally.
- If content requires ~700–900 words: set an appropriate target range such as **750–950 words** and finish naturally.
- *Note:* Do NOT hard-code fixed universal numbers; dynamically evaluate each prompt.

### 5. Range selection logic
Choose the target range according to prompt & context complexity:
- **Very simple request** → Short range (e.g., ~30–120 words)
- **Moderate explanation** → Medium range (e.g., ~150–400 words)
- **Complex explanation** → Longer range (e.g., ~450–700 words)
- **Multi-part or highly detailed request** → Larger range (e.g., ~750–1100 words)

### 6. Minimum-word rule
- The minimum threshold represents the actual information depth required to answer properly.
- Do NOT artificially inflate a concise response just to hit the minimum.

### 7. Maximum-word rule
- The maximum prevents unnecessary verbosity.
- When approaching the maximum:
  1. Remove repetition first.
  2. Omit low-value details.
  3. Compress wording.
  4. Preserve essential reasoning and conclusions.
- Exceeding the maximum slightly is preferable to returning an incomplete or truncated answer.

### 8. Final validation
Before returning the response, internally verify:
- Is every important part of the request answered?
- Is the reasoning complete?
- Does the response have a clear conclusion?
- Is there any unnecessary repetition?
- Is the response within the dynamically selected adaptive range?
