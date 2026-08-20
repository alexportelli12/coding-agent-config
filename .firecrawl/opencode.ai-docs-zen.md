[Skip to content](https://opencode.ai/docs/zen/#_top)

[![](https://opencode.ai/docs/_astro/logo-dark.DOStV66V.svg)![](https://opencode.ai/docs/_astro/logo-light.B0yzR0O5.svg) OpenCode](https://opencode.ai/docs/)

[app.header.home](https://opencode.ai/) [app.header.docs](https://opencode.ai/docs/)

Search ` CtrlK `

Cancel

Clear

- [Intro](https://opencode.ai/docs/)
- [Config](https://opencode.ai/docs/config/)
- [Providers](https://opencode.ai/docs/providers/)
- [Network](https://opencode.ai/docs/network/)
- [Enterprise](https://opencode.ai/docs/enterprise/)
- [Troubleshooting](https://opencode.ai/docs/troubleshooting/)
- [Windows](https://opencode.ai/docs/windows-wsl)
- Usage



  - [Go](https://opencode.ai/docs/go/)
  - [TUI](https://opencode.ai/docs/tui/)
  - [CLI](https://opencode.ai/docs/cli/)
  - [Web](https://opencode.ai/docs/web/)
  - [IDE](https://opencode.ai/docs/ide/)
  - [Zen](https://opencode.ai/docs/zen/)
  - [Share](https://opencode.ai/docs/share/)
  - [GitHub](https://opencode.ai/docs/github/)
  - [GitLab](https://opencode.ai/docs/gitlab/)

- Configure



  - [Tools](https://opencode.ai/docs/tools/)
  - [Rules](https://opencode.ai/docs/rules/)
  - [Agents](https://opencode.ai/docs/agents/)
  - [Models](https://opencode.ai/docs/models/)
  - [Themes](https://opencode.ai/docs/themes/)
  - [Keybinds](https://opencode.ai/docs/keybinds/)
  - [Commands](https://opencode.ai/docs/commands/)
  - [Formatters](https://opencode.ai/docs/formatters/)
  - [Permissions](https://opencode.ai/docs/permissions/)
  - [Policies](https://opencode.ai/docs/policies/)
  - [LSP Servers](https://opencode.ai/docs/lsp/)
  - [MCP servers](https://opencode.ai/docs/mcp-servers/)
  - [ACP Support](https://opencode.ai/docs/acp/)
  - [Agent Skills](https://opencode.ai/docs/skills/)
  - [References](https://opencode.ai/docs/references/)
  - [Custom Tools](https://opencode.ai/docs/custom-tools/)

- Develop



  - [SDK](https://opencode.ai/docs/sdk/)
  - [Server](https://opencode.ai/docs/server/)
  - [Plugins](https://opencode.ai/docs/plugins/)
  - [Ecosystem](https://opencode.ai/docs/ecosystem/)

[GitHub](https://github.com/anomalyco/opencode) [Discord](https://opencode.ai/discord)

Select themeDarkLightAutoSelect languageEnglishالعربيةBosanskiDanskDeutschEspañolFrançaisItaliano日本語한국어Norsk BokmålPolskiPortuguês (Brasil)РусскийไทยTürkçe简体中文繁體中文

On this page

- [Overview](https://opencode.ai/docs/zen/#_top)
- [Background](https://opencode.ai/docs/zen/#background)
- [How it works](https://opencode.ai/docs/zen/#how-it-works)
- [Endpoints](https://opencode.ai/docs/zen/#endpoints)
  - [Models](https://opencode.ai/docs/zen/#models)
- [Pricing](https://opencode.ai/docs/zen/#pricing)
  - [Auto-reload](https://opencode.ai/docs/zen/#auto-reload)
  - [Monthly limits](https://opencode.ai/docs/zen/#monthly-limits)
  - [Deprecated models](https://opencode.ai/docs/zen/#deprecated-models)
- [Privacy](https://opencode.ai/docs/zen/#privacy)
- [For Teams](https://opencode.ai/docs/zen/#for-teams)
  - [Roles](https://opencode.ai/docs/zen/#roles)
  - [Model access](https://opencode.ai/docs/zen/#model-access)
  - [Bring your own key](https://opencode.ai/docs/zen/#bring-your-own-key)
- [Goals](https://opencode.ai/docs/zen/#goals)

## On this page

- [Overview](https://opencode.ai/docs/zen/#_top)
- [Background](https://opencode.ai/docs/zen/#background)
- [How it works](https://opencode.ai/docs/zen/#how-it-works)
- [Endpoints](https://opencode.ai/docs/zen/#endpoints)
  - [Models](https://opencode.ai/docs/zen/#models)
- [Pricing](https://opencode.ai/docs/zen/#pricing)
  - [Auto-reload](https://opencode.ai/docs/zen/#auto-reload)
  - [Monthly limits](https://opencode.ai/docs/zen/#monthly-limits)
  - [Deprecated models](https://opencode.ai/docs/zen/#deprecated-models)
- [Privacy](https://opencode.ai/docs/zen/#privacy)
- [For Teams](https://opencode.ai/docs/zen/#for-teams)
  - [Roles](https://opencode.ai/docs/zen/#roles)
  - [Model access](https://opencode.ai/docs/zen/#model-access)
  - [Bring your own key](https://opencode.ai/docs/zen/#bring-your-own-key)
- [Goals](https://opencode.ai/docs/zen/#goals)

# Zen

Curated list of models provided by OpenCode.

OpenCode Zen is a list of tested and verified models provided by the OpenCode team.

Zen works like any other provider in OpenCode. You login to OpenCode Zen and get
your API key. It’s **completely optional** and you don’t need to use it to use
OpenCode.

* * *

## [Background](https://opencode.ai/docs/zen/\#background)

There are a large number of models out there but only a few of
these models work well as coding agents. Additionally, most providers are
configured very differently; so you get very different performance and quality.

Tip

We tested a select group of models and providers that work well with OpenCode.

So if you are using a model through something like OpenRouter, you can never be
sure if you are getting the best version of the model you want.

To fix this, we did a couple of things:

1. We tested a select group of models and talked to their teams about how to
best run them.
2. We then worked with a few providers to make sure these were being served
correctly.
3. Finally, we benchmarked the combination of the model/provider and came up
with a list that we feel good recommending.

OpenCode Zen is an AI gateway that gives you access to these models.

* * *

## [How it works](https://opencode.ai/docs/zen/\#how-it-works)

OpenCode Zen works like any other provider in OpenCode.

1. You sign in to **[OpenCode Zen](https://opencode.ai/auth)**, add your billing
details, and copy your API key.
2. You run the `/connect` command in the TUI, select OpenCode Zen, and paste your API key.
3. Run `/models` in the TUI to see the list of models we recommend.

You are charged per request and you can add credits to your account.

* * *

## [Endpoints](https://opencode.ai/docs/zen/\#endpoints)

You can also access our models through the following API endpoints.

| Model | Model ID | Endpoint | AI SDK Package |
| --- | --- | --- | --- |
| GPT 5.6 Sol | gpt-5.6-sol | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.6 Terra | gpt-5.6-terra | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.6 Luna | gpt-5.6-luna | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.5 | gpt-5.5 | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.5 Pro | gpt-5.5-pro | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.4 | gpt-5.4 | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.4 Pro | gpt-5.4-pro | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.4 Mini | gpt-5.4-mini | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.4 Nano | gpt-5.4-nano | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.3 Codex | gpt-5.3-codex | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.3 Codex Spark | gpt-5.3-codex-spark | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.2 | gpt-5.2 | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.2 Codex | gpt-5.2-codex | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.1 | gpt-5.1 | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.1 Codex | gpt-5.1-codex | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.1 Codex Max | gpt-5.1-codex-max | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5.1 Codex Mini | gpt-5.1-codex-mini | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5 | gpt-5 | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5 Codex | gpt-5-codex | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| GPT 5 Nano | gpt-5-nano | `https://opencode.ai/zen/v1/responses` | `@ai-sdk/openai` |
| Claude Fable 5 | claude-fable-5 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Opus 4.8 | claude-opus-4-8 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Opus 4.7 | claude-opus-4-7 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Opus 4.6 | claude-opus-4-6 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Opus 4.5 | claude-opus-4-5 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Sonnet 5 | claude-sonnet-5 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Sonnet 4.6 | claude-sonnet-4-6 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Sonnet 4.5 | claude-sonnet-4-5 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Claude Haiku 4.5 | claude-haiku-4-5 | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Gemini 3.5 Flash | gemini-3.5-flash | `https://opencode.ai/zen/v1/models/gemini-3.5-flash` | `@ai-sdk/google` |
| Gemini 3.1 Pro | gemini-3.1-pro | `https://opencode.ai/zen/v1/models/gemini-3.1-pro` | `@ai-sdk/google` |
| Gemini 3 Flash | gemini-3-flash | `https://opencode.ai/zen/v1/models/gemini-3-flash` | `@ai-sdk/google` |
| Qwen3.7 Max | qwen3.7-max | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Qwen3.7 Plus | qwen3.7-plus | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Qwen3.6 Plus | qwen3.6-plus | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| Qwen3.5 Plus | qwen3.5-plus | `https://opencode.ai/zen/v1/messages` | `@ai-sdk/anthropic` |
| DeepSeek V4 Pro | deepseek-v4-pro | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| DeepSeek V4 Flash | deepseek-v4-flash | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| MiniMax M3 | minimax-m3 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| MiniMax M2.7 | minimax-m2.7 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| MiniMax M2.5 | minimax-m2.5 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| GLM 5.2 | glm-5.2 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| GLM 5.1 | glm-5.1 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| GLM 5 | glm-5 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Kimi K2.5 | kimi-k2.5 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Kimi K2.6 | kimi-k2.6 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Kimi K2.7 Code | kimi-k2.7-code | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Grok 4.5 | grok-4.5 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Grok Build 0.1 | grok-build-0.1 | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Big Pickle | big-pickle | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| MiMo-V2.5 Free | mimo-v2.5-free | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| North Mini Code Free | north-mini-code-free | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| Nemotron 3 Ultra Free | nemotron-3-ultra-free | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |
| DeepSeek V4 Flash Free | deepseek-v4-flash-free | `https://opencode.ai/zen/v1/chat/completions` | `@ai-sdk/openai-compatible` |

The [model id](https://opencode.ai/docs/config/#models) in your OpenCode config
uses the format `opencode/<model-id>`. For example, for GPT 5.5, you would
use `opencode/gpt-5.5` in your config.

* * *

### [Models](https://opencode.ai/docs/zen/\#models)

You can fetch the full list of available models and their metadata from:

```
https://opencode.ai/zen/v1/models
```

* * *

## [Pricing](https://opencode.ai/docs/zen/\#pricing)

We support a pay-as-you-go model. Below are the prices **per 1M tokens**.

| Model | Input | Output | Cached Read | Cached Write |
| --- | --- | --- | --- | --- |
| Big Pickle | Free | Free | Free | - |
| DeepSeek V4 Flash Free | Free | Free | Free | - |
| MiMo-V2.5 Free | Free | Free | Free | - |
| North Mini Code Free | Free | Free | Free | - |
| Nemotron 3 Ultra Free | Free | Free | Free | - |
| MiniMax M3 | $0.30 | $1.20 | $0.06 | - |
| MiniMax M2.7 | $0.30 | $1.20 | $0.06 | - |
| MiniMax M2.5 | $0.30 | $1.20 | $0.06 | - |
| GLM 5.2 | $1.40 | $4.40 | $0.26 | - |
| GLM 5.1 | $1.40 | $4.40 | $0.26 | - |
| GLM 5 | $1.00 | $3.20 | $0.20 | - |
| Kimi K2.7 Code | $0.95 | $4.00 | $0.19 | - |
| Kimi K2.6 | $0.95 | $4.00 | $0.16 | - |
| Kimi K2.5 | $0.60 | $3.00 | $0.10 | - |
| Qwen3.7 Max | $2.50 | $7.50 | $0.50 | $3.125 |
| Qwen3.7 Plus | $0.40 | $1.60 | $0.04 | $0.50 |
| Qwen3.6 Plus | $0.50 | $3.00 | $0.05 | $0.625 |
| Qwen3.5 Plus | $0.20 | $1.20 | $0.02 | $0.25 |
| DeepSeek V4 Pro | $1.74 | $3.48 | $0.145 | - |
| DeepSeek V4 Flash | $0.14 | $0.28 | $0.028 | - |
| Grok 4.5 (≤ 200K tokens) | $2.00 | $6.00 | $0.50 | - |
| Grok 4.5 (> 200K tokens) | $4.00 | $12.00 | $1.00 | - |
| Grok Build 0.1 | $1.00 | $2.00 | $0.20 | - |
| Claude Fable 5 | $10.00 | $50.00 | $1.00 | $12.50 |
| Claude Opus 4.8 | $5.00 | $25.00 | $0.50 | $6.25 |
| Claude Opus 4.7 | $5.00 | $25.00 | $0.50 | $6.25 |
| Claude Opus 4.6 | $5.00 | $25.00 | $0.50 | $6.25 |
| Claude Opus 4.5 | $5.00 | $25.00 | $0.50 | $6.25 |
| Claude Sonnet 5 | $2.00 | $10.00 | $0.20 | $2.50 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $0.30 | $3.75 |
| Claude Sonnet 4.5 (≤ 200K tokens) | $3.00 | $15.00 | $0.30 | $3.75 |
| Claude Sonnet 4.5 (> 200K tokens) | $6.00 | $22.50 | $0.60 | $7.50 |
| Claude Haiku 4.5 | $1.00 | $5.00 | $0.10 | $1.25 |
| Gemini 3.5 Flash | $1.50 | $9.00 | $0.15 | - |
| Gemini 3.1 Pro (≤ 200K tokens) | $2.00 | $12.00 | $0.20 | - |
| Gemini 3.1 Pro (> 200K tokens) | $4.00 | $18.00 | $0.40 | - |
| Gemini 3 Flash | $0.50 | $3.00 | $0.05 | - |
| GPT 5.6 Sol (≤ 272K tokens) | $5.00 | $30.00 | $0.50 | $6.25 |
| GPT 5.6 Sol (> 272K tokens) | $10.00 | $45.00 | $1.00 | $12.50 |
| GPT 5.6 Terra (≤ 272K tokens) | $2.50 | $15.00 | $0.25 | $3.125 |
| GPT 5.6 Terra (> 272K tokens) | $5.00 | $22.50 | $0.50 | $6.25 |
| GPT 5.6 Luna (≤ 272K tokens) | $1.00 | $6.00 | $0.10 | $1.25 |
| GPT 5.6 Luna (> 272K tokens) | $2.00 | $9.00 | $0.20 | $2.50 |
| GPT 5.5 (≤ 272K tokens) | $5.00 | $30.00 | $0.50 | - |
| GPT 5.5 (> 272K tokens) | $10.00 | $45.00 | $1.00 | - |
| GPT 5.5 Pro | $30.00 | $180.00 | $30.00 | - |
| GPT 5.4 (≤ 272K tokens) | $2.50 | $15.00 | $0.25 | - |
| GPT 5.4 (> 272K tokens) | $5.00 | $22.50 | $0.50 | - |
| GPT 5.4 Pro | $30.00 | $180.00 | $30.00 | - |
| GPT 5.4 Mini | $0.75 | $4.50 | $0.075 | - |
| GPT 5.4 Nano | $0.20 | $1.25 | $0.02 | - |
| GPT 5.3 Codex Spark | $1.75 | $14.00 | $0.175 | - |
| GPT 5.3 Codex | $1.75 | $14.00 | $0.175 | - |
| GPT 5.2 | $1.75 | $14.00 | $0.175 | - |
| GPT 5.2 Codex | $1.75 | $14.00 | $0.175 | - |
| GPT 5.1 | $1.07 | $8.50 | $0.107 | - |
| GPT 5.1 Codex | $1.07 | $8.50 | $0.107 | - |
| GPT 5.1 Codex Max | $1.25 | $10.00 | $0.125 | - |
| GPT 5.1 Codex Mini | $0.25 | $2.00 | $0.025 | - |
| GPT 5 | $1.07 | $8.50 | $0.107 | - |
| GPT 5 Codex | $1.07 | $8.50 | $0.107 | - |
| GPT 5 Nano | $0.05 | $0.40 | $0.005 | - |

You might notice _Claude Haiku 3.5_ in your usage history. This is a [low cost model](https://opencode.ai/docs/config/#models) that’s used to generate the titles of your sessions.

Note

Credit card fees are passed along at cost (4.4% + $0.30 per transaction); we don’t charge anything beyond that.

The free models:

- DeepSeek V4 Flash Free is available on OpenCode for a limited time. The team is using this time to collect feedback and improve the model.
- MiMo-V2.5 Free is available on OpenCode for a limited time. The team is using this time to collect feedback and improve the model.
- North Mini Code Free is available on OpenCode for a limited time. The team is using this time to collect feedback and improve the model.
- Nemotron 3 Ultra Free is available on OpenCode for a limited time. The team is using this time to collect feedback and improve the model.
- Big Pickle is a stealth model that’s free on OpenCode for a limited time. The team is using this time to collect feedback and improve the model.

[Contact us](mailto:help@anoma.ly) if you have any questions.

* * *

### [Auto-reload](https://opencode.ai/docs/zen/\#auto-reload)

If your balance goes below $5, Zen will automatically reload $20.

You can change the auto-reload amount. You can also disable auto-reload entirely.

* * *

### [Monthly limits](https://opencode.ai/docs/zen/\#monthly-limits)

You can also set a monthly usage limit for the entire workspace and for each
member of your team.

For example, let’s say you set a monthly usage limit to $20, Zen will not use
more than $20 in a month. But if you have auto-reload enabled, Zen might end up
charging you more than $20 if your balance goes below $5.

* * *

### [Deprecated models](https://opencode.ai/docs/zen/\#deprecated-models)

| Model | Deprecation date |
| --- | --- |
| GPT 5.2 Codex | July 23, 2026 |
| GPT 5.1 Codex | July 23, 2026 |
| GPT 5.1 Codex Max | July 23, 2026 |
| GPT 5.1 Codex Mini | July 23, 2026 |
| GPT 5 Codex | July 23, 2026 |
| Claude Opus 4.1 | August 5, 2026 |
| Claude Sonnet 4 | June 15, 2026 |
| Claude Haiku 3.5 | February 16, 2026 |
| Gemini 3 Pro | March 9, 2026 |
| MiniMax M2.5 | August 5, 2026 |
| MiniMax M2.1 | March 15, 2026 |
| GLM 5 | May 14, 2026 |
| GLM 4.7 | March 15, 2026 |
| GLM 4.6 | March 15, 2026 |
| Kimi K2.5 | August 5, 2026 |
| Kimi K2 Thinking | March 6, 2026 |
| Kimi K2 | March 6, 2026 |
| Qwen3 Coder 480B | February 6, 2026 |

* * *

## [Privacy](https://opencode.ai/docs/zen/\#privacy)

All our models are hosted in the US. Our providers follow a zero-retention policy and do not use your data for model training, with the following exceptions:

- Big Pickle: During its free period, collected data may be used to improve the model.
- DeepSeek V4 Flash Free: During its free period, collected data may be used to improve the model.
- MiMo-V2.5 Free: During its free period, collected data may be used to improve the model.
- North Mini Code Free: During its free period, collected data may be retained and used to improve the model. Do not submit personal or confidential data. See our [Terms of Use](https://cohere.com/terms-of-use) and [Privacy Policy](https://cohere.com/privacy).
- Nemotron 3 Ultra Free (NVIDIA free endpoints): Trial use only — do not submit personal or confidential data. Your use is logged for security purposes and to improve NVIDIA products and services. The logged session data for improvement purposes is not linked to your identity or any persistent identifier. For more information about our data processing practices, see our [Privacy Policy](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf). By interacting with this endpoint, you consent to our collection, recording, and use of such information and the [NVIDIA API Trial Terms of Service](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf).
- OpenAI APIs: Requests are retained for 30 days in accordance with [OpenAI’s Data Policies](https://platform.openai.com/docs/guides/your-data).
- Anthropic APIs: Requests are retained for 30 days in accordance with [Anthropic’s Data Policies](https://docs.anthropic.com/en/docs/claude-code/data-usage).

* * *

## [For Teams](https://opencode.ai/docs/zen/\#for-teams)

Zen also works great for teams. You can invite teammates, assign roles, curate
the models your team uses, and more.

Note

Workspaces are currently free for teams as a part of the beta.

Managing your workspace is currently free for teams as a part of the beta. We’ll be
sharing more details on the pricing soon.

* * *

### [Roles](https://opencode.ai/docs/zen/\#roles)

You can invite teammates to your workspace and assign roles:

- **Admin**: Manage models, members, API keys, and billing
- **Member**: Manage only their own API keys

Admins can also set monthly spending limits for each member to keep costs under control.

* * *

### [Model access](https://opencode.ai/docs/zen/\#model-access)

Admins can enable or disable specific models for the workspace. Requests made to a disabled model will return an error.

This is useful for cases where you want to disable the use of a model that
collects data.

* * *

### [Bring your own key](https://opencode.ai/docs/zen/\#bring-your-own-key)

You can use your own OpenAI or Anthropic API keys while still accessing other models in Zen.

When you use your own keys, tokens are billed directly by the provider, not by Zen.

For example, your organization might already have a key for OpenAI or Anthropic
and you want to use that instead of the one that Zen provides.

* * *

## [Goals](https://opencode.ai/docs/zen/\#goals)

We created OpenCode Zen to:

1. **Benchmark** the best models/providers for coding agents.
2. Have access to the **highest quality** options and not downgrade performance or route to cheaper providers.
3. Pass along any **price drops** by selling at cost; so the only markup is to cover our processing fees.
4. Have **no lock-in** by allowing you to use it with any other coding agent. And always let you use any other provider with OpenCode as well.

[Edit page](https://github.com/anomalyco/opencode/edit/dev/packages/web/src/content/docs/zen.mdx) [Found a bug? Open an issue](https://github.com/anomalyco/opencode/issues/new) [Join our Discord community](https://opencode.ai/discord)Select languageEnglishالعربيةBosanskiDanskDeutschEspañolFrançaisItaliano日本語한국어Norsk BokmålPolskiPortuguês (Brasil)РусскийไทยTürkçe简体中文繁體中文

© [Anomaly](https://anoma.ly/)

Last updated: Jul 14, 2026