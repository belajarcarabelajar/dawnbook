# Glossary

Terms used in Dawnbook plans, specs, rules and tests. Meanings only; decisions live in `GEMINI.md` and the specs under `docs/code-plan/specs/`.

- **Diagram block:** a fenced code block in chapter Markdown whose info string starts with `mermaid`.
- **Diagram cache:** the committed per-book folder of rendered SVG files, one per distinct diagram, named by content hash.
- **Render config:** the locked Mermaid configuration plus the theme stylesheet that every diagram render uses; part of the cache key.
- **Grounded diagram:** a diagram whose every node, edge, label and number can be traced to lines of the same chapter.
