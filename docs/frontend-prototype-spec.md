# Dōzobin frontend prototype brief

Build an interactive, frontend-only prototype for Dōzobin, a self-hosted tool for sharing files, pastes, and temporary content between devices. The prototype should make the product understandable through use, not through a marketing page.

Treat this document as a product brief rather than a wireframe. Choose the layout, component structure, color system, spacing, responsive composition, and motion yourself. The required screens and behavior below define what the prototype must communicate.

The display name is **Dōzobin**. Use `dozobin` for URLs, route slugs, package names, and other technical identifiers.

## What the prototype is for

The prototype should answer four questions:

1. Can a Guest share a file or paste without first creating an account?
2. What extra control does a signed-in Member receive?
3. Can two devices exchange temporary content through a code or QR scan?
4. Does the product still feel coherent when errors, expiration, and limits appear?

Build enough working interaction to judge those flows. Do not build a backend, real authentication, persistent storage, a production upload pipeline, or a real-time session service.

## Prototype rules

Keep all demo data in memory. Refreshing the browser may reset everything. Buttons, forms, mode switches, filters, dialogs, previews, and primary navigation should work within the current browser session; avoid dead controls on the main journeys.

Use mocked delays and progress where they help explain an upload or transition. A selected browser `File` may power a local preview, but no file needs to leave the browser. Use deterministic sample data for populated states.

The real product counts a Transfer Session page load or refresh as activity. The prototype does not need to survive an actual refresh; it only needs to display the countdown and communicate the rule.

## Product language

Follow the terms in [`CONTEXT.md`](../CONTEXT.md). In particular:

- A **File Share** contains exactly one uploaded file and has its own URL.
- A **Paste** contains one untitled body of text and has its own URL.
- A **Regular Share** means either of those; it never means a Transfer Item.
- A **Transfer Session** is a temporary device-handoff area that never requires an account.
- A **Transfer Item** belongs only to its Transfer Session and never appears in a Member's Library.

Do not introduce albums, upload bundles, shared folders, public feeds, or titles for Pastes.

## Required experience

The prototype needs a complete visible journey, including Guest, Member, and administrator states. Route names are up to you, and these screen groups do not prescribe a navigation pattern.

### Drop Workspace

Opening Dōzobin should lead straight to the working product. Do not put a promotional landing page, feature grid, pricing section, testimonial strip, or oversized sales headline in front of it.

The Drop Workspace has distinct **Files** and **Paste** modes. The prototype enables Guest sharing, so a signed-out visitor can use either mode immediately. Account actions and Transfer Sessions remain reachable without displacing the creation task.

A signed-in Member should also start from the Drop Workspace. Membership adds the Library and settings; it should not replace the product with a statistics dashboard.

### Files mode

Accept files through drag and drop, a file picker, and clipboard image paste. If someone selects five files, create five independent File Share results. Never combine them into an album, archive, or grouped share URL.

Represent each selected file separately with its own progress and result. Include these per-file outcomes:

- Waiting or ready to upload
- Uploading with visible progress
- Finished, with copy-link and open actions
- Failed, with a retry action
- Removed before upload

Regular share options include Share Expiration and optional password protection. Use plausible mocked expiration choices such as one hour, one day, seven days, thirty days, and never. The installation controls which options Guests and Members receive.

### Paste mode

The editor contains only the body. Do not add a title or filename field.

Detect the content type from the text when possible and allow a manual override. Support plain text, Markdown, and source code. Markdown needs edit and rendered-preview states; source code needs a language choice and language-aware coloring.

Apply the same Share Expiration and password options used by File Shares. The creation result should provide the new URL, copy and open actions, and a clear summary of expiration or protection.

### Public File Share view

An Unlisted Share opens for anyone holding its unguessable URL. Do not create public discovery or indexing screens.

Preview images, video, audio, and PDFs when the browser can display them. For unsupported formats, show useful metadata and make download the clear next action. Include filename, type, size, creation time, expiration, copy-link, and download behavior.

A Protected Share first presents a password challenge. Include wrong-password and locked-content states in the prototype.

### Public Paste view

Render Markdown and color source code according to the detected or chosen content type. Provide raw view, copy, download, line-number, and line-wrap behavior where it makes sense. Plain text should remain plain.

Show expiration without inventing a title. Protected Pastes use the same password challenge as Protected File Shares.

## Accounts and Member state

Provide mocked sign-in, registration, and password-reset journeys. Social login, two-factor setup, and email verification are outside this prototype.

The Member Library is a flat, persistent collection in the real product, though the prototype keeps it in memory. It should support search, File Share and Paste filtering, sorting by date, size, or expiration, bulk selection, and bulk deletion. Do not add folders, tags, nested collections, or albums.

Populate the Library with believable variation: images, an archive, a PDF, plain text, Markdown, source code, protected shares, shares nearing expiration, and one failed or unavailable item.

### Member Settings

Show enough detail to understand the settings model without implementing it:

- Profile details and avatar
- Light, dark, and system appearance choices
- Default Share Expiration
- Password change, active login sessions, and account deletion
- Storage usage and the installation-assigned storage limit
- API tokens with create, copy, mask, and revoke states
- A shallow ShareX setup area with a mocked configuration download or copy action

ShareX is not a special upload type. A future ShareX integration will create regular File Shares through an API. Do not build or simulate the API itself.

## Transfer Sessions

Transfer Sessions form a separate journey from regular sharing. They are temporary scratch spaces for moving files, screenshots, and text between devices, not another way to populate the Library.

Let someone either create a new Transfer Session or join an existing one. A new session exposes a QR code and an eight-character alphanumeric Access Code. Joining works through a mocked QR scan path or manual code entry; include invalid-code and expired-session outcomes.

Inside an active session:

- Every joined device is an equal Session Participant.
- Participants may add files, clipboard screenshots, or text as Transfer Items.
- Participants may preview, copy, download, and delete Transfer Items.
- Transfer Items do not receive permanent public share URLs.
- A participant may leave the session on the current device.
- Nobody may end the entire session early.

The session expires after twelve hours of inactivity and then removes every Transfer Item. Opening or refreshing the session, adding an item, downloading an item, or deleting an item resets the timer. A passive open tab does not.

Display enough session status to make expiry understandable: the Access Code, QR code, time remaining, recent activity, and an expired state. The exact composition belongs to the design.

## Administrator state

Include a mocked administrator settings area for the self-hosted installation. It should cover:

- Guest sharing and Member registration policies
- Allowed Share Expiration choices and defaults
- Whether Guests may password-protect shares
- Default Member storage quotas
- Maximum upload size
- Allowed or blocked file types

These controls do not need persistence. Show saved, unsaved, validation-error, and destructive-confirmation states so someone can judge the page as a product screen rather than a settings illustration.

## States the prototype must show

Cover the awkward cases. At minimum, make these reachable through sample data, controls, or dedicated preview routes:

- Empty and populated workspaces
- Uploading, finished, failed, and partially failed batches
- Invalid file type, oversized file, and storage quota reached
- Wrong share password and unavailable protected content
- Invalid Access Code and expired Transfer Session
- Expired or missing Regular Share
- Offline or interrupted action

Use confirmation before deleting a share, deleting Transfer Items, revoking a token, ending an active login session, or deleting an account.

## Design direction

Dōzobin should feel like a quiet utility that people can leave open all day. Favor precise type, legible metadata, obvious system status, useful keyboard behavior, and clear drag feedback. A restrained Japanese note may appear in the identity or small details, but avoid anime imagery, faux-Japanese decoration, and novelty copy.

Avoid generic startup styling: no purple gradient wash, glass panels, neon glow, giant rounded cards everywhere, centered marketing hero, or decorative metrics. Do not use emoji as interface icons.

Use these products as behavioral references, not visual templates:

- [Wormhole](https://wormhole.app/) for a focused file-entry action and clear expiration
- [PairDrop](https://pairdrop.app/) for accountless device handoff and code-based joining
- [GitHub Gist](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists) for readable code and unlisted sharing
- [Raycast](https://developers.raycast.com/api-reference/user-interface/list) for dense lists, keyboard access, and action clarity

Lovable or another coding agent owns the final layout and visual system. Originality matters more than resemblance to any reference.

## Responsive and accessible behavior

The main journeys must work on a narrow phone and a desktop. A phone should be able to create or join a Transfer Session, scan or display its QR code, upload from the device, copy text, and download an item without requiring a desktop-only interaction.

Use proper labels, visible keyboard focus, sufficient contrast, reduced-motion support, and non-drag alternatives. Status must not rely on color alone. Dialogs should trap focus and return it to the triggering control when closed.

## Out of scope

Do not build a backend, database, production authentication, email delivery, real QR scanner, actual API, real ShareX integration, billing, payment plans, public discovery, folders, tags, albums, or durable browser storage.

Security-related UI in this prototype communicates intended behavior only. Do not claim end-to-end encryption or other guarantees that the product has not established.

## Completion standard

The prototype is ready when:

- Opening it lands directly in the Drop Workspace.
- Guest, Member, administrator, public-share, and Transfer Session states are reachable.
- File and Paste creation flows react to input and show results.
- Someone can inspect public views, protection, expiration, and failure states.
- The Library and settings contain useful mock interactions.
- The experience works at phone and desktop widths with keyboard access.
- No core flow depends on a backend or survives refresh.
