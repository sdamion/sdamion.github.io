# Local website with the live backend

Use Node.js 22 or newer. From this repository, run:

```sh
PORT=8011 node dev-server.mjs
```

Open <http://127.0.0.1:8011/>.

The local website uses the same live backend as the public website:
`https://api.tdsp.online`. The local server forwards the API requests, including
Ask AI, so you do not need Unraid IP addresses, a local backend or local Ollama.
An internet connection and an available public backend are required.

Open <http://127.0.0.1:8011/__health_proxy__> to check the backend connection.
Opening `index.html` directly or using a plain static server does not provide
these proxy routes.

Existing environment overrides still work. Unset `TDSP_API_ORIGIN` and any
endpoint-specific overrides to use the public backend everywhere. Restart the
server after changing configuration. Use another port (for example `8012`) for
automated tests so the development server stays available.
