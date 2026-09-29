# fitatu-mcp

Let your AI assistant (Claude, Cursor, and other MCP-compatible apps) read your **Fitatu** diet data: your meal plan, your meal schedule, your water intake, and your profile.

Once it's set up, you can ask your assistant things like:

- *"What's on my meal plan today?"*
- *"How much protein did I plan to eat each day last week?"*
- *"Did I drink enough water yesterday?"*
- *"Make me a shopping list from my meal plan for the next 3 days."*

> **Unofficial project.** This is not made by or affiliated with Fitatu. It talks to the same private API that the Fitatu app uses, so it may stop working if Fitatu changes things. It only **reads** your data and never changes anything in your account.

---

## Table of contents

1. [How it works (in plain words)](#how-it-works-in-plain-words)
2. [What you need](#what-you-need)
3. [Step 1: Install Node.js](#step-1-install-nodejs)
4. [Step 2: Download this project](#step-2-download-this-project)
5. [Step 3: Open a terminal in the project folder](#step-3-open-a-terminal-in-the-project-folder)
6. [Step 4: Install and build](#step-4-install-and-build)
7. [Step 5: Get your Fitatu login details](#step-5-get-your-fitatu-login-details)
8. [Step 6: Create your settings file](#step-6-create-your-settings-file)
9. [Step 7: Test the connection to Fitatu](#step-7-test-the-connection-to-fitatu)
10. [Step 8: Start the server](#step-8-start-the-server)
11. [Step 9: Connect your AI assistant](#step-9-connect-your-ai-assistant)
12. [Everyday use](#everyday-use)
13. [Troubleshooting](#troubleshooting)
14. [Keeping your account safe](#keeping-your-account-safe)
15. [For developers](#for-developers)

---

## How it works (in plain words)

- A small program (the **server**) runs on your computer.
- It logs in to Fitatu **as you**, using a login key you copy from the Fitatu website once.
- Your AI assistant asks the server questions ("give me today's meal plan"). The server fetches the answer from Fitatu and passes it back.
- The server is protected by a **password** you make up yourself, so only apps you set up can use it.

The whole setup takes about 15–20 minutes. You copy and paste a few commands, and you don't need to know how to program.

---

## What you need

- A computer running **macOS**, **Windows**, or **Linux**
- A **Fitatu account** with some data in it
- The **Google Chrome** browser (other browsers work too, but the instructions below use Chrome)
- An AI app that supports MCP, for example **Claude Desktop** or **Claude Code**

---

## Step 1: Install Node.js

Node.js is the free program that runs this server.

1. Go to **https://nodejs.org**.
2. Download the version marked **LTS** (the recommended one) and install it like any other app, clicking *Next* / *Continue* until it's done.
3. Check that it worked. Open a terminal:
   - **macOS:** press `Cmd + Space`, type **Terminal**, and press Enter.
   - **Windows:** press the Windows key, type **cmd**, and press Enter.

   Then type this and press Enter:

   ```
   node --version
   ```

   You should see something like `v22.11.0`. **The first number must be 20 or higher.** If you see "command not found", restart your computer and try again.

---

## Step 2: Download this project

1. At the top of this GitHub page, click the green **`<> Code`** button, then **Download ZIP**.
2. Unzip the file (double-click it on macOS; on Windows, right-click it and choose **Extract All…**).
3. Move the unzipped folder somewhere easy to find, for example your **Documents** folder. It will be called something like `fitatu-mcp-main`.

> If you already use git, you can run `git clone https://github.com/MaciejWiatr/fitatu-mcp.git` instead.

---

## Step 3: Open a terminal in the project folder

All the commands from here on must be typed **inside the project folder**.

- **macOS:** Open Terminal, type `cd ` (with a space after it), **drag the project folder from Finder into the Terminal window**, and press Enter.
- **Windows:** Open the project folder in File Explorer, click the address bar at the top, type `cmd`, and press Enter. A terminal opens already in the right place.

To check you're in the right place, type `ls` (macOS/Linux) or `dir` (Windows) and press Enter. You should see files like `package.json` and `README.md`.

---

## Step 4: Install and build

In the same terminal, run these two commands one after another:

```
npm install
```

```
npm run build
```

The first one downloads the building blocks the server needs, which can take a minute. The second one prepares the server to run. Warnings in yellow are fine. Only red **`ERR!`** lines mean something went wrong.

---

## Step 5: Get your Fitatu login details

The server needs two things from your Fitatu account: your **user ID** and a **refresh token** (a long login key). You copy them from the Fitatu website once.

1. In Chrome, go to **https://www.fitatu.com** and **log in**.
2. Open the developer console:
   - **macOS:** press `Cmd + Option + J`
   - **Windows / Linux:** press `Ctrl + Shift + J`

   A panel opens with a blinking cursor at the bottom. This is the **Console**.
3. **Type** (don't paste) this line and press Enter:

   ```js
   copy(JSON.parse(localStorage.user).refresh_token)
   ```

   Nothing visible happens, but your refresh token is now copied. Paste it into a note for a moment (`Cmd + V` / `Ctrl + V`). It's a long string of 128 letters and numbers.
4. Now type this line and press Enter:

   ```js
   copy(String(JSON.parse(localStorage.user).id))
   ```

   Your user ID is now copied. Paste it into your note as well.

> **Why type instead of paste?** Chrome blocks pasting into the console to protect you from scams. If you do paste, Chrome asks you to type `allow pasting` first.
>
> **Alternative without typing code:** in the developer panel, open the **Application** tab → **Local Storage** → `https://www.fitatu.com` → click the `user` row. You'll find `refresh_token` and `id` in the value shown below.

⚠️ **Treat the refresh token like a password.** Anyone who has it can read your Fitatu account. Don't share it or post it anywhere.

---

## Step 6: Create your settings file

The server reads its settings from a file named `.env` in the project folder.

**1. Create the file from the template.** In your terminal, run:

- **macOS / Linux:**
  ```
  cp .env.example .env
  ```
- **Windows:**
  ```
  copy .env.example .env
  ```

**2. Make up a password for the server.** Run this command. It prints a random 64-character password:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy what it prints and keep it in your note. You'll need it in this step and again in Step 9.

**3. Open the settings file** in a text editor:

- **macOS:** `open -e .env`
- **Windows:** `notepad .env`

**4. Fill in the three empty values** by pasting right after each `=` sign, with no spaces and no quotes:

```
FITATU_REFRESH_TOKEN=paste-your-128-character-refresh-token-here
FITATU_USER_ID=paste-your-user-id-here
MCP_BEARER_TOKEN=paste-the-password-you-generated-here
```

Leave the other lines as they are. Save the file and close the editor.

> Files starting with a dot are hidden by default. On macOS press `Cmd + Shift + .` in Finder to show them. On Windows, enable **View → Hidden items** in File Explorer.

---

## Step 7: Test the connection to Fitatu

Back in the terminal, run:

```
npm run bootstrap
```

If everything is right, you'll see something like:

```
fetching meal plan for 2026-09-28…
OK. session persisted. meal slots today: breakfast, second_breakfast, lunch, dinner
```

This also creates a file named `.fitatu-session.json`. From now on the server keeps its Fitatu login in this file and **renews it automatically**, so you won't need to copy a token from the website again (unless something goes wrong; see [Troubleshooting](#troubleshooting)).

If you see an error instead, jump to [Troubleshooting](#troubleshooting).

---

## Step 8: Start the server

```
npm start
```

You should see:

```
fitatu-mcp listening on :3333
```

**Leave this terminal window open.** The server only runs while the window is open. If you close it, your AI assistant loses access to Fitatu until you start the server again.

To check that it's alive, open **http://localhost:3333/healthz** in your browser. You should see `{"ok":true}`.

---

## Step 9: Connect your AI assistant

The server's address is:

```
http://localhost:3333/mcp
```

Every request must include the password from Step 6 as an `Authorization: Bearer <your password>` header. Pick your app below.

### Claude Desktop

1. Open Claude Desktop and go to **Settings → Developer → Edit Config**. This opens a file called `claude_desktop_config.json`.
2. Replace its contents with the text below. If the file already has other servers under `"mcpServers"`, add only the `"fitatu"` block next to them.

   ```json
   {
     "mcpServers": {
       "fitatu": {
         "command": "npx",
         "args": [
           "-y",
           "mcp-remote",
           "http://localhost:3333/mcp",
           "--allow-http",
           "--header",
           "Authorization:${AUTH_HEADER}"
         ],
         "env": {
           "AUTH_HEADER": "Bearer PASTE-YOUR-MCP_BEARER_TOKEN-HERE"
         }
       }
     }
   }
   ```

   Replace `PASTE-YOUR-MCP_BEARER_TOKEN-HERE` with your password from Step 6. Keep the word `Bearer` and the space after it.
3. Save the file, then **quit Claude Desktop completely** and open it again. On macOS use `Cmd + Q`; closing the window isn't enough.
4. Start a new chat. You should see **fitatu** listed under the tools / connectors icon.

> `mcp-remote` is a small helper that lets Claude Desktop talk to servers like this one. It's downloaded automatically the first time.

### Claude Code

Run this once in any terminal, replacing the placeholder with your password:

```
claude mcp add --transport http fitatu http://localhost:3333/mcp --header "Authorization: Bearer PASTE-YOUR-MCP_BEARER_TOKEN-HERE"
```

Then type `/mcp` inside Claude Code to confirm that **fitatu** shows as connected.

### Other apps (Cursor, etc.)

Any app that supports **Streamable HTTP** MCP servers with custom headers can connect directly. Use the URL `http://localhost:3333/mcp` and the header `Authorization: Bearer <your password>`. If the app only supports local ("stdio") servers, use the same `mcp-remote` setup shown for Claude Desktop.

---

## Everyday use

After the first setup, you only need to do this each time you want to use it:

1. Open a terminal in the project folder (see [Step 3](#step-3-open-a-terminal-in-the-project-folder)).
2. Run `npm start` and leave the window open.
3. Use your AI assistant as usual.

### What your assistant can do

| Tool | What it does |
| --- | --- |
| `get_meal_plan` | The full meal plan for one day: every meal, product, weight, calories and macros. Defaults to today. |
| `get_meal_plan_range` | Meal plans for a range of days (up to 60 days at once). |
| `get_meal_schedule` | Your default meal layout: which meals, at what times, and how calories are split between them. |
| `get_water` | Water intake for one day. Defaults to today. |
| `get_user` | Your Fitatu profile and subscription info. |

You don't need to call these yourself. Just ask your assistant in normal language and it picks the right tool.

---

## Troubleshooting

**`node: command not found` or `npm: command not found`**
Node.js isn't installed, or the terminal was opened before installing it. Install it ([Step 1](#step-1-install-nodejs)), then close and reopen the terminal. Restart the computer if it still doesn't work.

**`node: bad option: --env-file`**
Your Node.js is too old. Install the current **LTS** version from https://nodejs.org.

**`missing env: FITATU_USER_ID` / `missing env: MCP_BEARER_TOKEN`, or `FITATU_USER_ID required`**
The `.env` file is missing, is in the wrong folder, or has an empty value. Make sure the file is named exactly `.env` (not `.env.txt`), that it sits in the project folder, and that there's a value after each `=`.
*Windows tip:* Notepad sometimes saves as `.env.txt`. Run `dir /a` in the project folder to check the real name, and `ren .env.txt .env` to fix it.

**`refresh failed 401` or `refresh failed 400`**
Your Fitatu login key is no longer valid. This can happen after logging out of Fitatu, changing your password, or a long time without use. To fix it:
1. Stop the server (`Ctrl + C` in its terminal window).
2. Delete the file `.fitatu-session.json` from the project folder.
3. Get a fresh refresh token ([Step 5](#step-5-get-your-fitatu-login-details)) and put it in `.env`.
4. Run `npm run bootstrap`, then `npm start` again.

**`EADDRINUSE: address already in use :::3333`**
The server is already running in another terminal window, or another program uses port 3333. Close the other window, or change `PORT=3333` in `.env` to e.g. `PORT=3344`. If you change the port, update the address in your AI app's settings too.

**Claude says it can't reach the server, or "fitatu" doesn't show up**
- Is the server running? The `npm start` window must stay open, and http://localhost:3333/healthz should show `{"ok":true}`.
- Does the password in your AI app match `MCP_BEARER_TOKEN` in `.env` exactly? In Claude Desktop it must be written as `Bearer ` + password.
- Did you fully quit and reopen Claude Desktop after editing the config?

**`{"error":"unauthorized"}`**
The password your app sends doesn't match `MCP_BEARER_TOKEN` in `.env`. Copy it again carefully, with no extra spaces or quotes.

**"Today" shows yesterday's plan just after midnight**
"Today" is calculated in UTC time. Between midnight and about 1–2 AM (Polish time), ask for the date explicitly, e.g. *"show my meal plan for 2026-09-29"*.

---

## Keeping your account safe

- **Never share** your `.env` or `.fitatu-session.json` files, or post them online. They contain your Fitatu login. Both are excluded from git by `.gitignore`, so they won't be uploaded by accident.
- The server listens on your computer only. **Don't** expose it to the internet (port forwarding, tunnels, etc.) unless you know what you're doing and use HTTPS.
- To cut off access completely, stop the server and delete `.fitatu-session.json`. Logging out of Fitatu everywhere, or changing your Fitatu password, also invalidates the stored login.

---

## For developers

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run from source with auto-reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run bootstrap` | One-off: exchange `FITATU_REFRESH_TOKEN` for a session and verify it by fetching today's meal plan |

All scripts load `.env` via Node's `--env-file`, so **Node.js ≥ 20.6** is required.

### Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `FITATU_USER_ID` | yes | – | Numeric Fitatu user ID (`localStorage.user.id`) |
| `FITATU_REFRESH_TOKEN` | first run only | – | Seed refresh token (`localStorage.user.refresh_token`). Only used when the session file doesn't exist yet. |
| `MCP_BEARER_TOKEN` | yes | – | Shared secret clients must send as `Authorization: Bearer …` |
| `FITATU_STATE_PATH` | no | `./.fitatu-session.json` | Where the rotating `{accessToken, refreshToken, exp}` is persisted (mode `0600`) |
| `PORT` | no | `3333` | HTTP port |

### HTTP endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Liveness check, no auth |
| `POST` | `/mcp` | MCP Streamable HTTP transport (bearer auth) |
| `GET` / `DELETE` | `/mcp` | Session stream / session termination (bearer auth, requires `mcp-session-id`) |

### Session handling

Access tokens are JWTs. The server refreshes them 60 s before `exp`, and once more after any `401` response. Concurrent refreshes are de-duplicated. Fitatu rotates the refresh token on every refresh, and the new pair is written back to `FITATU_STATE_PATH`, so after the first run the value in `.env` is stale and ignored.

### Project layout

```
src/
  index.ts      Express app, bearer auth, MCP transport/session wiring
  server.ts     MCP tool definitions
  client.ts     Thin Fitatu API client (read-only endpoints)
  session.ts    Token refresh + authenticated fetch
  store.ts      File-backed session persistence
  bootstrap.ts  First-run token exchange + smoke test
```
