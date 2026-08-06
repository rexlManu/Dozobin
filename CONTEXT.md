# Dōzobin

Dōzobin is a direct workspace for sharing files and text. An installation may allow Guest sharing, while Transfer Sessions never require an account.

## Language

**Drop Workspace**:
The entry screen where someone can immediately create a share. It is the product itself, not a promotional page or an overview someone must navigate past.
_Avoid_: Landing page, dashboard, home page

**File Share**:
A single uploaded file with its own access URL. Several files uploaded together still become independent File Shares.
_Avoid_: Album, bundle, collection, multi-file Drop

**Paste**:
A single untitled body of text with its own access URL. Dōzobin detects its content type or accepts a manual choice, and the Paste remains distinct from a File Share.
_Avoid_: Text file, note, snippet

**Regular Share**:
Either a File Share or Paste created outside a Transfer Session. It has its own URL and follows the installation's regular access and expiration rules.
_Avoid_: Transfer Item, session upload

**Guest**:
A person using regular sharing without signing in. Whether Guests may create File Shares and Pastes is chosen for each Dōzobin installation.
_Avoid_: Anonymous User, unauthenticated User

**Member**:
A signed-in person whose File Shares and Pastes remain available in a persistent Library and who can manage personal settings.
_Avoid_: User, account holder, registered Guest

**Library**:
A Member's persistent collection of File Shares and Pastes.
_Avoid_: Dashboard, file manager, local history

**Share Expiration**:
The chosen time after which Dōzobin removes a regular File Share or Paste. The Dōzobin installation controls available choices and defaults; Transfer Session inactivity follows a different rule.
_Avoid_: Session timeout, inactivity window

**Unlisted Share**:
A regular File Share or Paste that is accessible to anyone holding its unguessable URL but is absent from public feeds and search indexes.
_Avoid_: Public listing, private share

**Protected Share**:
An Unlisted Share that also requires a password chosen during creation.
_Avoid_: Private Share, encrypted share

**Transfer Session**:
An accountless, temporary scratch space used to move content between devices. Its contents remain separate from regular File Shares and Pastes and disappear after twelve hours of inactivity; no participant can remove the whole session early.
_Avoid_: Account, room, shared folder, browser session

**Access Code**:
The eight-character alphanumeric credential used to join a Transfer Session without scanning its QR code.
_Avoid_: Password, PIN, login code

**Session Activity**:
An action that restarts a Transfer Session's twelve-hour inactivity period. Opening or refreshing the session and adding, downloading, or deleting a Transfer Item count; merely leaving a tab open does not.
_Avoid_: Heartbeat, background connection

**Session Participant**:
A device that joined a Transfer Session through its QR code or Access Code. Every participant has equal permission to add, download, copy, and delete Transfer Items.
_Avoid_: Owner, host, guest, administrator

**Transfer Item**:
A file, screenshot, or piece of text placed inside a Transfer Session. It exists only within that session and does not become a regular File Share or Paste.
_Avoid_: File Share, Paste, permanent upload
