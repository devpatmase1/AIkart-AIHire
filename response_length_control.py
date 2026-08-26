"""Response Length Control Module.

Implements adaptive, content-aware response-length control rules for AI agent output.
Dynamically analyzes content complexity, estimates required depth, selects an appropriate
word range, enforces completeness over rigid limits, compresses verbosity, and validates final output.
"""

import re
from typing import Dict, Any, Tuple, Optional


ADAPTIVE_LENGTH_CONTROL_DIRECTIVE = """
=== ADAPTIVE RESPONSE-LENGTH CONTROL DIRECTIVE ===
You must enforce an adaptive, content-aware response length according to these core rules:

1. ANALYZE BEFORE GENERATING:
   - Analyze original content, user request, complexity, concept count, and required explanation depth.
   - Determine the minimum amount of text required to provide a complete and logically concluded response.
   - Do not start writing until the required response depth is understood.

2. USE AN ADAPTIVE WORD RANGE:
   - Never use a single rigid word limit.
   - Dynamically generate a reasonable minimum and maximum word range based on content analysis.
   - Treat the maximum as a strong target without compromising completeness.
   - Allow a small overflow when necessary to properly conclude an important point naturally.

3. PRIORITIZE COMPLETENESS OVER EXACT WORD COUNT:
   - Never remove essential information merely to satisfy a word limit.
   - Never end the response abruptly just because a limit has been reached.
   - The response MUST always reach a natural, logical conclusion.
   - Avoid unnecessary repetition, filler, unnecessary introductions, disclaimers, and verbose wording.

4. DYNAMIC EXAMPLE BEHAVIOR:
   - Content requiring ~400–500 words -> Target range ~400–550 words with natural completion.
   - Content requiring ~700–900 words -> Target range ~750–950 words with natural completion.
   - Do NOT hard-code fixed universal numbers; dynamically evaluate each prompt.

5. RANGE SELECTION LOGIC:
   Select range according to prompt & context complexity:
   * Very Simple Request -> Short range (~30–120 words)
   * Moderate Explanation -> Medium range (~150–400 words)
   * Complex Explanation -> Longer range (~450–700 words)
   * Multi-Part or Detailed Analysis -> Larger range (~750–1100 words)

6. MINIMUM-WORD RULE:
   - The minimum threshold represents the actual information depth required to answer properly.
   - Do NOT artificially inflate a concise response just to hit the minimum.

7. MAXIMUM-WORD RULE:
   - The maximum prevents unnecessary verbosity.
   - When approaching the maximum: remove repetition first, omit low-value details, compress wording, and preserve essential reasoning.
   - Exceeding the maximum slightly is preferable to returning an incomplete answer.

8. FINAL VALIDATION CHECK (INTERNAL):
   Before returning, verify internally:
   - Is every important part of the request answered?
   - Is the reasoning complete?
   - Does the response have a clear, natural conclusion?
   - Is there unnecessary repetition?
   - Is the response within the dynamically selected adaptive range?
===================================================
"""


class ResponseLengthController:
    """Utility class for estimating complexity, generating adaptive length directives,
    and validating generated response text.
    """

    @staticmethod
    def estimate_complexity(text: str, user_prompt: Optional[str] = "") -> str:
        """Categorize complexity into: 'simple', 'moderate', 'complex', or 'multi_part'."""
        combined_text = f"{user_prompt or ''} {text or ''}".strip()
        words = combined_text.split()
        word_count = len(words)

        # Check for multi-part indicators
        has_multi_part = bool(
            re.search(r"(list|compare|step-by-step|multiple|detail|explain each|1\.|2\.|3\.)", combined_text, re.IGNORECASE)
        )

        if has_multi_part or word_count >= 500:
            return "multi_part"
        elif word_count >= 250:
            return "complex"
        elif word_count >= 25:
            return "moderate"
        else:
            return "simple"

    @staticmethod
    def get_word_range_for_complexity(complexity: str) -> Tuple[int, int]:
        """Return (min_words, max_words) for a given complexity level."""
        ranges = {
            "simple": (30, 120),
            "moderate": (150, 400),
            "complex": (450, 700),
            "multi_part": (750, 1100),
        }
        return ranges.get(complexity, (150, 400))

    @classmethod
    def get_system_directive(cls, complexity: Optional[str] = None) -> str:
        """Get system prompt directive with optional custom target range."""
        if complexity:
            min_w, max_w = cls.get_word_range_for_complexity(complexity)
            custom_target = (
                f"\n[TARGET RANGE FOR THIS TASK]: Approximately {min_w} to {max_w} words. "
                f"Prioritize complete coverage and natural conclusion within this range.\n"
            )
            return ADAPTIVE_LENGTH_CONTROL_DIRECTIVE + custom_target
        return ADAPTIVE_LENGTH_CONTROL_DIRECTIVE

    @staticmethod
    def validate_response(response_text: str, min_words: int = 20, max_words: int = 1200) -> Dict[str, Any]:
        """Validate response for word count, completeness, and repetition."""
        words = response_text.split()
        word_count = len(words)

        # Check if response ends naturally with proper punctuation
        has_natural_conclusion = bool(re.search(r'[.!?}"\]]\s*$', response_text.strip()))

        # Simple repetition check (looking for repeated contiguous phrases of 4+ words)
        phrases = [" ".join(words[i : i + 4]) for i in range(len(words) - 3)]
        duplicate_phrases = set([p for p in phrases if phrases.count(p) > 1])
        has_repetition = len(duplicate_phrases) > 2

        is_within_range = (min_words <= word_count <= max_words * 1.15)  # 15% acceptable overflow for conclusion

        return {
            "word_count": word_count,
            "min_words_target": min_words,
            "max_words_target": max_words,
            "is_within_range": is_within_range,
            "has_natural_conclusion": has_natural_conclusion,
            "has_repetition": has_repetition,
            "valid": is_within_range and has_natural_conclusion and not has_repetition,
        }
