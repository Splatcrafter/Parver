# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Support Status   | End of Support |
|---------|------------------|----------------|
| 0.1.x   | ✅ Active Support | -              |

If you are using an older version, we **strongly recommend upgrading** to the latest stable release.

---

## Security Features

## Supply Chain Security

### Artifact Integrity & Signing

All official release artifacts of **ParVer** are **cryptographically signed** to guarantee integrity and authenticity.

- All release artifacts are **GPG signed**
- Signatures are generated during the release pipeline
- Each published artifact is accompanied by a corresponding `.asc` signature file
- Consumers can verify artifacts before usage

Example verification flow:

```
gpg --verify artifact.jar.asc artifact.jar
```

Unsigned or modified artifacts **must not be trusted**.

---

### Signing Keys

- A **dedicated GPG key** is used for automated GitHub releases and deployments
- Release signing keys are **separate from personal developer keys**
- Private key material is **never committed** to the repository
- Keys are stored securely using CI secret management

The signing process is fully automated and enforced during release builds.

---

## Reporting a Vulnerability

If you discover a security vulnerability in **ParVer**, please report it **privately**.

### Contact

- **Email:** `security@splatgames.de`
- **GitHub Security Advisories:**  
  https://github.com/splatcrafter/parver/security/advisories/new
- **GitHub Issues:**  
  Do **not** report security vulnerabilities in public issues.

---

## Disclosure Process

1. Report the issue privately
2. Acknowledgment within **48 hours**
3. Fix timeline provided within **7 days**
4. Critical vulnerabilities (CVSS ≥ 9.0): patch within **72 hours**
5. High severity (CVSS ≥ 7.0): patch within **14 days**
6. Security advisory published after resolution

---

## Response Time SLA

| Severity                 | Acknowledgment | Fix Timeline |
|--------------------------|----------------|--------------|
| Critical (CVSS 9.0–10.0) | 24 hours       | 72 hours     |
| High (CVSS 7.0–8.9)      | 48 hours       | 14 days      |
| Medium (CVSS 4.0–6.9)    | 48 hours       | 30 days      |
| Low (CVSS 0.1–3.9)       | 72 hours       | Next release |

---

## Vulnerability Disclosure Policy

We follow a **coordinated disclosure** process:

1. Private disclosure
2. Fix development
3. Advisory preparation
4. Coordinated release
5. Public disclosure after a grace period

---

## Security Audits

Security audits are welcome.

- Contact `security@splatgames.de` before starting
- Follow responsible disclosure practices
- Researchers may be credited with permission

---

## PGP Key

For encrypted communication and release verification:

- **Key Purpose:** Release artifact signing
- **Key ID:** 37B59B93DC756EE8
- **Fingerprint:** C6BE25BF2A4639A67A491EBD37B59B93DC756EE8
- **Accessable in repository:** `KEYS`

Contact: **security@splatgames.de**

---

Thank you for helping keep **ParVer** secure.