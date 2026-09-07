# 개인 홈페이지 + CV

Quarto 웹사이트와 LaTeX CV가 **하나의 소스**를 공유합니다.

```
data/profile.yml ──┐
                   ├──▶ scripts/build.py ──▶ _includes/*.md ──▶ Quarto 사이트
Notion 논문프로세스 ─┘                     └▶ cv/_generated.tex ─▶ cv/cv.tex ─▶ cv.pdf
```

- **게재 논문 · 경력 · 프로젝트 · 수상** → `data/profile.yml` 에서 직접 관리
- **심사 중 논문(working paper)** → Notion "논문프로세스" DB에서 자동으로 가져옴.
  Notion에서 상태만 바꾸면 홈페이지와 CV가 함께 따라옵니다.

논문은 모두 **APA 7판** 형식으로 출력되며, Notion의 `프로세스`·`에디터 결정 상태`·`라운드`를
읽어 상태 문구를 만듭니다:

| Notion 상태 | 출력 |
|---|---|
| `Accept` | Publications → Forthcoming (초록 태그) |
| `Under Review` / `Submit`, 라운드 0 | Manuscript submitted for publication |
| `Under Review`, 직전 결정 Major/Minor + 라운드 ≥ 1 | Resubmitted after major/minor revision (round N) |
| `Major` / `Minor` | Major/Minor revision invited (round N) |
| `Reject` / `Withdrawn` | 출력하지 않음 |
| 미투고 + 작성완료/데이터분석완료 | Work in progress (목표 저널 비공개) |

Notion `공저자` 가 비어 있거나 순서가 다르면 `data/profile.yml` 의 `notion_overrides` 에서
저자·제목·저널을 덮어씁니다.

---

## 처음 한 번만: 설치

Quarto가 아직 없습니다. 설치하세요:

```bash
winget install --id Posit.Quarto -e
```

나머지(Python, PyYAML, TeX Live, latexmk, git)는 이미 설치되어 있습니다.

## 평소 작업

논문이 억셉됐거나 경력이 바뀌었을 때:

1. `data/profile.yml` 수정 (Notion에서 관리되는 working paper는 건드릴 필요 없음)
2. 실행:

```bash
bash publish.sh
```

3. 브라우저로 확인:

```bash
quarto preview
```

4. 문제없으면 배포:

```bash
bash publish.sh deploy
```

Notion 연결이 안 될 때는 마지막에 받아둔 캐시로 진행합니다:

```bash
OFFLINE=--offline bash publish.sh
```

## CV만 다시 뽑기

```bash
python scripts/build.py && cd cv && latexmk cv.tex
```

CV는 **XeLaTeX**으로 빌드합니다 (`cv/latexmkrc` 가 지정). 본문은 Libertinus Serif,
한글 이름은 맑은 고딕으로 자동 전환됩니다.

서식(폰트·여백·색·섹션 스타일)은 `cv/cv.tex` 상단에서 고칩니다.
`cv/_generated.tex` 는 매번 덮어써지므로 직접 수정하지 마세요.

---

## GitHub Pages 배포 (최초 1회)

```bash
git init && git add -A && git commit -m "Initial site"
gh repo create hojunkang-web --public --source=. --push
quarto publish gh-pages
```

`gh` CLI가 없으면 github.com에서 저장소를 만든 뒤 `git remote add origin ...` 로 연결하세요.
공개 주소는 `https://<github-아이디>.github.io/hojunkang-web/` 이 됩니다.
개인 도메인을 붙이려면 `_quarto.yml` 에 `site-url` 을 넣고 저장소 Settings → Pages에서 지정합니다.

## 파일 구조

| 경로 | 역할 |
|---|---|
| `data/profile.yml` | **여기만 고치면 됩니다.** 게재 논문·경력·프로젝트·수상 |
| `scripts/build.py` | YAML + Notion → 사이트/CV partial 생성 |
| `_includes/` | 자동 생성 (수정 금지) |
| `cv/cv.tex` | CV 서식 |
| `cv/_generated.tex` | 자동 생성 (수정 금지) |
| `index.qmd` `research.qmd` `teaching.qmd` `cv.qmd` | 페이지 |
| `styles.scss` | 사이트 디자인 |
| `publish.sh` | 전체 빌드 + 배포 |

## 아직 채워야 할 것

- `data/profile.yml` 의 `scholar`, `orcid` — Google Scholar / ORCID 주소
- `teaching.qmd` 의 담당 과목
- `index.qmd` 의 News 항목
