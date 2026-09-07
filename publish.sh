#!/usr/bin/env bash
# =====================================================================
#  전체 갱신 파이프라인
#      ./publish.sh          내용 갱신 + CV 컴파일 + 사이트 렌더 (로컬 확인)
#      ./publish.sh deploy   위 전부 + GitHub Pages 배포
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

echo "[1/4] data/profile.yml + Notion → partial 생성"
python scripts/build.py "${OFFLINE:-}"

echo "[2/4] LaTeX CV 컴파일"
( cd cv && latexmk -interaction=nonstopmode cv.tex >/dev/null )   # latexmkrc 가 XeLaTeX 지정
cp cv/cv.pdf assets/CV_HojunKang.pdf
echo "     assets/CV_HojunKang.pdf 갱신"

echo "[3/4] 사이트 렌더"
quarto render

if [[ "${1:-}" == "deploy" ]]; then
  echo "[4/4] GitHub Pages 배포"
  quarto publish gh-pages --no-prompt
else
  echo "[4/4] 배포 생략 — 확인하려면:  quarto preview"
fi
