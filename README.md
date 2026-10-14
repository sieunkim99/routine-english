# RoutineEnglish 🌱

**An English coach that remembers your goal and helps you practice with what you are already reading.**

**영어로 하고 싶은 일을 AI와 이야기하면, 코치가 목표와 커리큘럼을 준비합니다. 평소에는 현재 페이지로 대화하거나 지난 대화를 복습하는 두 가지에만 집중합니다.**

## Install — no server needed

1. Download `routine-english-extension.zip` from this repository's Releases and unzip it.
2. In Chrome, open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the unzipped folder containing `manifest.json`.
3. The full-page setup opens automatically. Consent to the data notice, paste **your own OpenAI API key**, and choose a reminder interval. The extension validates the key with a small billed request.
4. Talk with the coach **in English**, by chat or optional English voice input. It uses your own English replies to infer a tentative starting level while discovering your goal, asks a few natural follow-up questions, and drafts your goal, scope, first step and 3–5 connected learning abilities. Confirm the plan or ask for a revision.
5. On a page you want to read, click the extension icon. The side panel offers **Current-page conversation** and **Review**.

You do not need Node, a terminal, a connection code or a running server to use the extension. Each person supplies their own API key. Do not put a shared key in the source: it would be extractable and could create unlimited charges for its owner. A future shared-key edition needs a server with accounts and usage limits.

This is an unpacked extension release, not a Chrome Web Store listing. To update it, replace the files and click Reload on its card in `chrome://extensions`.

## What the agent does

- **Understand:** a short adaptive **English** conversation discovers the desired future self, personally meaningful goal and scope while observing vocabulary, sentence construction and comprehension. The proposed level is a tentative starting point, not a certified CEFR assessment. No profile forms.
- **Plan:** AI analyses that conversation into a provisional goal and specific, connected curriculum. The learner only confirms the direction or describes a change.
- **Act:** a local rule checks the chosen interval and time window while the computer is active. The extension proactively suggests learning through Chrome notifications. No LLM polling or continuous page monitoring.
- **Observe:** page text plus the curriculum, level and recent performance guide the opening question and follow-up dialogue. The coach reacts to actual answers and offers one useful improvement.
- **Adapt:** feedback, hint use and all attempts are saved automatically. Review dates and recent difficulty select the next ability; recent responses and feedback inform the next AI activity.

The everyday panel has only **Current page** and **Review**. Settings, goal changes and curriculum details live in the extension's full-page settings website, opened with the gear icon. The settings website and panel use the same extension storage automatically.

### Proactive reminders

Choose an interval from 15–480 minutes (default 60) and a daytime window (default 09:00–22:00). Conditions are checked every five minutes, so a notification may arrive up to approximately five minutes after the chosen interval, or later after computer sleep. Reminders are skipped when the machine is idle/locked or a learning conversation is underway. Completing learning resets the interval. Notifications offer learning or a 30-minute snooze; macOS may show notification buttons differently. OS notification settings can suppress notifications. Chrome must be running.

A notification can open review without page access. Reading a new page requires clicking the extension icon on that page; the notification does not grant `activeTab` access. If Chrome does not permit opening a side panel from a notification, the extension opens the learning view in a tab.

### Conversations and review

A brief conversation runs for up to three responses or can end earlier for feedback. The coach evaluates meaning and one useful improvement, not exact-string matching. Reading aloud and optional English speech-to-text are supported where the browser provides them. Speech transcripts can be corrected before sending; no pronunciation scoring is claimed.

Review prioritizes due abilities, then unpracticed abilities, then weaker recent performance. Review intervals are simple 1/2/7-day rules with hint adjustment, not SM-2 or a validated optimal schedule. All attempts are preserved. Short task scores are not overall English proficiency or a goal-completion percentage.

## Learning foundations

The design connects Ideal L2 Self (envisioning personally meaningful English use), autonomy-supportive goal choice, retrieval before revealing answers, spaced practice, reduced assistance and transfer across different content. These principles guide implementation; the product's efficacy has not been established by a learner study. Longer independent goal-relevant tasks are needed to assess actual transfer beyond short conversations.

References: [Ideal L2 Self intervention](https://doi.org/10.1016/j.system.2019.01.003), [Self-determination in education](https://selfdeterminationtheory.org/SDT/documents/2009_NiemiecRyan_TRE.pdf), [Spacing and retrieval](https://doi.org/10.1038/s44159-022-00089-1).

## API and privacy

The key is kept in trusted-context-only `chrome.storage.local`, not an encrypted vault. It is never embedded into source, returned in UI snapshots or sent to a page. Requests go directly from the extension worker to OpenAI Responses API, using `gpt-4o-mini` and Structured Outputs. No provider secrets are shared by this project. Invalid keys, quota errors, refusals and network errors are shown explicitly; production never silently replaces AI with simulated replies.

A selected passage or extracted page excerpt up to 6,000 characters is staged locally when you invoke the extension. You can inspect it before starting. The start action sends that content and relevant learning context to OpenAI under initial consent. The source is treated as untrusted learning material, not as instructions. API calls have no browser automation tools.

Permissions: storage, alarms, notifications, idle, sidePanel, activeTab, scripting, contextMenus. The sole persistent host permission is `https://api.openai.com/*`; there is no all-sites host permission or local-server permission. Restricted Chrome pages, some PDFs, embedded frames, canvas, images and videos may not yield usable text. Prefer selecting article text and clicking the icon. See [PRIVACY.md](PRIVACY.md).

## Develop and preview

Node.js 22+. No external packages are required.

```sh
npm test
npm run build
npm run dev
```

Preview: **http://127.0.0.1:5173/**. The website is a clearly labelled fixed-example preview of onboarding and learning, not a live AI session; it never requests a real key. Live AI operates in the installed extension. `npm run dev` only serves the preview and is not needed for actual use.

Build outputs:

- `dist/extension`: installable unpacked extension, including its full-page settings site.
- `dist/routine-english-extension.zip`: standalone installer archive.
- `dist/web`: static installation preview with the archive; suitable for GitHub Pages.

Source: `shared/ai.js` (provider requests and schemas), `shared/controller.js` (agent actions and storage), `shared/state.js` (learning/review/reminder rules), `shared/app.js` (minimal UI), `extension/background.js` (Chrome integration), `extension/extract.js` (page extraction).

Tests use mocked provider responses and Chrome APIs to check key privacy, goal-to-plan flow, real request format, answer preservation, adaptive review, reminders and extraction. A user API key is required to verify real model output, billing and quality. Native Chrome installation and microphone/OS notification delivery also require device verification.

## Share and contribute

The source is available under the MIT license. The GitHub workflow tests and builds each push, packages the installer, and publishes the static preview through GitHub Pages. Please avoid including personal keys or learning data in issues or commits.
