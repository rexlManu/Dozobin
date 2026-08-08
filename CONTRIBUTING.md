# Contributing

Open an issue before starting a large feature or changing Dōzobin's data model. Small fixes can go straight to a pull request.

Use DDEV for PHP commands and pnpm for frontend packages. Don't commit `.env`, built assets, uploaded payloads, or generated Wayfinder files.

Run the full check before pushing:

```sh
ddev exec composer ci:check
```

Keep pull requests focused. Explain the user-visible change, note any migration or worker impact, and add a Pest regression test when behavior changes. Frontend changes should include screenshots at desktop and phone widths.

By submitting a contribution, you agree that the project may distribute it under the MIT License.
