# Dear Meow Privacy

Dear Meow uses your own OpenAI API key. There is no Dear Meow account or application server.

## What stays on your computer

Your API key, goal conversation, confirmed curriculum, practice responses, feedback and reminder settings are stored in `chrome.storage.local`. This is local extension storage, not an encrypted vault. Do not use a shared or public computer for a private API key. The key is available only to the extension's trusted contexts and is never returned to the learning UI after setup, placed into web pages, included in an export, or embedded in published source or releases. You can replace or delete it in Settings.

A captured page excerpt and an unfinished practice conversation are kept in `chrome.storage.session`; they survive panel closure but end with the browser session. Saved practice records include the page title, URL without query/fragment, learner and coach messages, hints and feedback. Text quoted by the conversation can appear in these saved messages.

## What is transmitted

When you connect a key, a small test request is sent directly to `https://api.openai.com/v1/responses` to verify access. This incurs a small API charge. When you send a goal message, start a conversation, answer a practice question or request feedback, the relevant goal, bounded page excerpt or review material, recent learning feedback and messages are sent directly to OpenAI. API usage is billed to your OpenAI account. We set `store:false`; this is not a claim of zero provider logging or retention. See [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data).

Voice is the default interaction mode, but microphone access starts only after a user action. You can switch to text. Speech input uses your browser’s SpeechRecognition service; pauses do not submit, and only the explicit completion action sends the transcript to OpenAI. Coach playback stops recognition, and switching to text or hiding the page cancels recording/restart. Audio may be processed by the browser provider. Check the transcript before sending. Speech recognition is not pronunciation assessment.

## Page access and reminders

Pages are read after you invoke the action, shortcut or selection context menu, or click the enabled floating buddy to start small talk. Only selected text or an extracted excerpt (up to 6,000 characters) is used. Page input fields, forms, hidden text and navigation are excluded from automatic extraction. Some protected pages, PDFs, embedded frames, videos and image-only pages cannot be extracted. The extension does not continuously capture screens or send browsing history. The optional buddy requests HTTP/HTTPS host access only when you enable it, to display its UI across websites. Its content script displays the cat and handles clicks/invitations; the worker reads page content when you click it to start. The buddy receives only enabled/quiet status, never your key, profile or learning records. Turning the buddy off unregisters it and removes the optional host grants. Required OpenAI host access remains for direct API use.

The `idle` permission checks only whether the computer is active, idle or locked at reminder checks. It does not read keystrokes, screen contents or other applications. Alarms and notifications use your selected interval and time window without AI calls. Reminder state remains local.

## Your controls

You consent before initial API connection. The icon/shortcut stages an excerpt you can inspect before starting. Clicking the enabled buddy starts a page conversation directly and sends the extracted excerpt under the initial consent. Completed expressions, meanings and self-rated review history stay local; expression card review makes no AI requests. You can pause reminders, change goals, and delete the saved key. Removing the extension deletes its local learning data. There are no analytics, ads, tracking services or shared provider credentials.

The public website is a clearly labelled installation preview using fixed example conversations. It never requests a real API key and stores only preview state in that tab's sessionStorage.

## Dear Meow 추가 데이터

고양이 이름·선택 관심사·명시적으로 저장한 이야기 요약/다음 질문·츄르/활동 횟수는 로컬에 남습니다. 이야기 요약은 저장 전 화면에 표시하며 설정에서 이어갈 목록의 요약을 삭제할 수 있으며 별도의 대화/표현 기록은 유지됩니다. 몰래 도움창의 한국어/영어 초안과 맥락은 OpenAI에 전달되어 표현 도움을 생성합니다. 본 대화에 자동 제출하지 않지만 사용을 선택한 도움 초안·문장·핵심 표현은 로컬 학습 기록에 저장되고 후속 피드백 요청에 포함됩니다. ‘몰래’는 별도 도움창이라는 뜻이며 AI 제공자로부터 비밀이라는 뜻이 아닙니다. 고양이 content script에는 이름·표시 상태·동작 상태만 전달하고 관심사·이야기 기억·도움 초안·학습 기록·키를 전달하지 않습니다.
