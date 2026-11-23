// 사이트 문항 1~8. 학생 화면(index.html)과 교수 화면(board.html)이 함께 씀. 문항 글과 보기는 여기서만 고침.
// 월요일(11-23) 덱 week13-1-decompose 가 문항 1~4, 수요일(11-25) 덱 week13-2-segment 가 문항 5~8.
//
// 보기 순서: options 배열 순서가 곧 화면의 (가)(나)(다)(라) 순서.
//   순서를 바꾸려면 배열 안의 { ... } 덩어리를 통째로 옮기면 됨. 글자 (가)~(라)는 자리 순서대로 자동으로 붙음.
//   id(C2 등)는 답안 저장 · 정답 판정에 쓰이므로 바꾸지 않음 (apps-script/Code.gs 의 CHOICES 와 같아야 함).
// 정답, 보기별 설명, 업종별 정답값은 이 파일에 두지 않음 (서버 코드에만 있고, 교수 화면이 비밀번호를 넣은 뒤 받음).

window.CLASS_TITLE = "빅데이터와 비즈니스인텔리전스 · 수업 응답";
window.STUDENT_URL = "hjkang-rep.github.io/class/bi13";

// 학생 화면은 한 묶음(네 문항)씩 보여 줌. from 날짜부터 그 묶음을 먼저 보여 줌
window.GROUPS = [
  { name: "월요일 문항 1~4", short: "월 1~4", qs: [1, 2, 3, 4], from: "2026-11-23" },
  { name: "수요일 문항 5~8", short: "수 5~8", qs: [5, 6, 7, 8], from: "2026-11-25" }
];

window.QUESTIONS = [
  {
    q: 1,
    tab: "쿼리 고르기",
    type: "choice",
    layout: "code2",
    boardLines: 2,   // 교수 화면에는 서로 다른 앞 두 줄만 보임
    title: "커피-음료 2026년 2분기의 건당 금액(원)을 바르게 구하는 쿼리는 넷 중 어느 것인가",
    help: "실행하지 말고 읽어서 고름. 네 쿼리의 FROM, WHERE는 같음",
    options: [
      { id: "H7", code: "SELECT ROUND(AVG(1.0 * 당월_매출_금액\n             / 당월_매출_건수), 1)\n       AS 건당\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 = 20262;" },
      { id: "C2", code: "SELECT ROUND(1.0 * SUM(당월_매출_금액)\n             / SUM(당월_매출_건수), 1)\n       AS 건당\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 = 20262;" },
      { id: "W5", code: "SELECT ROUND(SUM(1.0 * 당월_매출_금액\n             / 당월_매출_건수), 1)\n       AS 건당\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 = 20262;" },
      { id: "P9", code: "SELECT ROUND(1.0 * SUM(당월_매출_금액)\n             / COUNT(*), 1)\n       AS 건당\nFROM   sales\nWHERE  서비스_업종_코드_명 = '커피-음료'\n  AND  기준_년분기_코드 = 20262;" }
    ]
  },
  {
    q: 2,
    tab: "증가 구성",
    type: "choice",
    layout: "text1",
    title: "커피-음료 매출이 1년 사이 3.4% 늘었다. 결제 건수와 건당 금액은 어떻게 변했을까?",
    help: "2025년 2분기 7,046.3억 원 → 2026년 2분기 7,285.8억 원. 실행하기 전에 고름",
    options: [
      { id: "B4", label: "결제 건수가 늘어 매출이 늘었고, 건당 금액은 줄었다" },
      { id: "N8", label: "건당 금액이 올라 매출이 늘었고, 결제 건수는 줄었다" },
      { id: "K1", label: "결제 건수와 건당 금액이 둘 다 조금씩 늘었다" },
      { id: "S6", label: "결제 건수는 그대로이고, 건당 금액만 3.4% 올랐다" }
    ]
  },
  {
    q: 3,
    tab: "비교 분기",
    type: "choice",
    layout: "text1",
    title: "커피-음료의 2026년 2분기 건당 금액은 7,902.3원. 1년 동안 건당 금액이 어떻게 변했는지 보려면 어느 것과 비교해야 하나?",
    help: "실행하지 말고 고름",
    options: [
      { id: "D3", label: "바로 전 분기: 2026년 1분기, 건당 금액 8,376.3원" },
      { id: "G9", label: "전년 같은 분기: 2025년 2분기, 건당 금액 7,758.1원" },
      { id: "L5", label: "2025년 한 해 전체(네 분기를 합쳐 계산), 건당 금액 7,986.9원" },
      { id: "V2", label: "자료의 첫 분기: 2024년 1분기, 건당 금액 8,202.4원" }
    ]
  },
  {
    q: 4,
    tab: "분해표",
    type: "make",
    board: "bi4",
    title: "내 업종의 분해표와 결정 문장",
    help: "w13_decompose.sql의 [4], [5], [6] 결과로 채움. 커피-음료와 치킨전문점은 예로 풀었으므로 목록에 없음",
    // 곱셈 확인에 쓰는 세 칸: 매출, 건수, 건당 순서
    mult: ["growth_sales", "growth_count", "growth_ticket"],
    fields: [
      { key: "industry", label: "1. 업종", kind: "select", source: "IND4" },
      { key: "ticket_2026q2", label: "2. 2026년 2분기 건당 금액(원)", kind: "number", unit: "원", req: true, pos: true, dec: 1, example: "예: 7902.3" },
      { key: "growth_sales", label: "3. 매출 증가율(%)", kind: "number", unit: "%", req: true, dec: 1, example: "예: 3.4" },
      { key: "growth_count", label: "4. 결제 건수 증가율(%)", kind: "number", unit: "%", req: true, dec: 1, example: "예: -8.1", note: "줄었으면 앞에 - 를 붙임" },
      { key: "growth_ticket", label: "5. 건당 금액 증가율(%)", kind: "number", unit: "%", req: true, dec: 1, example: "예: 8.2", after: "mult" },
      { key: "sentence", label: "6. 결정 문장 (숫자 → 의미 → 행동)", kind: "text", minLen: 15, maxLen: 300,
        example: "한 문장. 증가율 숫자를 넣음" }
    ]
  },
  {
    q: 5,
    tab: "변화 금액",
    type: "choice",
    layout: "small",
    title: "커피-음료 매출이 1년 사이 239.5억 원 늘었다. 늘어난 금액이 가장 큰 상권 구분은?",
    help: "[2]의 증감률: 관광특구 4.2%, 골목상권 3.7%, 발달상권 3.5%, 전통시장 -0.4%. [3]을 실행하기 전에 고름",
    options: [
      { id: "A3", label: "관광특구" },
      { id: "F8", label: "골목상권" },
      { id: "J2", label: "발달상권" },
      { id: "Q6", label: "전통시장" }
    ]
  },
  {
    q: 6,
    tab: "기여",
    type: "number",
    unit: "%p",
    dec: 2,   // 학생 화면에서 소수 둘째 자리까지만 받음
    example: "예: 0.65",
    title: "발달상권의 기여(%p)를 소수 둘째 자리까지 적으세요",
    help: "기여 = 구분의 변화 금액 ÷ 커피-음료 전체의 작년 매출 × 100. 골목상권은 45.8 ÷ 7,046.3 × 100 = 0.65"
  },
  {
    q: 7,
    tab: "비중",
    type: "choice",
    layout: "text1",
    title: "관광특구는 증감률이 4.2%로 넷 중 가장 높은데, 기여는 0.33%p로 발달상권(2.44%p)보다 훨씬 작다. 이유는?",
    help: "[4]의 결과를 보고 고름",
    options: [
      { id: "E5", label: "관광특구의 작년 매출이 업종 전체의 7.7%뿐이라서" },
      { id: "H1", label: "관광특구 상권이 6곳뿐이라서" },
      { id: "N4", label: "관광특구의 증감률을 반올림해서" },
      { id: "Z7", label: "관광특구의 2026년 2분기 매출이 줄어서" }
    ]
  },
  {
    q: 8,
    tab: "내 업종",
    type: "make",
    board: "bi8",
    title: "내 업종의 구분별 분해와 결정 문장",
    help: "w13_segment.sql의 [1], [4] 결과로 채움. 커피-음료와 치킨전문점은 예로 풀었고, 완구는 한 구분의 작년 자료가 없어 목록에 없음",
    fields: [
      { key: "industry", label: "1. 업종", kind: "select", source: "IND8" },
      { key: "growth_total", label: "2. 업종 전체 매출 증감률(%)", kind: "number", unit: "%", req: true, dec: 1, example: "예: 3.4" },
      { key: "top_seg", label: "3. 전체 변화를 가장 크게 움직인 구분 (기여의 부호를 떼고 가장 큰 구분)", kind: "select", source: "SEGS", pick: "구분" },
      { key: "top_pp", label: "4. 그 구분의 기여(%p)", kind: "number", unit: "%p", req: true, dec: 2, example: "예: -0.99", note: "줄였으면 앞에 - 를 붙임" },
      { key: "n_down", label: "5. 매출이 줄어든 구분 수", kind: "number", unit: "개", req: true, integer: true, min: 0, max: 4, example: "0~4" },
      { key: "sentence", label: "6. 결정 문장 (숫자 → 의미 → 행동)", kind: "text", minLen: 15, maxLen: 300,
        example: "한 문장. 기여 숫자를 넣음" }
    ]
  }
];

// 문항 8 의 구분 목록 (apps-script/Code.gs 의 SEGS 와 같아야 함)
window.SEGS = ["발달상권", "골목상권", "관광특구", "전통시장"];

// ▼▼▼ 업종 목록 시작 (계산 스크립트가 채움. 손으로 고치지 않음) ▼▼▼
// 문항 4 업종 60개 (서비스_업종_코드_명 그대로, 가나다순. 예로 푼 커피-음료 · 치킨전문점은 뺌)
window.IND4 = [
  "PC방", "가구", "가방", "가전제품", "가전제품수리", "골프연습장",
  "네일숍", "노래방", "당구장", "문구", "미곡판매", "미용실",
  "반찬가게", "부동산중개업", "분식전문점", "서적", "섬유제품", "세탁소",
  "수산물판매", "슈퍼마켓", "스포츠 강습", "스포츠클럽", "시계및귀금속", "신발",
  "안경", "애완동물", "양식음식점", "여관", "예술학원", "완구",
  "외국어학원", "운동/경기용품", "육류판매", "의료기기", "의약품", "인테리어",
  "일반교습학원", "일반의류", "일반의원", "일식음식점", "자동차미용", "자동차수리",
  "자전거 및 기타운송장비", "전자상거래업", "제과점", "조명용품", "중식음식점", "철물점",
  "청과상", "치과의원", "컴퓨터및주변장치판매", "패스트푸드점", "편의점", "피부관리실",
  "한식음식점", "한의원", "핸드폰", "호프-간이주점", "화장품", "화초"
];
// 문항 8 업종 59개 (2026년 2분기 자료에 있는 62개에서 예로 푼 커피-음료 · 치킨전문점과,
//   골목상권의 2025년 2분기 매출이 없는 완구를 뺌. 이름 그대로, 가나다순)
window.IND8 = [
  "PC방", "가구", "가방", "가전제품", "가전제품수리", "골프연습장",
  "네일숍", "노래방", "당구장", "문구", "미곡판매", "미용실",
  "반찬가게", "부동산중개업", "분식전문점", "서적", "섬유제품", "세탁소",
  "수산물판매", "슈퍼마켓", "스포츠 강습", "스포츠클럽", "시계및귀금속", "신발",
  "안경", "애완동물", "양식음식점", "여관", "예술학원", "외국어학원",
  "운동/경기용품", "육류판매", "의료기기", "의약품", "인테리어", "일반교습학원",
  "일반의류", "일반의원", "일식음식점", "자동차미용", "자동차수리", "자전거 및 기타운송장비",
  "전자상거래업", "제과점", "조명용품", "중식음식점", "철물점", "청과상",
  "치과의원", "컴퓨터및주변장치판매", "패스트푸드점", "편의점", "피부관리실", "한식음식점",
  "한의원", "핸드폰", "호프-간이주점", "화장품", "화초"
];
// ▲▲▲ 업종 목록 끝 ▲▲▲

// 숫자 읽기: "12.5", "12.50", "12.5%", "0.65%p", "-4.2", 유니코드 빼기 기호로 쓴 -4.2, "12,5"(쉼표 소수점), "1,234.5"(천 단위 쉼표), "1234.5원", "1234.5억"
// 읽을 수 없으면 null. 학생 화면이 이 함수로 읽은 값을 저장하고, 원문도 함께 보냄.
window.parseNumber = function (raw) {
  if (raw === null || raw === undefined) return null;
  var s = String(raw).normalize ? String(raw).normalize("NFKC") : String(raw);
  var dash = new RegExp("[" + [0x2212, 0x2012, 0x2013, 0x2014, 0x2015, 0xFE63, 0xFF0D].map(function (c) { return String.fromCharCode(c); }).join("") + "]", "g");
  s = s.replace(dash, "-");   // 여러 가지 빼기 · 대시 기호를 - 로
  s = s.replace(/\s+/g, "").replace(/(퍼센트포인트|%포인트|%p|%P|퍼센트|%|억원|억|원|개사|개|곳)$/g, "").replace(/%/g, "");
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^[+-]?\d*,\d+$/.test(s)) s = s.replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  var v = Number(s);
  return isFinite(v) ? v : null;
};
