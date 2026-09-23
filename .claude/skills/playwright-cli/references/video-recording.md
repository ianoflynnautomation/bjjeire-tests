# Video recording

Records a WebM of the CLI session. Repo rules and the invocation (`npx playwright cli`) are in [../SKILL.md](../SKILL.md). Write the file under `/tmp`. Attaching it to a PR is [pr-attachments.md](pr-attachments.md), and only after the user asks to post.

```sh
npx playwright cli open http://127.0.0.1:8080
npx playwright cli video-start /tmp/gyms.webm --size=1280x800
npx playwright cli video-chapter "Gyms" --description="Open the list" --duration=2000
npx playwright cli goto http://127.0.0.1:8080/gyms
npx playwright cli snapshot
npx playwright cli video-show-actions --duration=800 --position=top-right --cursor=pointer
npx playwright cli click e1
npx playwright cli video-hide-actions
npx playwright cli video-stop
```

`--size` is `WIDTHxHEIGHT`. Omitted, the frame fits 800×800. `video-show-actions` draws a callout on each later CLI action. `--duration` is how long it stays (default 500 ms) and paces the action. `--position` is `top-left`, `top`, `top-right` (default), `bottom-left`, `bottom`, or `bottom-right`. `--cursor=pointer` animates a pointer between action points; `--cursor=none` hides it.

Chapter cards and action callouts do not receive clicks. Leave them up while you interact.

## A scripted walkthrough

For a paced demo, drive `page.screencast` from `run-code` instead of interleaving CLI clicks. `start` takes `path`, `size`, and `quality`. `showActions` takes `duration`, `position`, `fontSize`, and `cursor` (`pointer` or `none`). `showChapter` takes a title plus `description` and `duration`. `showOverlay` takes an HTML string and an optional `duration`; without a duration, call `dispose()` on the handle it returns. `hideOverlays` / `showOverlays` toggle every overlay.

```js
async page => {
  await page.screencast.start({ path: '/tmp/gyms.webm', size: { width: 1280, height: 800 } });
  await page.screencast.showActions({ duration: 800, cursor: 'pointer', position: 'top-right' });
  await page.screencast.showChapter('Gyms', {
    description: 'Search narrows the seeded list.',
    duration: 2000,
  });
  await page.goto('http://127.0.0.1:8080/gyms');
  const note = await page.screencast.showOverlay(`
    <div style="position:absolute;top:8px;right:8px;padding:6px 12px;
      background:rgba(0,0,0,.7);border-radius:8px;color:white;font-size:13px;">
      Seeded gyms
    </div>
  `);
  await page.getByTestId('gyms-page-search').getByTestId('search-input').pressSequentially('Alliance', { delay: 60 });
  await note.dispose();
  await page.screencast.stop();
};
```

Save that function under `/tmp` and run `npx playwright cli run-code --filename=/tmp/gyms-video.js`. A video script is not an acceptance spec. Specs do not use `page.goto` for an app route, and they do not use `waitForTimeout`.

A trace is the better artefact when you need the DOM and the network. See [tracing.md](tracing.md).
