# Dōzobin

Dōzobin is a direct workspace for sharing files and text. An installation may allow Guest sharing, while Transfer Sessions never require an account.

## Language

**Drop Workspace**:
The entry screen where someone can immediately create a share. It is the product itself, not a promotional page or an overview someone must navigate past.
_Avoid_: Landing page, dashboard, home page

**File Share**:
A single uploaded file with its own Share URL. Several files uploaded together still become independent File Shares. Optional malware scanning applies only to File Share payloads.
_Avoid_: Album, bundle, collection, multi-file Drop

**Paste**:
A single untitled body of text with its own Share URL. Dōzobin detects its content type or accepts a manual choice, and the Paste remains distinct from a File Share.
_Avoid_: Text file, note, snippet

**Regular Share**:
Either a File Share or Paste created outside a Transfer Session. It has its own Share URL and follows the installation's regular access and expiration rules.
_Avoid_: Transfer Item, session upload

**Share URL**:
The unlisted address used to access a Regular Share. It continues to resolve after expiration even when the payload has been removed.
_Avoid_: Share, public listing

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
The chosen time after which access to a Regular Share ends. The installation controls available choices and defaults; Transfer Session inactivity follows a different rule.
_Avoid_: Session timeout, inactivity window, deletion time

**Expired Share**:
A Regular Share whose access window has ended. Cleanup removes its payload after the configured grace period, while its database record and Share URL remain indefinitely.
_Avoid_: Deleted Share

**Payload**:
The stored file contents or Paste body belonging to a Regular Share. Expired Share cleanup removes either form after the same installation-wide grace period.
_Avoid_: Share, link, metadata

**Unlisted Share**:
A Regular Share that is accessible to anyone holding its unguessable Share URL but is absent from public feeds and search indexes.
_Avoid_: Public listing, private share

**Protected Share**:
An Unlisted Share that also requires a password chosen during creation.
_Avoid_: Private Share, encrypted share

**Blocked File Share**:
A File Share whose payload was identified as malicious and removed. Its database record and Share URL remain, the payload cannot be accessed, and the blocked state remains publicly authoritative even after Share Expiration.
_Avoid_: Expired Share, deleted file

**Unscanned File Share**:
A publicly accessible File Share for which malware scanning was enabled but produced no result. Administrators can see the failed-scan status, but scanner failure never blocks access.
_Avoid_: Clean File Share, Blocked File Share

**Malware Scan**:
An inspection of a File Share payload by a Scanner. A result may mark the File Share clean or blocked; a technical failure leaves it publicly accessible and records an administrator-visible failure.
_Avoid_: Upload validation, synchronous scan

**Scanner**:
A service that inspects File Share payloads for malicious content.
_Avoid_: File-type validation, upload validation

**Transfer Session**:
An accountless, temporary scratch space used to move content between devices. Its contents remain separate from Regular Shares. After its inactivity window ends, the session, its items, participant details, and activity history are deleted completely.
_Avoid_: Account, room, shared folder, browser session

**Access Code**:
The eight-character alphanumeric credential used to join a Transfer Session without scanning its QR code.
_Avoid_: Password, PIN, login code

**Session Activity**:
An action that restarts a Transfer Session's inactivity period. Opening or refreshing the session and adding, downloading, or deleting a Transfer Item count; merely leaving a tab open does not.
_Avoid_: Heartbeat, background connection

**Session Participant**:
A device that joined a Transfer Session through its QR code or Access Code. Every participant has equal permission to add, download, copy, and delete Transfer Items.
_Avoid_: Owner, host, guest, administrator

**Transfer Item**:
A file, screenshot, or piece of text placed inside a Transfer Session. It exists only within that session and does not become a File Share or Paste.
_Avoid_: Regular Share, permanent upload
