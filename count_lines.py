import os
from collections import Counter

EXTENSIONS = {
    ".go": "Go",
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TSX",
    ".jsx": "JSX",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".sql": "SQL",
    ".sh": "Shell",
}

IGNORE = {
    ".git", "node_modules", "vendor", "dist", "build",
    ".next", "__pycache__", ".venv", "venv"
}

counts = Counter()

for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in IGNORE]

    for file in files:
        ext = os.path.splitext(file)[1].lower()

        if ext in EXTENSIONS:
            try:
                with open(
                    os.path.join(root, file),
                    "r",
                    encoding="utf-8",
                    errors="ignore"
                ) as f:
                    counts[EXTENSIONS[ext]] += sum(1 for _ in f)
            except Exception:
                pass

for language, lines in counts.most_common():
    print(f"{language:15} {lines:>10,}")

print("-" * 30)
print(f"{'TOTAL':15} {sum(counts.values()):>10,}")