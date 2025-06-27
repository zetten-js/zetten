# Zetten

**Zetten** is a minimalist, file-based full-stack framework for Node.js — inspired by the App Router concept from Next.js. It automatically loads **HTTP routes**, **queues**, **cron jobs**, and **bootstrap scripts** based on the file system.

Zetten is currently in **active development**. Expect breaking changes and missing features as the framework evolves.

---

## 📦 Installation

```bash
npm install zetten fastify
# or
pnpm add zetten fastify
````

> Zetten uses `fastify` as a peer dependency (for now), so make sure to install it manually.

---

## 🚀 Quick Start

Create the following structure:

```
.
├── index.ts
└── routes/
    └── get.handler.ts
```

### `index.ts`

```ts
import { Zetten } from 'zetten';
import { FastifyAdapter } from 'zetten/core/server/adapter/fastify';
import { HandlerPlugin } from 'zetten/handler';

const zetten = new Zetten({
  adapter: new FastifyAdapter(),
  port: 3030,
});

zetten.registerPlugin(new HandlerPlugin('./routes'));

zetten.start();
```

### `routes/get.handler.ts`

```ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { HandlerOptions } from '@/handler';

export async function handler(_: FastifyRequest, reply: FastifyReply) {
  reply.send({ hello: 'zetten' });
}

export const options: HandlerOptions = {
  schema: {}, // You can define params, body, query validation here using Zod
};
```

### 🔗 Access

Run your app and visit: [http://localhost:3030](http://localhost:3030)
You should see:

```json
{ "hello": "zetten" }
```

---

## 🧩 Plugins by Convention

Zetten will automatically scan and load files based on folder + filename conventions:

| Plugin    | File Pattern      |
| --------- | ----------------- |
| Routes    | `**/*.ts` |
| Queue     | `**/*.ts` |
| Cron Jobs | `**/*.ts` |
| Bootstrap | `**/*.ts` |

> All plugins are optional and modular.

---

## 📅 Roadmap

* [x] File-based route loader
* [x] Fastify adapter
* [ ] Cron job support
* [ ] Queue worker support
* [ ] Bootstrap scripts
* [ ] Authentication plugin
* [ ] Express and Hono adapters
* [ ] CLI tooling (`zetten dev`, `zetten build`, etc)
* [ ] Plugin lifecycle system
* [ ] Docs generation and introspection

---

## 📄 License

MIT © 2025 [Mayron Fernandes](https://github.com/mayron1806)

```
