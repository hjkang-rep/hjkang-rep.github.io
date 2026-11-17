// 사이트 문항 1~4. 학생 화면(index.html)과 교수 화면(board.html)이 함께 씀.
// 문항 글과 보기는 여기서만 고침.
//
// 보기 순서: 문항 1의 options 배열 순서가 곧 화면의 (가)(나)(다)(라) 순서.
//   순서를 바꾸려면 배열 안의 { ... } 덩어리를 통째로 옮기면 됨. 글자 (가)~(라)는 자리 순서대로 자동으로 붙음.
//   id(SUM 등)는 답안 저장 · 정답 판정에 쓰이므로 바꾸지 않음 (apps-script/Code.gs 의 CHOICES 와 같아야 함).
// 정답과 업종별 정답값은 이 파일에 두지 않음 (서버 코드에만 있고, 교수 화면이 비밀번호를 넣은 뒤 받음).

window.CLASS_TITLE = "빅데이터와 비즈니스인텔리전스 · 응답";
window.STUDENT_URL = "hjkang-rep.github.io/class/bi12";

window.QUESTIONS = [
  {
    q: 1,
    tab: "카드 1",
    type: "choice",
    title: "커피-음료 2026년 2분기 매출 카드를 내는 쿼리는?",
    help: "카드에 들어갈 숫자 하나를 내는 쿼리를 고르세요.",
    // 순서와 SQL 은 week12/cards.sql 의 [1] (가)~(라) 와 같음
    options: [
      {
        id: "NOQ",
        short: "SUM, 분기 조건 없음",
        sql: "SELECT ROUND(SUM(당월_매출_금액) / 1e8, 1)\n       AS 매출_억\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료';"
      },
      {
        id: "AVG",
        short: "AVG, 2026년 2분기",
        sql: "SELECT ROUND(AVG(당월_매출_금액) / 1e8, 1)\n       AS 매출_억\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 = 20262;"
      },
      {
        id: "SUM",
        short: "SUM, 2026년 2분기",
        sql: "SELECT ROUND(SUM(당월_매출_금액) / 1e8, 1)\n       AS 매출_억\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 = 20262;"
      },
      {
        id: "Y2026",
        short: "SUM, 기준_년분기_코드 / 10 = 2026",
        sql: "SELECT ROUND(SUM(당월_매출_금액) / 1e8, 1)\n       AS 매출_억\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 / 10 = 2026;"
      }
    ]
  },
  {
    q: 2,
    tab: "카드 2",
    type: "number",
    title: "구한 전년 같은 분기 대비 증감률(%)을 적으세요",
    help: "커피-음료 2026년 2분기 매출 카드 아래에 넣을 값입니다. 소수 첫째 자리까지 숫자만 적으면 됩니다. 예: 12.5 또는 -4.2",
    unit: "%"
  },
  {
    q: 3,
    tab: "카드 3",
    type: "choice",
    title: "커피-음료, 2026년 2분기, GROUP BY 상권_구분_코드_명 쿼리의 결과는 몇 행일까?",
    help: "실행하기 전에 예상해서 고르세요.",
    options: [
      { id: "1", short: "1행", label: "1" },
      { id: "4", short: "4행", label: "4" },
      { id: "62", short: "62행", label: "62" },
      { id: "1064", short: "1,064행", label: "1,064" }
    ]
  },
  {
    q: 4,
    tab: "내 업종",
    type: "form",
    title: "내 업종 제출",
    help: "직접 고른 업종의 카드 숫자와 결정 문장을 적으세요. 숫자는 쿼리 결과를 그대로 옮기면 됩니다.",
    fields: [
      { key: "업종", label: "업종", kind: "select", source: "TYPES" },
      { key: "매출", label: "2026년 2분기 매출", kind: "number", unit: "억 원", example: "예: 1234.5" },
      { key: "증감률", label: "전년 같은 분기 대비 증감률", kind: "number", unit: "%", example: "예: -2.1" },
      { key: "상권", label: "매출이 가장 큰 상권 구분", kind: "select", source: "AREAS" },
      { key: "비중", label: "그 상권 구분의 매출 비중", kind: "number", unit: "%", example: "예: 55.0" },
      { key: "문장", label: "결정 문장 (숫자 → 의미 → 행동)", kind: "text", max: 300 }
    ]
  }
];

window.AREAS = ["발달상권", "골목상권", "관광특구", "전통시장"];

// 서비스_업종_코드_명 62개 (2026년 2분기 자료에 있는 이름 그대로, 가나다순)
window.TYPES = [
  "PC방", "가구", "가방", "가전제품", "가전제품수리", "골프연습장", "네일숍", "노래방", "당구장", "문구",
  "미곡판매", "미용실", "반찬가게", "부동산중개업", "분식전문점", "서적", "섬유제품", "세탁소", "수산물판매", "슈퍼마켓",
  "스포츠 강습", "스포츠클럽", "시계및귀금속", "신발", "안경", "애완동물", "양식음식점", "여관", "예술학원", "완구",
  "외국어학원", "운동/경기용품", "육류판매", "의료기기", "의약품", "인테리어", "일반교습학원", "일반의류", "일반의원", "일식음식점",
  "자동차미용", "자동차수리", "자전거 및 기타운송장비", "전자상거래업", "제과점", "조명용품", "중식음식점", "철물점", "청과상", "치과의원",
  "치킨전문점", "커피-음료", "컴퓨터및주변장치판매", "패스트푸드점", "편의점", "피부관리실", "한식음식점", "한의원", "핸드폰", "호프-간이주점",
  "화장품", "화초"
];

// 숫자 읽기: "12.5", "12.50", "12.5%", "-4.2", 유니코드 빼기 기호로 쓴 -4.2, "12,5"(쉼표 소수점), "1,234.5"(천 단위 쉼표), "1234.5억"
// 읽을 수 없으면 null. 학생 화면이 이 함수로 읽은 값을 저장하고, 원문도 함께 보냄.
window.parseNumber = function (raw) {
  if (raw === null || raw === undefined) return null;
  var s = String(raw).normalize ? String(raw).normalize("NFKC") : String(raw);
  s = s.replace(/[\u2212\u2012\u2013\u2014\u2015\uFE63\uFF0D]/g, "-");   // 여러 가지 빼기 · 대시 기호를 - 로
  s = s.replace(/\s+/g, "").replace(/(퍼센트|%|억원|억|원)$/g, "").replace(/%/g, "");
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^[+-]?\d*,\d+$/.test(s)) s = s.replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  var v = Number(s);
  return isFinite(v) ? v : null;
};
