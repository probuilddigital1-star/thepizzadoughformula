# Page dates

Publication and modification dates come from the git history of each page's source file, so they
reflect when the content actually changed. Nothing is stamped with the time of the build.

| Where the date appears | Value used |
| --- | --- |
| `lastmod` in `sitemap-0.xml` | The page file's most recent commit date |
| `dateModified` in the Article schema | The same commit date |
| `datePublished` in the Article schema | The commit that added the file |
| The visible "Last updated" line on content pages | The same modification date |

`scripts/page-dates.mjs` reads the history. `astro.config.mjs`, `src/layouts/BaseLayout.astro` and the
content pages call it. A page can still pass `datePublished` or `dateModified` to `BaseLayout`
explicitly, and that wins. Pages whose history cannot be determined, such as a file that is not yet
committed, go out with no `lastmod` and no schema dates rather than an invented one.

Routes map back to source files by path: `/about/` comes from `src/pages/about.astro`, and
`/pizza-styles/new-york/` from the dynamic route `src/pages/pizza-styles/[style].astro`. Every style
page therefore shares that file's dates.

## The fallback file

Cloudflare Pages may build from a shallow clone, where git can only see recent commits, or from a
workspace with no git history at all. When `scripts/page-dates.mjs` detects that, it reads
`src/data/page-dates.json` instead. That file is checked in.

Refresh it whenever page content changes, and commit it with the change:

```bash
npm run update:page-dates
```

The script refuses to write if git history is unavailable or shallow, so a bad environment cannot
overwrite good dates. Run it after committing the content change, so the dates it records include
that commit. A stale file only means the affected page shows and reports an older modification date.
