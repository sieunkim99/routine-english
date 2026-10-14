# RoutineEnglish Privacy

RoutineEnglish 0.4 uses your own OpenAI API key. There is no RoutineEnglish account or application server.

## What stays on your computer

Your API key, goal conversation, confirmed curriculum, practice responses, feedback and reminder settings are stored in `chrome.storage.local`. This is local extension storage, not an encrypted vault. Do not use a shared or public computer for a private API key. The key is available only to the extension's trusted contexts and is never returned to the learning UI after setup, placed into web pages, included in an export, or embedded in published source or releases. You can replace or delete it in Settings.

A captured page excerpt and an unfinished practice conversation are kept in `chrome.storage.session`; they survive panel closure but end with the browser session. Saved practice records include the page title, URL without query/fragment, learner and coach messages, hints and feedback. Text quoted by the conversation can appear in these saved messages.

## What is transmitted

When you connect a key, a small test request is sent directly to `https://api.openai.com/v1/responses` to verify access. This incurs a small API charge. When you send a goal message, start a conversation, answer a practice question or request feedback, the relevant goal, bounded page excerpt or review material, recent learning feedback and messages are sent directly to OpenAI. API usage is billed to your OpenAI account. We set `store:false`; this is not a claim of zero provider logging or retention. See [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data).

Voice is the default interaction mode, but microphone access starts only after a user action. You can switch to text. Speech input uses your browser’s SpeechRecognition service; pauses do not submit, and only the explicit completion action sends the transcript to OpenAI. Coach playback stops recognition, and switching to text or hiding the page cancels recording/restart. Audio may be processed by the browser provider. Check the transcript before sending. Speech recognition is not pronunciation assessment.

## Page access and reminders

Pages are read only after you click the extension action or the selection context menu. Only selected text or an extracted excerpt (up to 6,000 characters) is used. Page input fields, forms, hidden text and navigation are excluded from automatic extraction. Some protected pages, PDFs, embedded frames, videos and image-only pages cannot be extracted. The extension does not continuously capture screens or send browsing history.

The `idle` permission checks only whether the computer is active, idle or locked at reminder checks. It does not read keystrokes, screen contents or other applications. Alarms and notifications use your selected interval and time window without AI calls. Reminder state remains local.

## Your controls

You consent before initial API connection. Starting a page conversation sends the shown excerpt; you can inspect it first. You can pause reminders, change goals, and delete the saved key. Removing the extension deletes its local learning data. There are no analytics, ads, tracking services or shared provider credentials.

The public website is a clearly labelled installation preview using fixed example conversations. It never requests a real API key and stores only preview state in that tab's sessionStorage.
