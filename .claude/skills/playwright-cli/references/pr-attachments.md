# Attaching screenshots and videos to a pull request

`gh` 2.99+ uploads PNG, JPEG, GIF, WebP, SVG, MP4, MOV, and WebM with repeatable `--attach` on `gh pr create`, `gh pr comment`, `gh pr edit`, `gh issue create`, `gh issue comment`, and `gh issue edit`. Alt text for an image goes after `#`. Videos have no alt text.

Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md). Posting or creating a PR is a separate ask: write the body and the file paths, and run `gh` only after the user says to send it. Do not commit the media. Write it under `/tmp`.

Attach evidence when it saves a reviewer a checkout: a UI fix, a before/after pair, a short walkthrough, or a failure state. Skip it when the diff already shows the change.

```sh
npx playwright cli open http://127.0.0.1:8080/gyms
npx playwright cli screenshot --filename=/tmp/gyms-after.png
npx playwright cli video-start /tmp/gyms-flow.webm --size=1280x800
npx playwright cli click e5
npx playwright cli video-stop

gh pr comment 123 --body "Gyms list after the filter change." \
  --attach '/tmp/gyms-after.png#Gyms list after the filter change' \
  --attach /tmp/gyms-flow.webm
```

Reference a file in the body as `![alt](/tmp/gyms-after.png)` and `gh` rewrites the path to the uploaded URL. Unreferenced attachments are appended in flag order.

## Limits

- Images up to 10 MB. Videos up to 10 MB on free plans and 100 MB on paid plans. Keep recordings short.
- The upload needs push access to the repository.
- GitHub.com and GitHub Enterprise Cloud only.

Failure artefacts from a test run already land in `test-results/` when the config retains screenshots or video on failure. The same `--attach` flag sends those files. A workflow change for that belongs in `bjjeire-ci-templates`, and only when the user asks. Recording a walkthrough is [video-recording.md](video-recording.md).
