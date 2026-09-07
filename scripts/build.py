#!/usr/bin/env python3
"""
data/profile.yml + Notion "논문프로세스" DB  →  홈페이지 partial + LaTeX CV partial

    python scripts/build.py            # Notion 조회 후 전체 생성
    python scripts/build.py --offline  # 캐시(data/notion_cache.json)만 사용

논문은 APA 7판 형식으로 출력하고, 심사 중인 원고는 라운드와 결정 상태를 함께 적는다.

생성물 (직접 수정하지 마세요, 다시 실행하면 덮어씁니다):
    _includes/publications.md
    _includes/working-papers.md
    _includes/conferences.md
    cv/_generated.tex
    assets/publications.bib
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
NOTION_SCRIPT = Path.home() / ".claude" / "skills" / "paper-tracker" / "scripts" / "notion_db.py"
CACHE = ROOT / "data" / "notion_cache.json"

ME = "Hojun Kang"


# --------------------------------------------------------------------------- #
# 문자열 유틸
# --------------------------------------------------------------------------- #
def clean(s) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", str(s)).strip().strip("'’")


def tex_escape(s: str) -> str:
    repl = {"&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#", "_": r"\_",
            "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}",
            "^": r"\textasciicircum{}"}
    out = "".join(repl.get(c, c) for c in s)
    return (out.replace("–", "--").replace("—", "---")
               .replace("’", "'").replace("‘", "'")
               .replace("“", "``").replace("”", "''"))


def end_punct(title: str) -> str:
    """제목이 ?, !, . 로 끝나면 마침표를 덧붙이지 않는다."""
    return "" if title.rstrip().endswith(("?", "!", ".")) else "."


# --------------------------------------------------------------------------- #
# APA 저자 표기
# --------------------------------------------------------------------------- #
def apa_name(full: str, overrides: dict) -> str:
    """'Sang-Gun Lee' → 'Lee, S.-G.'   'Nam Joo Hong' → 'Hong, N. J.'"""
    full = clean(full)
    if full in overrides:
        return overrides[full]
    parts = full.split()
    if len(parts) == 1:
        return full
    surname, given = parts[-1], parts[:-1]
    initials = []
    for g in given:
        # 하이픈 이름은 각 조각의 첫 글자를 하이픈으로 잇는다: Sang-Gun → S.-G.
        initials.append("-".join(f"{seg[0].upper()}." for seg in g.split("-") if seg))
    return f"{surname}, {' '.join(initials)}"


def apa_author_list(authors: list[str], overrides: dict, markup=None, amp: str = "&") -> str:
    """APA 저자열. markup(name, apa) 로 본인 이름 강조를 주입한다.
    amp 는 LaTeX 출력에서 이스케이프된 앰퍼샌드를 넘기기 위한 것이다."""
    names = []
    for a in authors:
        rendered = apa_name(a, overrides)
        names.append(markup(a, rendered) if markup else rendered)
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]}, {amp} {names[1]}"
    return ", ".join(names[:-1]) + f", {amp} {names[-1]}"


# --------------------------------------------------------------------------- #
# Notion
# --------------------------------------------------------------------------- #
def fetch_notion(offline: bool) -> list[dict]:
    if offline:
        if not CACHE.exists():
            sys.exit(f"캐시가 없습니다: {CACHE}  (--offline 없이 한 번 실행하세요)")
        return json.loads(CACHE.read_text(encoding="utf-8"))

    if not NOTION_SCRIPT.exists():
        print(f"! paper-tracker 스크립트를 찾지 못했습니다. 캐시로 대체합니다.")
        return fetch_notion(True)

    proc = subprocess.run([sys.executable, str(NOTION_SCRIPT), "list", "--json"],
                          capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        print("! Notion 조회 실패, 캐시로 대체합니다.\n" + (proc.stderr or "")[:400])
        return fetch_notion(True)

    rows = json.loads(proc.stdout)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    return rows


def status_of(row: dict) -> tuple[str, str, str]:
    """(섹션, 상태 문구, 배지 클래스). 게재 확정/리젝은 별도 처리."""
    process = row.get("프로세스")
    decision = row.get("에디터 결정 상태")
    rnd = int(row.get("라운드") or 0)

    if process in ("Under Review", "Submit"):
        # 라운드가 있고 직전 결정이 있으면 리비전 후 재투고 상태다
        if rnd and decision in ("Major", "Minor"):
            return ("revision", f"Resubmitted after {decision.lower()} revision", "b-rev")
        return ("under_review", "", "b-under")
    if process in ("Major", "Minor"):
        return ("revision", f"{process} revision", "b-rev")
    return ("", "", "")


def working_papers(rows: list[dict], cfg: dict) -> dict[str, list[dict]]:
    overrides = cfg.get("notion_overrides") or {}
    summaries = cfg.get("working_paper_summaries") or {}
    buckets: dict[str, list[dict]] = {
        "forthcoming": [], "revision": [], "under_review": [], "in_progress": []}

    for r in rows:
        if r.get("프로세스") in ("Reject", "Withdrawn"):
            continue

        project = clean(r.get("프로젝트"))
        ov = overrides.get(project, {}) or {}

        title = clean(ov.get("title") or r.get("제목"))
        if not title:
            continue
        journal = clean(ov.get("journal") or r.get("목표저널"))

        # 저자 순서: 오버라이드 > (1저자면 나+공저자, 그 외면 공저자+나)
        if ov.get("authors"):
            authors = list(ov["authors"])
        else:
            co = [clean(c) for c in (r.get("공저자") or [])]
            authors = [ME] + co if r.get("저자순위") == "1저자" else co + [ME]

        year = (clean(r.get("제출날짜")) or clean(r.get("첫투고")) or "")[:4]
        entry = dict(project=project,
                     title=title, journal=journal, authors=authors, year=year,
                     summary=clean(summaries.get(project, "")),
                     order=r.get("숫자") or 0,
                     round=int(r.get("라운드") or 0))

        if r.get("프로세스") == "Accept":
            entry.update(status="Forthcoming", cls="b-accept")
            buckets["forthcoming"].append(entry)
            continue

        section, status, cls = status_of(r)
        if section:
            entry.update(status=status, cls=cls)
            buckets[section].append(entry)
        elif r.get("진행상황") in ("작성완료", "데이터분석완료"):
            # 미투고 원고는 목표 저널을 밝히지 않는다
            entry.update(journal="", status="", cls="b-under")
            buckets["in_progress"].append(entry)

    featured = cfg.get("featured_under_review") or []
    if featured:
        keep = {clean(f) for f in featured}
        buckets["under_review"] = [p for p in buckets["under_review"]
                                   if p["project"] in keep]

    for v in buckets.values():
        v.sort(key=lambda p: -p["order"])
    return buckets


# --------------------------------------------------------------------------- #
# Markdown (website)
# --------------------------------------------------------------------------- #
def md_apa(authors, year, title, source, status, cls, overrides, summary="") -> str:
    def mark(name, rendered):
        return f"[{rendered}]{{.me}}" if name == ME else rendered
    a = apa_author_list(authors, overrides, mark)
    yr = f" ({year})." if year else ("" if a.endswith(".") else ".")
    out = ["::: {.pub}",
           f"[{a}{yr} {title}{end_punct(title)}]{{.apa}} {source}"]
    if status:
        out.append(f"[{status}]{{.badge-status .{cls}}}")
    if summary:
        out.append(f"<br>[{summary}]{{.pub-summary}}")
    out.append(":::\n")
    return "\n".join(out)


def write_publications_md(cfg: dict, forthcoming: list[dict]) -> str:
    ov = cfg.get("apa_name_overrides") or {}
    parts = []
    for p in forthcoming:
        src = f"*{p['journal']}*." if p["journal"] else ""
        parts.append(md_apa(p["authors"], "in press", p["title"], src,
                            "Forthcoming", "b-accept", ov, p.get("summary", "")))
    for p in cfg["publications"]:
        src = f"*{p['venue']}*"
        if p.get("pages"):
            src += f", {p['pages']}"
        src += "."
        parts.append(md_apa(p["authors"], p.get("year"), p["title"], src,
                            p["index"], "b-q1", ov, clean(p.get("summary", ""))))
    if cfg.get("books"):
        parts.append("\n### Books\n")
        for b in cfg["books"]:
            parts.append(md_apa(b["authors"], b["year"], b["title"],
                                f"{b['venue']}.", "", "", ov))
    return "\n".join(parts)


def write_working_md(buckets: dict, cfg: dict) -> str:
    ov = cfg.get("apa_name_overrides") or {}
    parts = []
    for key, heading in [("revision", "### Revise and resubmit"),
                         ("under_review", "### Under review"),
                         ("in_progress", "### Work in progress")]:
        if not buckets[key]:
            continue
        parts.append(heading + "\n")
        for p in buckets[key]:
            src = f"*{p['journal']}*." if p["journal"] else ""
            parts.append(md_apa(p["authors"], p["year"], p["title"], src,
                                p["status"], p["cls"], ov, p["summary"]))
    return "\n".join(parts)


def write_conferences_md(cfg: dict) -> str:
    ov = cfg.get("apa_name_overrides") or {}
    parts = []
    for c in cfg["conferences"]:
        def mark(name, rendered):
            return f"[{rendered}]{{.me}}" if name == ME else rendered
        a = apa_author_list(c["authors"], ov, mark)
        parts.append("::: {.pub}\n"
                     f"[{a} ({c['date']}). {c['title']}]{{.apa}} "
                     f"[{c['venue']}, {c['location']}.]{{.venue}}\n:::\n")
    return "\n".join(parts)


# --------------------------------------------------------------------------- #
# LaTeX
# --------------------------------------------------------------------------- #
def tex_apa(authors, year, title, source, status, overrides) -> str:
    def mark(name, rendered):
        return rf"\me{{{tex_escape(rendered)}}}" if name == ME else tex_escape(rendered)
    a = apa_author_list(authors, overrides, mark, amp=r"\&")
    yr = (f" ({tex_escape(str(year))})." if year
          else ("" if a.rstrip("}").endswith(".") else "."))
    body = f"{a}{yr} {tex_escape(title)}{end_punct(title)}"
    if source:
        body += f" {source}"
    if status:
        macro = "statusok" if status in ("Accepted", "Forthcoming") else "status"
        body += rf" \{macro}{{{tex_escape(status)}}}"
    return rf"\pub{{{body}}}"


def write_cv_tex(cfg: dict, buckets: dict) -> str:
    ov = cfg.get("apa_name_overrides") or {}
    L = ["% 이 파일은 scripts/build.py 가 생성합니다. 직접 고치지 마세요.", ""]

    L.append(r"\section{Education}")
    for e in cfg["education"]:
        note = clean(e.get("note", ""))
        L.append(rf"\entry{{{tex_escape(e['period'])}}}{{{tex_escape(e['degree'])}}}"
                 rf"{{{tex_escape(e['institution'] + ', ' + e['location'])}}}"
                 rf"{{{tex_escape(note)}}}")
    L.append("")

    L.append(r"\section{Academic Appointments}")
    for a in cfg["appointments"]:
        detail = r"\newline ".join(tex_escape(d) for d in a.get("detail", []))
        L.append(rf"\entry{{{tex_escape(a['period'])}}}{{{tex_escape(a['role'])}}}"
                 rf"{{{tex_escape(a['org'])}}}{{{detail}}}")
    L.append("")

    # ---- Publications ----
    L.append(r"\section{Publications}")
    if buckets["forthcoming"]:
        L.append(r"\subsection{Forthcoming}")
        for p in buckets["forthcoming"]:
            src = rf"\emph{{{tex_escape(p['journal'])}}}." if p["journal"] else ""
            L.append(tex_apa(p["authors"], "in press", p["title"], src, "Accepted", ov))
    L.append(r"\subsection{Refereed journal articles}")
    for p in cfg["publications"]:
        src = rf"\emph{{{tex_escape(p['venue'])}}}"
        if p.get("pages"):
            src += ", " + tex_escape(p["pages"])
        src += "."
        L.append(tex_apa(p["authors"], p.get("year"), p["title"], src, p["index"], ov))
    if cfg.get("books"):
        L.append(r"\subsection{Books}")
        for b in cfg["books"]:
            L.append(tex_apa(b["authors"], b["year"], b["title"],
                             tex_escape(b["venue"]) + ".", "", ov))
    L.append("")

    # ---- Working papers ----
    L.append(r"\section{Working Papers}")
    for key, head in [("revision", "Revise and resubmit"),
                      ("under_review", "Under review"),
                      ("in_progress", "Work in progress")]:
        if not buckets[key]:
            continue
        L.append(rf"\subsection{{{head}}}")
        for p in buckets[key]:
            src = rf"\emph{{{tex_escape(p['journal'])}}}." if p["journal"] else ""
            L.append(tex_apa(p["authors"], p["year"], p["title"], src, p["status"], ov))
    L.append("")

    L.append(r"\section{Conference Presentations}")
    for c in cfg["conferences"]:
        src = tex_escape(f"{c['venue']}, {c['location']}.")
        L.append(tex_apa(c["authors"], c["date"], c["title"], src, "", ov))
    L.append("")

    L.append(r"\section{Funded Projects}")
    for p in cfg["projects"]:
        L.append(rf"\entry{{{tex_escape(p['period'])}}}{{{tex_escape(p['title'])}}}"
                 rf"{{{tex_escape(p['funder'])}}}{{}}")
    L.append("")

    L.append(r"\section{Honors and Awards}")
    for h in cfg["honors"]:
        L.append(rf"\entry{{{tex_escape(h['date'])}}}{{{tex_escape(h['name'])}}}"
                 rf"{{{tex_escape(h['org'])}}}{{}}")
    L.append("")
    return "\n".join(L)


def write_bib(cfg: dict) -> str:
    def key(p):
        first = p["authors"][0].split()[-1].lower()
        word = re.sub(r"[^a-z]", "", p["title"].split(":")[0].split()[0].lower())
        return f"{first}{p.get('year', 'nd')}{word}"
    out = []
    for p in cfg["publications"]:
        out.append("@article{%s,\n  author  = {%s},\n  title   = {{%s}},\n"
                   "  journal = {%s},\n  year    = {%s},\n  note    = {%s}\n}\n"
                   % (key(p), " and ".join(p["authors"]), p["title"],
                      p["venue"], p.get("year", ""), p["index"]))
    for b in cfg.get("books", []):
        out.append("@book{%s,\n  author    = {%s},\n  title     = {{%s}},\n"
                   "  publisher = {%s},\n  year      = {%s}\n}\n"
                   % (key(b), " and ".join(b["authors"]), b["title"],
                      b["venue"], b["year"]))
    return "\n".join(out)


# --------------------------------------------------------------------------- #
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true", help="Notion 조회 없이 캐시만 사용")
    args = ap.parse_args()

    cfg = yaml.safe_load((ROOT / "data" / "profile.yml").read_text(encoding="utf-8"))
    buckets = working_papers(fetch_notion(args.offline), cfg)

    (ROOT / "_includes").mkdir(exist_ok=True)
    outputs = {
        ROOT / "_includes" / "publications.md":   write_publications_md(cfg, buckets["forthcoming"]),
        ROOT / "_includes" / "working-papers.md": write_working_md(buckets, cfg),
        ROOT / "_includes" / "conferences.md":    write_conferences_md(cfg),
        ROOT / "cv" / "_generated.tex":           write_cv_tex(cfg, buckets),
        ROOT / "assets" / "publications.bib":     write_bib(cfg),
    }
    for path, text in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        print(f"  wrote {path.relative_to(ROOT)}")

    n = {k: len(v) for k, v in buckets.items()}
    print(f"\n게재 {len(cfg['publications'])} · 게재확정 {n['forthcoming']} · "
          f"리비전 {n['revision']} · 심사중 {n['under_review']} · 작성중 {n['in_progress']}")


if __name__ == "__main__":
    main()
