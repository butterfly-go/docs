# Butterfly docs

Source of the Butterfly documentation site, built with [VitePress](https://vitepress.dev/). The framework itself lives in [butterfly-go/core](https://github.com/butterfly-go/core).

```bash
npm install
npm run docs:dev      # local preview
npm run docs:build    # production build, also fails on dead links
```

The pages under `guide/`, `stores/`, `observability/` and `advanced/` mirror the Markdown in the `docs/` directory of the core repository. When the framework's behavior changes, update both.
