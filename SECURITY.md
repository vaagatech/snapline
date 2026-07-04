# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x – 0.2.x | Yes       |

## Reporting a vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub Issue for security-sensitive reports
2. Email **security@vaagatech.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected package and version
   - Potential impact assessment
3. Allow up to **72 hours** for an initial response

We will acknowledge your report, investigate promptly, and coordinate a fix and disclosure timeline.

## Scope

This policy covers:

- `@vaagatech/reconcile-engine`
- `@vaagatech/reconcile-auth-adapters`
- `@vaagatech/reconcile-api-adapters`
- `@vaagatech/reconcile-core`

## Best practices for consumers

- Never commit credentials (`CLIENT_SECRET`, passwords, tokens) to source control
- Use environment variables or a secrets manager for auth config
- Pin package versions in production CI pipelines
- Review transformation and mapping functions — they execute on live test data

## License

Security fixes are released under the same [MIT License](LICENSE) as the project.
